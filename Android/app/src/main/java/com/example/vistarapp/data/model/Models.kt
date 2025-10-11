package com.example.vistarapp.data.model

// Auth
data class LoginRequest(val email: String, val password: String)
data class SignupRequest(val email: String, val password: String)
data class SupabaseUser(val id: String?, val email: String?)
data class SupabaseSession(val access_token: String?)
data class AuthData(val user: SupabaseUser?, val session: SupabaseSession?)

// School
data class School(
    val school_id: String,
    val school_name: String?,
    val description: String?,
    val creator: String?,
    val school_code: String?
)

// Filters
data class Standard(
    val id: String,
    val std: String
)

data class Division(
    val div_id: String,
    val division: String
)

// Lectures
data class Lecture(
    val lecture_id: String,
    val lecture_name: String?,
    val school_id: String?,
    val teacher_id: String?,
    val subject_id: String?,
    val standard: String?,
    val div: String?
)

data class LectureSession(
    val lecture_session_id: String?,
    val lecture_id: String?,
    val started_at: String?,
    val completed_at: String?
)

data class CreateSessionRequest(
    val lecture_id: String,
    val started_at: String,
    val completed_at: String? = null,
    val school_id: String,
    val user_id: String
)

data class CreateSessionResponse(
    val session: LectureSession,
    val students: List<Student>
)

// Students
data class Student(
    val student_id: String,
    val firstname: String?,
    val lastname: String?,
    val address: String?,
    val roll_no: String?,
    val school_id: String?,
    val standard_id: String?,
    val division_id: String?,
    val standard: String?,
    val div: String?
)

// Attendance mark
data class MarkRequest(
    val lecture_session_id: String,
    val student_id: String,
    val attendance: Boolean
)

data class MarkResult(
    val updated: Boolean? = null,
    val created: Boolean? = null
)

// Attendance viewing
data class SessionDetails(
    val lecture_session_id: String,
    val started_at: String?,
    val completed_at: String?,
    val lecture_id: String?,
    val lecture_name: String?,
    val subject_name: String?,
    val teacher_name: String?,
    val standard_id: String?,
    val division_id: String?,
    val standard: String?,
    val division: String?,
    val school_id: String?
)

data class AttendanceRow(
    val attendance_id: String?,
    val lecture_session_id: String?,
    val student_id: String,
    val attendance: Boolean,
    val firstname: String?,
    val lastname: String?,
    val roll_no: String?
)

// Marksheets
data class MarksheetHeader(
    val marksheet_id: String,
    val school_id: String,
    val standard_id: String?,
    val division_id: String?,
    val exam_name: String?,
    val exam_date: String?,
    val term: String?,
    val created_by: String?,
    val created_at: String?
)

data class MarksEntry(
    val marks_entry_id: String?,
    val marksheet_id: String,
    val student_id: String,
    val subject_id: String,
    val max_marks: Int?,
    val obtained_marks: Int?,
    val percent: Double?,
    val grade: String?,
    val subject_name: String?,
    val student_name: String?,
    val roll_no: String?
)