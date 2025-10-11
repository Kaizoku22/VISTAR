package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import java.time.OffsetDateTime
import java.time.LocalDateTime
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign

@Composable
fun AttendanceMenuScreen(
    schoolId: String,
    userId: String,
    onStartAttendance: () -> Unit,
    onShowAttendance: () -> Unit,
    onMonthlyAttendance: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Attendance", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))

        listCard(title = "Start Attendance", onClick = onStartAttendance)
        Spacer(Modifier.height(12.dp))
        listCard(title = "Show Attendance", onClick = onShowAttendance)
        Spacer(Modifier.height(12.dp))
        listCard(title = "Monthly Attendance", onClick = onMonthlyAttendance)
    }
}

@Composable
private fun listCard(title: String, onClick: () -> Unit) {
    ElevatedCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
            contentColor = MaterialTheme.colorScheme.onSurface
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxWidth().padding(vertical = 18.dp, horizontal = 20.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(title, style = MaterialTheme.typography.titleMedium)
        }
    }
}

@Composable
fun ShowAttendanceScreen(schoolId: String, onOpenSession: (String) -> Unit) {
    var sessions by remember { mutableStateOf<List<com.example.vistarapp.data.model.LectureSession>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(schoolId) {
        try {
            val resp = com.example.vistarapp.data.api.ApiClient.service.listSessions(schoolId)
            if (resp.isSuccessful) {
                sessions = resp.body() ?: emptyList()
            } else {
                error = "Failed to load sessions: ${resp.code()}"
            }
        } catch (e: Exception) {
            error = e.message
        } finally { loading = false }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Attendance Sessions", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        if (loading) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        } else if (error != null) {
            Text(error!!, color = MaterialTheme.colorScheme.error)
        } else if (sessions.isEmpty()) {
            Text("No sessions recorded yet.")
        } else {
            LazyColumn {
                items(sessions) { s ->
                    val shortId = (s.lecture_session_id ?: "").take(8)
                    val subtitle = listOfNotNull(
                        s.started_at?.let { "Started: ${formatDateTime(it)}" },
                        s.completed_at?.let { "Completed: ${formatDateTime(it)}" }
                    ).joinToString("  •  ")
                    Card(
                        onClick = { s.lecture_session_id?.let(onOpenSession) },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        ListItem(
                            headlineContent = { Text("Session: $shortId", style = MaterialTheme.typography.titleMedium) },
                            supportingContent = {
                                if (subtitle.isNotEmpty()) {
                                    Text(subtitle, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        )
                    }
                    Divider()
                }
            }
        }
    }
}

@Composable
fun MonthlyAttendanceScreen(schoolId: String) {
    Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Monthly Attendance", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text("Coming soon", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun ShowAttendanceDetailScreen(sessionId: String) {
    var details by remember { mutableStateOf<com.example.vistarapp.data.model.SessionDetails?>(null) }
    var rows by remember { mutableStateOf<List<com.example.vistarapp.data.model.AttendanceRow>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(sessionId) {
        try {
            val dresp = com.example.vistarapp.data.api.ApiClient.service.sessionDetails(sessionId)
            val rresp = com.example.vistarapp.data.api.ApiClient.service.sessionAttendance(sessionId)
            if (dresp.isSuccessful) details = dresp.body()
            else error = "Failed details: ${dresp.code()}"
            if (rresp.isSuccessful) rows = rresp.body() ?: emptyList()
            else error = "Failed attendance: ${rresp.code()}"
        } catch (e: Exception) {
            error = e.message
        } finally { loading = false }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Attendance Details", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        if (loading) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        } else if (error != null) {
            Text(error!!, color = MaterialTheme.colorScheme.error)
        } else {
            // Header block (Material Card)
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurface
                ),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
            ) {
                ListItem(
                    headlineContent = {
                        Text(
                            "Session: ${(details?.lecture_session_id ?: sessionId).take(8)}",
                            style = MaterialTheme.typography.titleMedium
                        )
                    },
                    supportingContent = {
                        Column {
                            details?.lecture_name?.let { Text("Lecture: $it") }
                            details?.subject_name?.let { Text("Subject: $it") }
                            details?.teacher_name?.let { Text("Teacher: $it") }
                            val stdDiv = listOfNotNull(
                                details?.standard?.let { "Standard: $it" },
                                details?.division?.let { "Division: $it" }
                            ).joinToString("  •  ")
                            if (stdDiv.isNotEmpty()) Text(stdDiv)
                            val times = listOfNotNull(
                                details?.started_at?.let { "Start: ${formatDateTime(it)}" },
                                details?.completed_at?.let { "End: ${formatDateTime(it)}" }
                            ).joinToString("  •  ")
                            if (times.isNotEmpty()) Text(times)
                        }
                    }
                )
            }
            Spacer(Modifier.height(12.dp))

            // Table-like list
            Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                Text("Roll No", modifier = Modifier.weight(1f))
                Text("First Name", modifier = Modifier.weight(2f))
                Text("Last Name", modifier = Modifier.weight(2f))
                Text("Attendance", modifier = Modifier.weight(2f))
            }
            Divider()
            LazyColumn {
                items(rows) { r ->
                    Row(Modifier.fillMaxWidth().padding(8.dp)) {
                        Text(r.roll_no ?: "-", modifier = Modifier.weight(1f))
                        Text(r.firstname ?: "", modifier = Modifier.weight(2f), style = MaterialTheme.typography.bodySmall)
                        Text(r.lastname ?: "", modifier = Modifier.weight(2f), style = MaterialTheme.typography.bodySmall)
                        AssistChip(
                            onClick = {},
                            label = {
                                Text(
                                    if (r.attendance) "Present" else "Absent",
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (r.attendance) Color(0xFF2E7D32) else Color(0xFFC62828),
                                labelColor = Color.White
                            ),
                            modifier = Modifier.weight(2f)
                        )
                    }
                    Divider()
                }
            }
        }
    }
}
// Format ISO timestamps to a friendly local date-time
private val PrettyDateTime: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy, hh:mm a")
private fun formatDateTime(iso: String): String {
    // Try multiple ISO shapes: with offset, local date-time, or instant
    return try {
        val odt = OffsetDateTime.parse(iso)
        odt.atZoneSameInstant(ZoneId.systemDefault()).format(PrettyDateTime)
    } catch (_: Exception) {
        try {
            val ldt = LocalDateTime.parse(iso, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ldt.atZone(ZoneId.systemDefault()).format(PrettyDateTime)
        } catch (_: Exception) {
            try {
                val inst = Instant.parse(iso)
                inst.atZone(ZoneId.systemDefault()).format(PrettyDateTime)
            } catch (_: Exception) {
                iso
            }
        }
    }
}