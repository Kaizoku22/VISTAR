package com.example.vistarapp.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.MarksheetHeader
import com.example.vistarapp.data.model.MarksEntry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarksheetDetailScreen(
    marksheetId: String,
    onStudentClick: (String, String) -> Unit = { _, _ -> }, // studentId, marksheetId
    onBackClick: () -> Unit = {}
) {
    var marksheet by remember { mutableStateOf<MarksheetHeader?>(null) }
    var students by remember { mutableStateOf<List<StudentSummary>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(marksheetId) {
        try {
            // Load marksheet header
            val headerResp = ApiClient.service.getMarksheet(marksheetId)
            if (!headerResp.isSuccessful) {
                error = "Failed to load marksheet: ${headerResp.code()}"
                loading = false
                return@LaunchedEffect
            }
            marksheet = headerResp.body()

            // Load marks entries to get student list
            val entriesResp = ApiClient.service.getMarksEntries(marksheetId)
            if (!entriesResp.isSuccessful) {
                error = "Failed to load marks: ${entriesResp.code()}"
                loading = false
                return@LaunchedEffect
            }

            val entries = entriesResp.body() ?: emptyList()
            
            // Group by student and calculate totals
            students = entries.groupBy { it.student_id }
                .map { (studentId, studentEntries) ->
                    val firstEntry = studentEntries.first()
                    val totalObtained = studentEntries.sumOf { it.obtained_marks ?: 0 }
                    val totalMax = studentEntries.sumOf { it.max_marks ?: 0 }
                    val percentage = if (totalMax > 0) (totalObtained.toDouble() / totalMax * 100) else 0.0
                    
                    StudentSummary(
                        studentId = studentId,
                        studentName = firstEntry.student_name ?: "Unknown Student",
                        rollNo = firstEntry.roll_no ?: "",
                        totalObtained = totalObtained,
                        totalMax = totalMax,
                        percentage = percentage,
                        subjectCount = studentEntries.size
                    )
                }
                .sortedBy { it.rollNo.toIntOrNull() ?: Int.MAX_VALUE }

        } catch (e: Exception) {
            error = e.message
        } finally {
            loading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Marksheet Details") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            if (loading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (error != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Text(
                        text = error!!,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            } else {
                // Marksheet header card
                marksheet?.let { sheet ->
                    MarksheetHeaderCard(marksheet = sheet)
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Students section
                Text(
                    text = "Students (${students.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                if (students.isEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Filled.Person,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No students found",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(students) { student ->
                            StudentSummaryCard(
                                student = student,
                                onClick = { onStudentClick(student.studentId, marksheetId) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MarksheetHeaderCard(marksheet: MarksheetHeader) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = marksheet.exam_name ?: "Unnamed Exam",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            if (marksheet.exam_date != null) {
                InfoRow(label = "Date", value = marksheet.exam_date)
            }
            if (marksheet.term != null) {
                InfoRow(label = "Term", value = marksheet.term)
            }
            if (marksheet.created_at != null) {
                InfoRow(label = "Created", value = marksheet.created_at.split("T")[0]) // Show only date part
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "$label:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

@Composable
private fun StudentSummaryCard(
    student: StudentSummary,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (student.rollNo.isNotEmpty()) {
                        Text(
                            text = "Roll ${student.rollNo}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }
                    Text(
                        text = student.studentName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${student.totalObtained}/${student.totalMax} marks",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${student.subjectCount} subjects",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = "${String.format("%.1f", student.percentage)}%",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        student.percentage >= 90 -> MaterialTheme.colorScheme.primary
                        student.percentage >= 75 -> MaterialTheme.colorScheme.tertiary
                        student.percentage >= 60 -> MaterialTheme.colorScheme.secondary
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )
                Icon(
                    Icons.Filled.Person,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

private data class StudentSummary(
    val studentId: String,
    val studentName: String,
    val rollNo: String,
    val totalObtained: Int,
    val totalMax: Int,
    val percentage: Double,
    val subjectCount: Int
)