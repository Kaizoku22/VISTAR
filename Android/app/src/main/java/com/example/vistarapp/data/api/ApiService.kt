package com.example.vistarapp.data.api

import com.example.vistarapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("login")
    suspend fun login(@Body body: LoginRequest): Response<AuthData>

    @POST("signup")
    suspend fun signup(@Body body: SignupRequest): Response<String>

    // Schools
    @GET("school")
    suspend fun listSchools(): Response<List<School>>

    @GET("school/{id}")
    suspend fun getSchool(@Path("id") id: String): Response<School>

    // User-specific schools
    @GET("school/created_schools/{userId}")
    suspend fun createdSchools(@Path("userId") userId: String): Response<List<School>>

    @GET("user/{userId}/schools/joined")
    suspend fun joinedSchools(@Path("userId") userId: String): Response<List<School>>

    // Attendance
    @GET("attendance/available-lectures/{schoolId}")
    suspend fun availableLectures(
        @Path("schoolId") schoolId: String,
        @Query("user_id") userId: String
    ): Response<List<Lecture>>

    @POST("attendance/sessions")
    suspend fun createSession(@Body body: CreateSessionRequest): Response<CreateSessionResponse>

    @GET("attendance/sessions/{schoolId}")
    suspend fun listSessions(@Path("schoolId") schoolId: String, @Query("lecture_id") lectureId: String? = null): Response<List<LectureSession>>

    @GET("attendance/sessions/{sessionId}/students")
    suspend fun sessionStudents(@Path("sessionId") sessionId: String): Response<List<Student>>

    @POST("attendance/mark")
    suspend fun markAttendance(@Body body: MarkRequest): Response<MarkResult>

    @GET("attendance/sessions/{sessionId}/details")
    suspend fun sessionDetails(@Path("sessionId") sessionId: String): Response<SessionDetails>

    @GET("attendance/sessions/{sessionId}/attendance")
    suspend fun sessionAttendance(@Path("sessionId") sessionId: String): Response<List<AttendanceRow>>

    // Students (read-only)
    @GET("students/{schoolId}")
    suspend fun listStudents(
        @Path("schoolId") schoolId: String,
        @Query("standard_id") standardId: String? = null,
        @Query("division_id") divisionId: String? = null,
        @Query("name") name: String? = null
    ): Response<List<Student>>

    // Standards & Divisions for a school
    @GET("school/{schoolId}/standards")
    suspend fun schoolStandards(@Path("schoolId") schoolId: String): Response<List<Standard>>

    @GET("school/{schoolId}/divisions")
    suspend fun schoolDivisions(@Path("schoolId") schoolId: String): Response<List<Division>>

    // Marksheets (read-only)
    @GET("marksheets/{schoolId}")
    suspend fun listMarkSheets(@Path("schoolId") schoolId: String): Response<List<MarksheetHeader>>

    @GET("marksheets/header/{marksheetId}")
    suspend fun getMarksheet(@Path("marksheetId") marksheetId: String): Response<MarksheetHeader>

    @GET("marksheets/entries/{marksheetId}")
    suspend fun getMarksEntries(@Path("marksheetId") marksheetId: String): Response<List<MarksEntry>>
}