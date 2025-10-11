package com.example.vistarapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.vistarapp.ui.theme.VISTARAPPTheme
import com.example.vistarapp.ui.screens.RecordAttendanceScreen

class RecordAttendanceActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sessionId = intent.getStringExtra(EXTRA_SESSION_ID) ?: ""
        val lectureName = intent.getStringExtra(EXTRA_LECTURE_NAME) ?: "Lecture"
        setContent {
            VISTARAPPTheme {
                RecordAttendanceScreen(sessionId = sessionId, lectureName = lectureName)
            }
        }
    }

    companion object {
        const val EXTRA_SESSION_ID = "session_id"
        const val EXTRA_LECTURE_NAME = "lecture_name"
    }
}