package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SchoolDashboardScreen(
    schoolId: String,
    onStudents: () -> Unit,
    onAttendance: () -> Unit,
    onMarksheet: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("School Options", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        Button(onClick = onStudents, modifier = Modifier.fillMaxWidth()) { Text("Students (view only)") }
        Spacer(Modifier.height(8.dp))
        Button(onClick = onAttendance, modifier = Modifier.fillMaxWidth()) { Text("Attendance") }
        Spacer(Modifier.height(8.dp))
        Button(onClick = onMarksheet, modifier = Modifier.fillMaxWidth()) { Text("Marksheets (view only)") }
    }
}