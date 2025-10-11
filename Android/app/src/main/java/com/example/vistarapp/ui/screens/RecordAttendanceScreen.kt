package com.example.vistarapp.ui.screens

import android.app.Activity
import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.cache.AttendanceCache
import com.example.vistarapp.data.model.Student
import kotlinx.coroutines.launch

@Composable
fun RecordAttendanceScreen(sessionId: String, lectureName: String) {
    val context = LocalContext.current
    val activity = context as? Activity
    val cache = remember { AttendanceCache(context) }
    var students by remember { mutableStateOf<List<Student>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var uploading by remember { mutableStateOf(false) }
    var savedDialog by remember { mutableStateOf(false) }
    val processed = remember { mutableStateListOf<String>() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(sessionId) {
        // Try server first to get freshest list, else fallback to cache
        try {
            val resp = ApiClient.service.sessionStudents(sessionId)
            if (resp.isSuccessful) {
                students = (resp.body() ?: emptyList())
                // Cache again if needed
                cache.cacheStudents(sessionId, students)
            } else {
                students = cache.getCachedStudents(sessionId)
            }
        } catch (e: Exception) {
            students = cache.getCachedStudents(sessionId)
        }
    }

    var index by remember { mutableStateOf(0) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Attendance - $lectureName", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(8.dp))
        if (students.isEmpty()) {
            Text("No students available. If offline, start session online.", color = MaterialTheme.colorScheme.error)
        } else {
            val allProcessed = students.isNotEmpty() && processed.size == students.size
            var showFinalView by remember { mutableStateOf(false) }
            LaunchedEffect(allProcessed) {
                if (allProcessed) showFinalView = true
            }

            if (allProcessed && showFinalView) {
                Column(
                    Modifier.fillMaxSize().padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("All students processed", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = { showFinalView = false; index = students.lastIndex }) { Text("Review Students") }
                        Button(onClick = {
                            scope.launch {
                                uploading = true
                                try {
                                    val ok = cache.uploadPending(ApiClient.service, sessionId)
                                    if (ok) {
                                        savedDialog = true
                                    } else {
                                        error = "Upload failed; try again later"
                                    }
                                } finally { uploading = false }
                            }
                        }) { Text(if (uploading) "Saving..." else "Save and View Attendance") }
                    }
                }
            } else {
                val current = students.getOrNull(index)
                current?.let { c ->
                    val header = listOfNotNull(c.standard?.let { "Standard: $it" }, c.div?.let { "Div: $it" }).joinToString("  •  ")
                    if (header.isNotEmpty()) {
                        Text(header, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(12.dp))
                    }
                }

            ElevatedCard(
                modifier = Modifier.fillMaxWidth().weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurface
                ),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
            ) {
                if (current != null) {
                    Column(Modifier.fillMaxSize().padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(36.dp).background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(18.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                val initial = (current.firstname?.firstOrNull() ?: 'A').toString()
                                Text(initial, style = MaterialTheme.typography.titleMedium)
                            }
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = (current.firstname ?: "") + " " + (current.lastname ?: ""),
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                        Spacer(Modifier.height(16.dp))
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(8.dp))
                        )
                        Spacer(Modifier.height(16.dp))
                        Text("Student Full Name", style = MaterialTheme.typography.bodyMedium)
                        Text("Roll No. ${current.roll_no ?: "-"}", style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(16.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(onClick = {
                                scope.launch {
                                    try {
                                        cache.recordMark(sessionId, current.student_id, false)
                                        cache.uploadPending(ApiClient.service, sessionId)
                                    } catch (e: Exception) { error = e.message }
                                    if (!processed.contains(current.student_id)) processed.add(current.student_id)
                                    // Advance to next student after marking
                                    index = minOf(index + 1, students.size - 1)
                                    if (allProcessed && index == students.lastIndex) {
                                        // When reviewing at last student, go back to final save card
                                        showFinalView = true
                                    }
                                }
                            }) { Text("Absent") }
                            Button(onClick = {
                                scope.launch {
                                    try {
                                        cache.recordMark(sessionId, current.student_id, true)
                                        cache.uploadPending(ApiClient.service, sessionId)
                                    } catch (e: Exception) { error = e.message }
                                    if (!processed.contains(current.student_id)) processed.add(current.student_id)
                                    // Advance to next student after marking
                                    index = minOf(index + 1, students.size - 1)
                                    if (allProcessed && index == students.lastIndex) {
                                        // When reviewing at last student, go back to final save card
                                        showFinalView = true
                                    }
                                }
                            }) { Text("Present") }
                        }
                    }
                } else {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No student", color = MaterialTheme.colorScheme.error)
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(onClick = { index = maxOf(index - 1, 0) }, enabled = index > 0) { Text("Previous") }
                Text("Student ${index + 1} of ${students.size}")
                Button(
                    onClick = {
                        if (index < students.lastIndex) {
                            index = minOf(index + 1, students.size - 1)
                        } else if (allProcessed) {
                            // At last student while reviewing: go to final save card
                            showFinalView = true
                        }
                    },
                    enabled = index < students.lastIndex || (allProcessed && index == students.lastIndex)
                ) { Text("Next") }
            }
            // Removed upload status and manual upload button per request
            }
        }
        error?.let { Spacer(Modifier.height(8.dp)); Text(it, color = MaterialTheme.colorScheme.error) }

        if (savedDialog) {
            AlertDialog(
                onDismissRequest = { savedDialog = false },
                title = { Text("Attendance Saved") },
                text = { Text("Your marks have been uploaded. You can view attendance from the Attendance menu.") },
                confirmButton = {
                    Button(onClick = { savedDialog = false; activity?.finish() }) { Text("Close") }
                }
            )
        }
    }
}