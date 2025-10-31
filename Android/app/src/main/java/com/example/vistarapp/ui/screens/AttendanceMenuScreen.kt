package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import java.text.SimpleDateFormat
import java.util.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.*
import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File
import java.io.FileOutputStream

// Date formatting utilities
private val inputDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
private val outputDateFormat = SimpleDateFormat("MMM dd, yyyy, hh:mm a", Locale.getDefault())

fun formatDateTime(dateTimeString: String): String {
    return try {
        val cleanDateString = dateTimeString.replace("Z", "").substringBefore(".")
        val date = inputDateFormat.parse(cleanDateString)
        date?.let { outputDateFormat.format(it) } ?: dateTimeString
    } catch (_: Exception) {
        dateTimeString
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceMenuScreen(
    schoolId: String,
    userId: String,
    onStartAttendance: () -> Unit,
    onShowAttendance: () -> Unit,
    onMonthlyAttendance: () -> Unit,
    onBackClick: () -> Unit = {}
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Attendance") },
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
                .padding(horizontal = 16.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Manage Attendance",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(bottom = 32.dp)
            )
            
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                AttendanceCard(
                    icon = Icons.Filled.PlayArrow,
                    title = "Start Attendance",
                    subtitle = "Begin a new session",
                    onClick = onStartAttendance
                )
                
                AttendanceCard(
                    icon = Icons.Filled.List,
                    title = "Show Attendance",
                    subtitle = "View today's records",
                    onClick = onShowAttendance
                )
                
                AttendanceCard(
                    icon = Icons.Filled.DateRange,
                    title = "Monthly Attendance",
                    subtitle = "Review monthly reports",
                    onClick = onMonthlyAttendance
                )
            }
        }
    }
}

@Composable
private fun AttendanceCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(32.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShowAttendanceScreen(schoolId: String, onOpenSession: (String) -> Unit, onBackClick: () -> Unit = {}) {
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

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Attendance Sessions") },
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
            Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
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
                    val startTime = s.started_at?.let { formatDateTime(it) } ?: ""
                    val endTime = s.completed_at?.let { formatDateTime(it) } ?: ""
                    
                    // Extract date and time components
                    val dateText = if (startTime.isNotEmpty()) {
                        val parts = startTime.split(", ")
                        if (parts.size >= 2) parts[0] else startTime
                    } else ""
                    
                    val timeRange = if (startTime.isNotEmpty() && endTime.isNotEmpty()) {
                        val startTimePart = startTime.split(", ").lastOrNull()?.split(" ")?.take(2)?.joinToString(" ") ?: ""
                        val endTimePart = endTime.split(", ").lastOrNull()?.split(" ")?.take(2)?.joinToString(" ") ?: ""
                        "$startTimePart - $endTimePart (30 min)"
                    } else if (startTime.isNotEmpty()) {
                        val startTimePart = startTime.split(", ").lastOrNull()?.split(" ")?.take(2)?.joinToString(" ") ?: ""
                        "$startTimePart (30 min)"
                    } else ""
                    
                    Card(
                        onClick = { s.lecture_session_id?.let(onOpenSession) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color.White,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Green dot indicator
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(
                                        color = Color(0xFF4CAF50),
                                        shape = androidx.compose.foundation.shape.CircleShape
                                    )
                            )
                            
                            Spacer(modifier = Modifier.width(12.dp))
                            
                            // Session content
                            Column(
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "Session: $shortId",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                if (dateText.isNotEmpty()) {
                                    Text(
                                        text = dateText,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (timeRange.isNotEmpty()) {
                                    Text(
                                        text = timeRange,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            
                            // Right arrow icon
                            Icon(
                                imageVector = Icons.Filled.ChevronRight,
                                contentDescription = "Open session",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
        }
    }
}

// Save Excel file to Downloads directory
fun saveExcelFile(context: Context, responseBody: okhttp3.ResponseBody, lectureName: String, year: Int, month: Int) {
    try {
        val fileName = "Attendance_${lectureName.replace(Regex("[^a-zA-Z0-9_\\- ]"), "")}_${year}-${String.format("%02d", month)}.xlsx"
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Use MediaStore for Android 10+
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
            
            val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            uri?.let { fileUri ->
                context.contentResolver.openOutputStream(fileUri)?.use { outputStream ->
                    outputStream.write(responseBody.bytes())
                }
            }
        } else {
            // Legacy approach for older Android versions
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val file = File(downloadsDir, fileName)
            file.writeBytes(responseBody.bytes())
        }
    } catch (e: Exception) {
        // Handle error appropriately
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MonthlyAttendanceScreen(
    schoolId: String,
    userId: String,
    onBackClick: () -> Unit = {}
) {
    var lectures by remember { mutableStateOf<List<com.example.vistarapp.data.model.Lecture>>(emptyList()) }
    var selectedLecture by remember { mutableStateOf<com.example.vistarapp.data.model.Lecture?>(null) }
    var selectedYear by remember { mutableStateOf(Calendar.getInstance().get(Calendar.YEAR)) }
    var selectedMonth by remember { mutableStateOf(Calendar.getInstance().get(Calendar.MONTH) + 1) }

    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var lecturesLoading by remember { mutableStateOf(true) }
    var lecturesError by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    // Load available lectures
    LaunchedEffect(schoolId, userId) {
        lecturesLoading = true
        lecturesError = null
        try {
            val response = com.example.vistarapp.data.api.ApiClient.service.availableLectures(schoolId, userId)
            if (response.isSuccessful) {
                lectures = response.body() ?: emptyList()
            } else {
                lecturesError = "Failed to load lectures"
            }
        } catch (e: Exception) {
            lecturesError = e.message ?: "Network error"
        } finally {
            lecturesLoading = false
        }
    }

    // Download monthly attendance Excel
    fun downloadMonthlyAttendance() {
        selectedLecture?.let { lecture ->
            loading = true
            error = null
            scope.launch {
                try {
                    val response = com.example.vistarapp.data.api.ApiClient.service.exportMonthlyAttendance(
                        lectureId = lecture.lecture_id,
                        year = selectedYear,
                        month = selectedMonth,
                        includeDefaulter = false,
                        includeCritical = false,
                        defaulterPercent = 75.0,
                        criticalPercent = 50.0
                    )
                    if (response.isSuccessful) {
                        response.body()?.let { responseBody ->
                            // Save the Excel file to Downloads
                            saveExcelFile(context, responseBody, lecture.lecture_name ?: "Lecture", selectedYear, selectedMonth)
                            error = "Excel file downloaded successfully!"
                        } ?: run {
                            error = "Failed to download: Empty response"
                        }
                    } else {
                        error = "Failed to download monthly attendance"
                    }
                } catch (e: Exception) {
                    error = e.message ?: "Network error"
                } finally {
                    loading = false
                }
            }
        }
    }



    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Monthly Attendance",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // Lecture Selection
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Select Lecture",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    if (lecturesLoading) {
                        Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    } else if (lecturesError != null) {
                        Text(
                            text = lecturesError!!,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(8.dp)
                        )
                    } else {
                        var expanded by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = !expanded }
                        ) {
                            OutlinedTextField(
                                value = selectedLecture?.lecture_name ?: "Select a lecture",
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false }
                            ) {
                                lectures.forEach { lecture ->
                                    DropdownMenuItem(
                                        text = { Text(lecture.lecture_name ?: "Unnamed Lecture") },
                                        onClick = {
                                            selectedLecture = lecture
                                            expanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Month and Year Selection
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Select Month & Year",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Month Selection
                        var monthExpanded by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = monthExpanded,
                            onExpandedChange = { monthExpanded = !monthExpanded },
                            modifier = Modifier.weight(1f)
                        ) {
                            OutlinedTextField(
                                value = getMonthName(selectedMonth),
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Month") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = monthExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = monthExpanded,
                                onDismissRequest = { monthExpanded = false }
                            ) {
                                (1..12).forEach { month ->
                                    DropdownMenuItem(
                                        text = { Text(getMonthName(month)) },
                                        onClick = {
                                            selectedMonth = month
                                            monthExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        // Year Selection
                        var yearExpanded by remember { mutableStateOf(false) }
                        val currentYear = Calendar.getInstance().get(Calendar.YEAR)
                        val years = (currentYear - 5..currentYear + 1).toList()
                        
                        ExposedDropdownMenuBox(
                            expanded = yearExpanded,
                            onExpandedChange = { yearExpanded = !yearExpanded },
                            modifier = Modifier.weight(1f)
                        ) {
                            OutlinedTextField(
                                value = selectedYear.toString(),
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Year") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = yearExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = yearExpanded,
                                onDismissRequest = { yearExpanded = false }
                            ) {
                                years.forEach { year ->
                                    DropdownMenuItem(
                                        text = { Text(year.toString()) },
                                        onClick = {
                                            selectedYear = year
                                            yearExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { downloadMonthlyAttendance() },
                        enabled = selectedLecture != null && !loading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (loading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text("Download Attendance")
                    }
                }
            }
        }

        // Message Display (Error or Success)
        if (error != null) {
            item {
                val isSuccess = error!!.contains("successfully")
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSuccess) 
                            MaterialTheme.colorScheme.primaryContainer 
                        else 
                            MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = error!!,
                        color = if (isSuccess) 
                            MaterialTheme.colorScheme.onPrimaryContainer 
                        else 
                            MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun MonthlyAttendanceDataDisplay(data: com.example.vistarapp.data.model.MonthlyAttendanceResponse) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Attendance for ${getMonthName(data.month)} ${data.year}",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            if (data.sessions.isEmpty()) {
                Text(
                    text = "No sessions found for this month",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                // Create attendance map for quick lookup
                val attendanceMap = data.attendance.groupBy { it.student_id }
                    .mapValues { (_, records) ->
                        records.associateBy { it.lecture_session_id }
                    }

                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Student names column
                    item {
                        Column(modifier = Modifier.width(120.dp)) {
                            // Header
                            Text(
                                text = "Student",
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.padding(8.dp).height(40.dp),
                                maxLines = 1
                            )
                            
                            // Student rows
                            data.students.forEach { student ->
                                Text(
                                    text = "${student.firstname ?: ""} ${student.lastname ?: ""}".trim(),
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(8.dp).height(32.dp),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Session columns
                    items(data.sessions) { session ->
                        Column(modifier = Modifier.width(80.dp)) {
                            // Session date header
                            Text(
                                text = formatSessionDate(session.started_at),
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(4.dp).height(40.dp),
                                maxLines = 2,
                                textAlign = TextAlign.Center
                            )
                            
                            // Attendance status for each student
                            data.students.forEach { student ->
                                val attendanceRecord = attendanceMap[student.student_id]?.get(session.lecture_session_id)
                                val isPresent = attendanceRecord?.attendance ?: false
                                val hasRecord = attendanceRecord != null

                                Box(
                                    modifier = Modifier
                                        .padding(4.dp)
                                        .height(32.dp)
                                        .fillMaxWidth()
                                        .background(
                                            color = when {
                                                !hasRecord -> MaterialTheme.colorScheme.surfaceVariant
                                                isPresent -> Color.Green.copy(alpha = 0.3f)
                                                else -> Color.Red.copy(alpha = 0.3f)
                                            },
                                            shape = RoundedCornerShape(4.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = when {
                                            !hasRecord -> "—"
                                            isPresent -> "P"
                                            else -> "A"
                                        },
                                        style = MaterialTheme.typography.labelSmall,
                                        color = when {
                                            !hasRecord -> MaterialTheme.colorScheme.onSurfaceVariant
                                            isPresent -> Color.Green.copy(alpha = 0.8f)
                                            else -> Color.Red.copy(alpha = 0.8f)
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Total attendance column
                    item {
                        Column(modifier = Modifier.width(80.dp)) {
                            Text(
                                text = "Total",
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.padding(8.dp).height(40.dp),
                                textAlign = TextAlign.Center
                            )
                            
                            data.students.forEach { student ->
                                val studentAttendance = attendanceMap[student.student_id] ?: emptyMap()
                                val totalPresent = studentAttendance.values.count { it.attendance }
                                val totalSessions = data.sessions.size
                                val percentage = if (totalSessions > 0) (totalPresent * 100) / totalSessions else 0

                                Box(
                                    modifier = Modifier
                                        .padding(4.dp)
                                        .height(32.dp)
                                        .fillMaxWidth()
                                        .background(
                                            color = when {
                                                percentage >= 75 -> Color.Green.copy(alpha = 0.3f)
                                                percentage >= 50 -> Color.Yellow.copy(alpha = 0.3f)
                                                else -> Color.Red.copy(alpha = 0.3f)
                                            },
                                            shape = RoundedCornerShape(4.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "$totalPresent/$totalSessions",
                                        style = MaterialTheme.typography.labelSmall,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun getMonthName(month: Int): String {
    return when (month) {
        1 -> "January"
        2 -> "February"
        3 -> "March"
        4 -> "April"
        5 -> "May"
        6 -> "June"
        7 -> "July"
        8 -> "August"
        9 -> "September"
        10 -> "October"
        11 -> "November"
        12 -> "December"
        else -> "Unknown"
    }
}

private fun formatSessionDate(dateString: String?): String {
    if (dateString == null) return "—"
    return try {
        val date = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).parse(dateString)
        java.text.SimpleDateFormat("MM/dd", java.util.Locale.getDefault()).format(date ?: return "—")
    } catch (e: Exception) {
        dateString.take(10) // Fallback to first 10 characters
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShowAttendanceDetailScreen(sessionId: String, onBackClick: () -> Unit = {}) {
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

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Attendance Details") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (loading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                LinearProgressIndicator(Modifier.fillMaxWidth().padding(16.dp))
            }
        } else if (error != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(error!!, color = MaterialTheme.colorScheme.error)
            }
        } else {
            // Make the entire content scrollable using LazyColumn
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Session details header
                item {
                    Text(
                        "Session: ${(details?.lecture_session_id ?: sessionId).take(8)}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                // Subject info with icon
                details?.subject_name?.let { subject ->
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.School,
                                contentDescription = "Subject",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = subject,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
                
                // Teacher info with icon
                details?.teacher_name?.let { teacher ->
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Person,
                                contentDescription = "Teacher",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = teacher,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
                
                // Standard and Division with icon
                val stdDiv = listOfNotNull(
                    details?.standard?.let { "MCA+FY" },
                    details?.division?.let { "Division: $it" }
                ).joinToString(" • ")
                if (stdDiv.isNotEmpty()) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.School,
                                contentDescription = "Class",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = stdDiv,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
                
                // Time info with icon
                val timeRange = listOfNotNull(
                    details?.started_at?.let { formatDateTime(it) },
                    details?.completed_at?.let { formatDateTime(it) }
                ).joinToString(" - ")
                if (timeRange.isNotEmpty()) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.AccessTime,
                                contentDescription = "Time",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = timeRange,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
                
                // Spacer
                item {
                    Spacer(Modifier.height(8.dp))
                }
                
                // Present/Absent count
                val presentCount = rows.count { it.attendance }
                val absentCount = rows.count { !it.attendance }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Present: $presentCount",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFF2E7D32),
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Absent: $absentCount",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFFC62828),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
                
                // Spacer before student list
                item {
                    Spacer(Modifier.height(4.dp))
                }

                // Student list items
                items(rows) { r ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                // Circular avatar with initials
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(
                                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                            shape = CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${r.firstname?.firstOrNull() ?: ""}${r.lastname?.firstOrNull() ?: ""}".uppercase(),
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                
                                Column {
                                    Text(
                                        text = "${r.firstname ?: ""} ${r.lastname ?: ""}".trim(),
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = "Roll No: ${r.roll_no ?: "-"}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            
                            // Present button (only show for present students)
                            if (r.attendance) {
                                Button(
                                    onClick = {},
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF2E7D32),
                                        contentColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(20.dp),
                                    modifier = Modifier.height(32.dp)
                                ) {
                                    Text(
                                        text = "Present",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}