package com.example.vistarapp.ui.screens

import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.cache.AttendanceCache
import com.example.vistarapp.data.model.CreateSessionRequest
import com.example.vistarapp.data.model.Lecture
import kotlinx.coroutines.launch

@Composable
fun SelectLectureScreen(
    schoolId: String,
    userId: String,
    onStartSession: (String, String) -> Unit
) {
    val context = LocalContext.current
    var lectures by remember { mutableStateOf<List<Lecture>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(schoolId, userId) {
        try {
            val resp = ApiClient.service.availableLectures(schoolId, userId)
            if (resp.isSuccessful) {
                lectures = resp.body() ?: emptyList()
            } else {
                error = "Failed to load lectures: ${resp.code()}"
            }
        } catch (e: Exception) {
            error = e.message
        } finally { loading = false }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Select Lecture", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        if (loading) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        } else if (error != null) {
            Text(error!!, color = MaterialTheme.colorScheme.error)
        } else {
            LazyColumn {
                items(lectures) { lec ->
                    ElevatedCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                            .clickable {
                        // Create session
                        scope.launch {
                            try {
                                val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(java.util.Date())
                                val resp = ApiClient.service.createSession(
                                    CreateSessionRequest(
                                        lecture_id = lec.lecture_id,
                                        started_at = now,
                                        school_id = schoolId,
                                        user_id = userId
                                    )
                                )
                                if (resp.isSuccessful) {
                                    val body = resp.body()
                                    val sessionId = body?.session?.lecture_session_id ?: return@launch
                                    // Cache students for offline use during marking
                                    val cache = AttendanceCache(context)
                                    cache.cacheStudents(sessionId!!, body.students)
                                    onStartSession(sessionId!!, lec.lecture_name ?: "Lecture")
                                } else {
                                    error = "Failed to create session: ${resp.code()}"
                                }
                            } catch (e: Exception) {
                                error = e.message
                            }
                        }
                    },
                        colors = CardDefaults.elevatedCardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        ),
                        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(lec.lecture_name ?: "Lecture", style = MaterialTheme.typography.titleMedium)
                            Text("Std: ${lec.standard ?: ""}, Div: ${lec.div ?: ""}", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }
    }
}