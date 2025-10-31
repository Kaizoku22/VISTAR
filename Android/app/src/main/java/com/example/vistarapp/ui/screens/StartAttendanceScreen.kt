package com.example.vistarapp.ui.screens

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.cache.AttendanceCache
import com.example.vistarapp.data.model.CreateSessionRequest
import com.example.vistarapp.data.model.Lecture
import com.example.vistarapp.data.model.Student
import kotlinx.coroutines.launch
import androidx.compose.material3.ExperimentalMaterial3Api
import java.util.Calendar
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StartAttendanceScreen(
    schoolId: String,
    userId: String,
    onStartAttendance: (String, String) -> Unit,
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    val cache = remember { AttendanceCache(context) }
    var lectures by remember { mutableStateOf<List<Lecture>>(emptyList()) }
    var formLectureId by remember { mutableStateOf<String>("") }
    var startedAt by remember { mutableStateOf("") }
    var completedAt by remember { mutableStateOf("") }
    var sessionId by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var studentsForSession by remember { mutableStateOf<List<Student>>(emptyList()) }
    var studentsLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(schoolId, userId) {
        try {
            val resp = ApiClient.service.availableLectures(schoolId, userId)
            if (resp.isSuccessful) {
                lectures = resp.body() ?: emptyList()
                // Auto-select first lecture to reduce friction
                if (formLectureId.isBlank() && lectures.isNotEmpty()) {
                    formLectureId = lectures.first().lecture_id
                }
            } else { error = "Failed to load lectures: ${resp.code()}" }
        } catch (e: Exception) { error = e.message }
    }

    fun nowIso(): String {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(java.util.Date())
    }

    fun isoFrom(year: Int, month: Int, day: Int, hour: Int, minute: Int): String {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.set(year, month - 1, day, hour, minute, 0)
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(cal.time)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Start Attendance") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
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

        // Form card
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.elevatedCardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                contentColor = MaterialTheme.colorScheme.onSurface
            ),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("Lecture", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))

                var expanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        readOnly = true,
                        value = lectures.find { it.lecture_id == formLectureId }?.lecture_name ?: "Select lecture",
                        onValueChange = {},
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        shape = RoundedCornerShape(12.dp),
                        containerColor = MaterialTheme.colorScheme.surfaceVariant,
                        tonalElevation = 1.dp,
                        shadowElevation = 2.dp
                    ) {
                        lectures.forEach { lec ->
                            DropdownMenuItem(text = { Text(lec.lecture_name ?: "Lecture") }, onClick = {
                                formLectureId = lec.lecture_id
                                expanded = false
                            })
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text("Started At", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                // Separate date & time fields for Started At
                var showStartDatePicker by remember { mutableStateOf(false) }
                var showStartTimePicker by remember { mutableStateOf(false) }
                var startDate by remember { mutableStateOf<Triple<Int, Int, Int>?>(null) }
                var startTime by remember { mutableStateOf<Pair<Int, Int>?>(null) }
                fun startedDateString(): String = startDate?.let { "${it.first}-${String.format("%02d", it.second)}-${String.format("%02d", it.third)}" } ?: ""
                fun startedTimeString(): String = startTime?.let { String.format("%02d:%02d", it.first, it.second) } ?: ""
                fun recomputeStartedIso() { startedAt = if (startDate != null && startTime != null) isoFrom(startDate!!.first, startDate!!.second, startDate!!.third, startTime!!.first, startTime!!.second) else "" }

                OutlinedTextField(
                    value = startedDateString(),
                    onValueChange = {},
                    readOnly = true,
                    placeholder = { Text("Select date") },
                    trailingIcon = { TextButton(onClick = { showStartDatePicker = true }) { Text("Pick") } },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showStartDatePicker = true }
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = startedTimeString(),
                    onValueChange = {},
                    readOnly = true,
                    placeholder = { Text("Select time") },
                    trailingIcon = { TextButton(onClick = { showStartTimePicker = true }) { Text("Pick") } },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showStartTimePicker = true }
                )

                // Date picker for Started At
                if (showStartDatePicker) {
                    val dateState = rememberDatePickerState()
                    DatePickerDialog(
                        onDismissRequest = { showStartDatePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                val millis = dateState.selectedDateMillis
                                if (millis != null) {
                                    val cal = Calendar.getInstance()
                                    cal.timeInMillis = millis
                                    startDate = Triple(
                                        cal.get(Calendar.YEAR),
                                        cal.get(Calendar.MONTH) + 1,
                                        cal.get(Calendar.DAY_OF_MONTH)
                                    )
                                    recomputeStartedIso()
                                }
                                showStartDatePicker = false
                            }) { Text("OK") }
                        },
                        dismissButton = { TextButton(onClick = { showStartDatePicker = false }) { Text("Cancel") } }
                    ) {
                        DatePicker(state = dateState)
                    }
                }
                // Time picker for Started At
                if (showStartTimePicker) {
                    val timeState = rememberTimePickerState(is24Hour = true)
                    AlertDialog(
                        onDismissRequest = { showStartTimePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                startTime = Pair(timeState.hour, timeState.minute)
                                recomputeStartedIso()
                                showStartTimePicker = false
                            }) { Text("OK") }
                        },
                        dismissButton = { TextButton(onClick = { showStartTimePicker = false }) { Text("Cancel") } },
                        text = { TimePicker(state = timeState) }
                    )
                }

                if (startedAt.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text("Selected: $startedAt", style = MaterialTheme.typography.bodySmall)
                }

                Spacer(Modifier.height(16.dp))
                Text("Completed At", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                // Separate date & time fields for Completed At
                var showCompletedDatePicker by remember { mutableStateOf(false) }
                var showCompletedTimePicker by remember { mutableStateOf(false) }
                var completedDate by remember { mutableStateOf<Triple<Int, Int, Int>?>(null) }
                var completedTime by remember { mutableStateOf<Pair<Int, Int>?>(null) }
                fun completedDateString(): String = completedDate?.let { "${it.first}-${String.format("%02d", it.second)}-${String.format("%02d", it.third)}" } ?: ""
                fun completedTimeString(): String = completedTime?.let { String.format("%02d:%02d", it.first, it.second) } ?: ""
                fun recomputeCompletedIso() { completedAt = if (completedDate != null && completedTime != null) isoFrom(completedDate!!.first, completedDate!!.second, completedDate!!.third, completedTime!!.first, completedTime!!.second) else "" }

                OutlinedTextField(
                    value = completedDateString(),
                    onValueChange = {},
                    readOnly = true,
                    placeholder = { Text("Optional date") },
                    trailingIcon = { TextButton(onClick = { showCompletedDatePicker = true }) { Text("Pick") } },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showCompletedDatePicker = true }
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = completedTimeString(),
                    onValueChange = {},
                    readOnly = true,
                    placeholder = { Text("Optional time") },
                    trailingIcon = { TextButton(onClick = { showCompletedTimePicker = true }) { Text("Pick") } },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showCompletedTimePicker = true }
                )

                // Date picker for Completed At
                if (showCompletedDatePicker) {
                    val dateState = rememberDatePickerState()
                    DatePickerDialog(
                        onDismissRequest = { showCompletedDatePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                val millis = dateState.selectedDateMillis
                                if (millis != null) {
                                    val cal = Calendar.getInstance()
                                    cal.timeInMillis = millis
                                    completedDate = Triple(
                                        cal.get(Calendar.YEAR),
                                        cal.get(Calendar.MONTH) + 1,
                                        cal.get(Calendar.DAY_OF_MONTH)
                                    )
                                    recomputeCompletedIso()
                                }
                                showCompletedDatePicker = false
                            }) { Text("OK") }
                        },
                        dismissButton = { TextButton(onClick = { showCompletedDatePicker = false }) { Text("Cancel") } }
                    ) {
                        DatePicker(state = dateState)
                    }
                }
                // Time picker for Completed At
                if (showCompletedTimePicker) {
                    val timeState = rememberTimePickerState(is24Hour = true)
                    AlertDialog(
                        onDismissRequest = { showCompletedTimePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                completedTime = Pair(timeState.hour, timeState.minute)
                                recomputeCompletedIso()
                                showCompletedTimePicker = false
                            }) { Text("OK") }
                        },
                        dismissButton = { TextButton(onClick = { showCompletedTimePicker = false }) { Text("Cancel") } },
                        text = { TimePicker(state = timeState) }
                    )
                }

                if (completedAt.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text("Selected: $completedAt", style = MaterialTheme.typography.bodySmall)
                }

                Spacer(Modifier.height(16.dp))
                val canCreate = formLectureId.isNotBlank() && startedAt.isNotBlank()
                Button(
                    onClick = {
                        scope.launch {
                            loading = true; error = null
                            try {
                                val resp = ApiClient.service.createSession(
                                    CreateSessionRequest(
                                        lecture_id = formLectureId,
                                        started_at = startedAt,
                                        completed_at = completedAt.ifBlank { null },
                                        school_id = schoolId,
                                        user_id = userId
                                    )
                                )
                                if (resp.isSuccessful) {
                                    val body = resp.body()
                                    val sid = body?.session?.lecture_session_id
                                    if (!sid.isNullOrBlank()) {
                                        sessionId = sid
                                        val returned = body?.students ?: emptyList()
                                        studentsForSession = returned
                                        // Cache students returned
                                        cache.cacheStudents(sid, returned)
                                        if (returned.isEmpty()) {
                                            // Fallback: fetch students from API if response lacks them
                                            studentsLoading = true
                                            try {
                                                val sresp = ApiClient.service.sessionStudents(sid)
                                                if (sresp.isSuccessful) {
                                                    studentsForSession = sresp.body() ?: emptyList()
                                                    cache.cacheStudents(sid, studentsForSession)
                                                }
                                            } finally { studentsLoading = false }
                                        }
                                    }
                                } else { error = "Failed to create session: ${resp.code()}" }
                            } catch (e: Exception) { error = e.message }
                            finally { loading = false }
                        }
                    },
                    enabled = canCreate,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Create Lecture Session") }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Actions card
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.elevatedCardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                contentColor = MaterialTheme.colorScheme.onSurface
            ),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("Actions", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                Text("Create a session to enable starting attendance.")
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        val sid = sessionId ?: return@Button
                        val lecName = lectures.find { it.lecture_id == formLectureId }?.lecture_name ?: "Lecture"
                        onStartAttendance(sid, lecName ?: "Lecture")
                    },
                    enabled = sessionId != null,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Start Attendance") }
            }
        }

        Spacer(Modifier.height(8.dp))
        if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        Spacer(Modifier.height(16.dp))
        if (sessionId != null) {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurface
                ),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text("Students in Session", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    if (studentsLoading) {
                        LinearProgressIndicator(Modifier.fillMaxWidth())
                    }
                    if (studentsForSession.isEmpty() && !studentsLoading) {
                        Text("No students returned for this session.")
                    } else {
                        Text("Total: ${studentsForSession.size}", style = MaterialTheme.typography.bodySmall)
                        Spacer(Modifier.height(8.dp))
                        LazyColumn(modifier = Modifier.fillMaxWidth()) {
                            items(studentsForSession) { s ->
                                val name = listOfNotNull(s.firstname, s.lastname).joinToString(" ").ifBlank { "Student" }
                                ListItem(
                                    headlineContent = { Text(name) },
                                    supportingContent = {
                                        val roll = s.roll_no?.takeIf { it.isNotBlank() } ?: "-"
                                        Text("Roll: $roll")
                                    }
                                )
                                Divider()
                            }
                        }
                    }
                }
            }
        }
    }
    }
}