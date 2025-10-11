package com.example.vistarapp.data.cache

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.vistarapp.data.api.ApiService
import com.example.vistarapp.data.model.MarkRequest
import com.example.vistarapp.data.model.Student
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.squareup.moshi.Types

private val Context.dataStore by preferencesDataStore(name = "attendance_cache")

class AttendanceCache(private val context: Context) {
    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()
    private val listType = Types.newParameterizedType(List::class.java, PendingMark::class.java)
    private val studentsType = Types.newParameterizedType(List::class.java, Student::class.java)
    private val marksAdapter = moshi.adapter<List<PendingMark>>(listType)
    private val studentsAdapter = moshi.adapter<List<Student>>(studentsType)

    data class PendingMark(val student_id: String, val attendance: Boolean)

    private fun pendingKey(sessionId: String): Preferences.Key<String> = stringPreferencesKey("pending_" + sessionId)
    private fun studentsKey(sessionId: String): Preferences.Key<String> = stringPreferencesKey("students_" + sessionId)
    private fun uploadedKey(sessionId: String): Preferences.Key<Boolean> = booleanPreferencesKey("uploaded_" + sessionId)

    suspend fun cacheStudents(sessionId: String, students: List<Student>) {
        val sorted = students.sortedBy { it.roll_no?.toIntOrNull() ?: Int.MAX_VALUE }
        val json = studentsAdapter.toJson(sorted)
        context.dataStore.edit { prefs ->
            prefs[studentsKey(sessionId)] = json
        }
    }

    suspend fun getCachedStudents(sessionId: String): List<Student> {
        val flow = context.dataStore.data.map { prefs -> prefs[studentsKey(sessionId)] }
        val json = flow.first() ?: return emptyList()
        return studentsAdapter.fromJson(json) ?: emptyList()
    }

    suspend fun recordMark(sessionId: String, studentId: String, attendance: Boolean) {
        val currentJson = context.dataStore.data.map { it[pendingKey(sessionId)] }.first()
        val current = currentJson?.let { marksAdapter.fromJson(it) }?.toMutableList() ?: mutableListOf()
        // Replace if exists
        val idx = current.indexOfFirst { it.student_id == studentId }
        if (idx >= 0) {
            current[idx] = PendingMark(studentId, attendance)
        } else {
            current.add(PendingMark(studentId, attendance))
        }
        val json = marksAdapter.toJson(current)
        context.dataStore.edit { prefs ->
            prefs[pendingKey(sessionId)] = json
            prefs[uploadedKey(sessionId)] = false
        }
    }

    suspend fun uploadPending(api: ApiService, sessionId: String): Boolean {
        val currentJson = context.dataStore.data.map { it[pendingKey(sessionId)] }.first()
        val marks = currentJson?.let { marksAdapter.fromJson(it) } ?: emptyList()
        if (marks.isEmpty()) return true
        try {
            for (mark in marks) {
                val resp = api.markAttendance(MarkRequest(sessionId, mark.student_id, mark.attendance))
                if (!resp.isSuccessful) return false
            }
            // Clear marks and flag uploaded
            context.dataStore.edit { prefs ->
                prefs.remove(pendingKey(sessionId))
                prefs[uploadedKey(sessionId)] = true
            }
            return true
        } catch (e: Exception) {
            return false
        }
    }

    fun isUploaded(sessionId: String): Boolean = runBlocking {
        context.dataStore.data.map { it[uploadedKey(sessionId)] ?: false }.first()
    }
}