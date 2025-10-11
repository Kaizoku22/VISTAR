package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.Division
import com.example.vistarapp.data.model.Standard
import com.example.vistarapp.data.model.Student
import kotlinx.coroutines.launch
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentsScreen(schoolId: String) {
    var students by remember { mutableStateOf<List<Student>>(emptyList()) }
    var standards by remember { mutableStateOf<List<Standard>>(emptyList()) }
    var divisions by remember { mutableStateOf<List<Division>>(emptyList()) }
    var selectedStandard by remember { mutableStateOf<String?>(null) }
    var selectedDivision by remember { mutableStateOf<String?>(null) }
    var searchName by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    // Load filters on enter
    LaunchedEffect(schoolId) {
        try {
            val stdRes = ApiClient.service.schoolStandards(schoolId)
            val divRes = ApiClient.service.schoolDivisions(schoolId)
            if (stdRes.isSuccessful) standards = stdRes.body() ?: emptyList() else error = "Failed to load standards"
            if (divRes.isSuccessful) divisions = divRes.body() ?: emptyList() else error = "Failed to load divisions"
        } catch (e: Exception) { error = e.message }
    }

    suspend fun fetchStudents() {
        loading = true
        error = null
        try {
            if (selectedStandard.isNullOrEmpty() || selectedDivision.isNullOrEmpty()) {
                error = "Please select both standard and division"
                students = emptyList()
                return
            }
            val resp = ApiClient.service.listStudents(
                schoolId = schoolId,
                standardId = selectedStandard,
                divisionId = selectedDivision
            )
            if (resp.isSuccessful) {
                students = (resp.body() ?: emptyList()).sortedBy { it.roll_no?.toIntOrNull() ?: Int.MAX_VALUE }
            } else {
                error = "Failed to load students: ${resp.code()}"
            }
        } catch (e: Exception) { error = e.message }
        finally { loading = false }
    }

    suspend fun searchStudents() {
        val name = searchName.trim()
        if (name.isEmpty()) { error = "Enter a name to search"; return }
        loading = true
        error = null
        try {
            val resp = ApiClient.service.listStudents(
                schoolId = schoolId,
                standardId = selectedStandard,
                divisionId = selectedDivision,
                name = name
            )
            if (resp.isSuccessful) {
                students = (resp.body() ?: emptyList()).sortedBy { it.roll_no?.toIntOrNull() ?: Int.MAX_VALUE }
            } else { error = "Failed to search: ${resp.code()}" }
        } catch (e: Exception) { error = e.message }
        finally { loading = false }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Filter Students", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))

        // Standard dropdown (Material3 ExposedDropdown)
        var stdExpanded by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(expanded = stdExpanded, onExpandedChange = { stdExpanded = !stdExpanded }) {
            OutlinedTextField(
                readOnly = true,
                value = standards.find { it.id == selectedStandard }?.std ?: "Standard",
                onValueChange = {},
                label = { Text("Standard") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = stdExpanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            DropdownMenu(
                expanded = stdExpanded,
                onDismissRequest = { stdExpanded = false },
                shape = RoundedCornerShape(12.dp),
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = 1.dp,
                shadowElevation = 2.dp
            ) {
                standards.forEach { std ->
                    DropdownMenuItem(text = { Text(std.std) }, onClick = { selectedStandard = std.id; stdExpanded = false })
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        // Division dropdown (Material3 ExposedDropdown)
        var divExpanded by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(expanded = divExpanded, onExpandedChange = { divExpanded = !divExpanded }) {
            OutlinedTextField(
                readOnly = true,
                value = divisions.find { it.div_id == selectedDivision }?.division ?: "Division",
                onValueChange = {},
                label = { Text("Division") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = divExpanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            DropdownMenu(
                expanded = divExpanded,
                onDismissRequest = { divExpanded = false },
                shape = RoundedCornerShape(12.dp),
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = 1.dp,
                shadowElevation = 2.dp
            ) {
                divisions.forEach { div ->
                    DropdownMenuItem(text = { Text(div.division) }, onClick = { selectedDivision = div.div_id; divExpanded = false })
                }
            }
        }

        Spacer(Modifier.height(8.dp))
        val scope = rememberCoroutineScope()
        Button(onClick = { scope.launch { fetchStudents() } }, modifier = Modifier.fillMaxWidth()) { Text("Display") }

        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value = searchName,
            onValueChange = { searchName = it },
            label = { Text("Search by name") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { scope.launch { searchStudents() } }, modifier = Modifier.fillMaxWidth()) { Text("Search") }

        Spacer(Modifier.height(12.dp))

        if (loading) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        LazyColumn {
            items(students) { s ->
                val name = "${s.firstname ?: ""} ${s.lastname ?: ""}".trim()
                val initials = listOf(s.firstname?.firstOrNull(), s.lastname?.firstOrNull())
                    .filterNotNull()
                    .joinToString("") { it.uppercaseChar().toString() }
                    .ifEmpty { "?" }

                val stdName = s.standard ?: standards.find { it.id == s.standard_id }?.std ?: ""
                val divName = s.div ?: divisions.find { it.div_id == s.division_id }?.division ?: ""

                ListItem(
                    leadingContent = {
                        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer) {
                            Box(Modifier.size(44.dp), contentAlignment = Alignment.Center) {
                                Text(initials, color = MaterialTheme.colorScheme.onPrimaryContainer)
                            }
                        }
                    },
                    headlineContent = { Text(if (name.isNotBlank()) name else "Unnamed") },
                    supportingContent = {
                        val roll = s.roll_no ?: "-"
                        Text("Roll: $roll — Std: ${stdName.ifBlank { "-" }} — Div: ${divName.ifBlank { "-" }}")
                    }
                )
                Divider()
            }
        }
    }
}