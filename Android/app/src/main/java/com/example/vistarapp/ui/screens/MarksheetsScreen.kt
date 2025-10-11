package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.MarksheetHeader

@Composable
fun MarksheetsScreen(schoolId: String) {
    var sheets by remember { mutableStateOf<List<MarksheetHeader>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(schoolId) {
        try {
            val resp = ApiClient.service.listMarkSheets(schoolId)
            if (resp.isSuccessful) {
                sheets = resp.body() ?: emptyList()
            } else {
                error = "Failed to load marksheets: ${resp.code()}"
            }
        } catch (e: Exception) {
            error = e.message
        } finally { loading = false }
    }

    Column(Modifier.fillMaxSize()) {
        Text("Marksheets", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        if (loading) {
            LinearProgressIndicator(Modifier.fillMaxSize())
        } else if (error != null) {
            Text(error!!, color = MaterialTheme.colorScheme.error)
        } else {
            LazyColumn {
                items(sheets) { m ->
                    Card { 
                        Column(Modifier.fillMaxSize()) {
                            Text(m.exam_name ?: "Exam", style = MaterialTheme.typography.titleMedium)
                            Text("Date: ${m.exam_date ?: ""}", style = MaterialTheme.typography.bodyMedium)
                            Text("Term: ${m.term ?: "-"}", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }
    }
}