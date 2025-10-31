package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.sharp.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.MarksheetHeader
import com.example.vistarapp.data.model.MarksEntry
import com.example.vistarapp.utils.MarksheetPdfGenerator
import com.example.vistarapp.utils.DownloadManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMarksheetScreen(
    studentId: String,
    marksheetId: String,
    onBackClick: () -> Unit = {},
    onDownloadClick: (String, String) -> Unit = { _, _ -> } // studentId, marksheetId
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    var marksheet by remember { mutableStateOf<MarksheetHeader?>(null) }
    var marksEntries by remember { mutableStateOf<List<MarksEntry>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var isDownloading by remember { mutableStateOf(false) }

    LaunchedEffect(studentId, marksheetId) {
        try {
            // Load marksheet header
            val headerResp = ApiClient.service.getMarksheet(marksheetId)
            if (!headerResp.isSuccessful) {
                error = "Failed to load marksheet: ${headerResp.code()}"
                loading = false
                return@LaunchedEffect
            }
            marksheet = headerResp.body()

            // Load all marks entries and filter for this student
            val entriesResp = ApiClient.service.getMarksEntries(marksheetId)
            if (!entriesResp.isSuccessful) {
                error = "Failed to load marks: ${entriesResp.code()}"
                loading = false
                return@LaunchedEffect
            }

            marksEntries = (entriesResp.body() ?: emptyList())
                .filter { it.student_id == studentId }
                .sortedBy { it.subject_name }

        } catch (e: Exception) {
            error = e.message
        } finally {
            loading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Student Marksheet") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = { 
                            if (!isDownloading && marksheet != null && marksEntries.isNotEmpty()) {
                                isDownloading = true
                                coroutineScope.launch {
                                    try {
                                        val studentName = marksEntries.firstOrNull()?.student_name ?: "Unknown Student"
                                        val rollNo = marksEntries.firstOrNull()?.roll_no ?: ""
                                        
                                        val pdfFile = withContext(Dispatchers.IO) {
                                            MarksheetPdfGenerator.generateMarksheetPdf(
                                                context = context,
                                                marksheet = marksheet!!,
                                                marksEntries = marksEntries,
                                                studentName = studentName,
                                                rollNo = rollNo
                                            )
                                        }
                                        
                                        pdfFile?.let { file ->
                                            DownloadManager.shareOrOpenPdf(context, file)
                                        }
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                    } finally {
                                        isDownloading = false
                                    }
                                }
                            }
                        },
                        enabled = !isDownloading && marksheet != null && marksEntries.isNotEmpty()
                    ) {
                        if (isDownloading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(Icons.Filled.Download, contentDescription = "Download")
                        }
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
                // Student and marksheet info
                marksheet?.let { sheet ->
                    StudentMarksheetHeader(
                        marksheet = sheet,
                        studentName = marksEntries.firstOrNull()?.student_name ?: "Unknown Student",
                        rollNo = marksEntries.firstOrNull()?.roll_no ?: ""
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Marks summary
                if (marksEntries.isNotEmpty()) {
                    MarksSummaryCard(marksEntries = marksEntries)
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Subject-wise marks
                Text(
                    text = "Subject-wise Marks",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                if (marksEntries.isEmpty()) {
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
                                text = "No marks found",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(marksEntries) { entry ->
                            SubjectMarksCard(marksEntry = entry)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentMarksheetHeader(
    marksheet: MarksheetHeader,
    studentName: String,
    rollNo: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Student info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(
                    Icons.Filled.Person,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(end = 8.dp)
                )
                Column {
                    Text(
                        text = studentName,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    if (rollNo.isNotEmpty()) {
                        Text(
                            text = "Roll No: $rollNo",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }

            Divider(
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.3f),
                modifier = Modifier.padding(vertical = 8.dp)
            )

            // Exam info
            Text(
                text = marksheet.exam_name ?: "Unnamed Exam",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            
            if (marksheet.exam_date != null) {
                Text(
                    text = "Date: ${marksheet.exam_date}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            if (marksheet.term != null) {
                Text(
                    text = "Term: ${marksheet.term}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

@Composable
private fun MarksSummaryCard(marksEntries: List<MarksEntry>) {
    val totalObtained = marksEntries.sumOf { it.obtained_marks ?: 0 }
    val totalMax = marksEntries.sumOf { it.max_marks ?: 0 }
    val percentage = if (totalMax > 0) (totalObtained.toDouble() / totalMax * 100) else 0.0
    val grade = calculateGrade(percentage)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Overall Performance",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                SummaryItem(
                    label = "Total Marks",
                    value = "$totalObtained / $totalMax"
                )
                SummaryItem(
                    label = "Percentage",
                    value = "${String.format("%.1f", percentage)}%"
                )
                SummaryItem(
                    label = "Grade",
                    value = grade
                )
                SummaryItem(
                    label = "Subjects",
                    value = "${marksEntries.size}"
                )
            }
        }
    }
}

@Composable
private fun SummaryItem(label: String, value: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSecondaryContainer
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSecondaryContainer
        )
    }
}

@Composable
private fun SubjectMarksCard(marksEntry: MarksEntry) {
    val percentage = if ((marksEntry.max_marks ?: 0) > 0) {
        ((marksEntry.obtained_marks ?: 0).toDouble() / (marksEntry.max_marks ?: 1) * 100)
    } else 0.0

    Card(
        modifier = Modifier.fillMaxWidth(),
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
                Text(
                    text = marksEntry.subject_name ?: "Unknown Subject",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${marksEntry.obtained_marks ?: 0} / ${marksEntry.max_marks ?: 0}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = "${String.format("%.1f", percentage)}%",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        percentage >= 90 -> MaterialTheme.colorScheme.primary
                        percentage >= 75 -> MaterialTheme.colorScheme.tertiary
                        percentage >= 60 -> MaterialTheme.colorScheme.secondary
                        else -> MaterialTheme.colorScheme.error
                    }
                )
                if (marksEntry.grade != null) {
                    Text(
                        text = "Grade: ${marksEntry.grade}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

private fun calculateGrade(percentage: Double): String {
    return when {
        percentage >= 90 -> "A+"
        percentage >= 80 -> "A"
        percentage >= 70 -> "B+"
        percentage >= 60 -> "B"
        percentage >= 50 -> "C+"
        percentage >= 40 -> "C"
        percentage >= 33 -> "D"
        else -> "F"
    }
}