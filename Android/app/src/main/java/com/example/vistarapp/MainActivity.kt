package com.example.vistarapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.example.vistarapp.ui.theme.VISTARAPPTheme
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.composable
import com.example.vistarapp.ui.screens.LoginScreen
import com.example.vistarapp.ui.screens.RegisterScreen
import com.example.vistarapp.ui.screens.HomeScreen
import com.example.vistarapp.ui.screens.SchoolDashboardScreen
import com.example.vistarapp.ui.screens.StudentsScreen
import com.example.vistarapp.ui.screens.MarksheetsScreen
import com.example.vistarapp.ui.screens.SelectLectureScreen
import com.example.vistarapp.ui.screens.StartAttendanceScreen
import android.content.Intent

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VISTARAPPTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    val navController = rememberNavController()
                    NavHost(
                        navController = navController,
                        startDestination = "splash",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("splash") {
                            com.example.vistarapp.ui.screens.SplashScreen(
                                onFinished = {
                                    navController.navigate("login") {
                                        popUpTo("splash") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("login") { LoginScreen(onLoginSuccess = { userId -> navController.navigate("home/$userId") }) }
                        composable("register") { RegisterScreen(onRegistered = { navController.navigate("login") }) }
                        composable("home/{userId}") { backStackEntry ->
                            val userId = backStackEntry.arguments?.getString("userId") ?: ""
                            HomeScreen(userId = userId, onSelectSchool = { schoolId ->
                                navController.navigate("school/$schoolId/$userId")
                            })
                        }
                        composable("school/{schoolId}/{userId}") { backStackEntry ->
                            val schoolId = backStackEntry.arguments?.getString("schoolId") ?: ""
                            val userId = backStackEntry.arguments?.getString("userId") ?: ""
                            SchoolDashboardScreen(
                                schoolId = schoolId,
                                onStudents = { navController.navigate("students/$schoolId") },
                                onAttendance = { navController.navigate("attendance/menu/$schoolId/$userId") },
                                onMarksheet = { navController.navigate("marksheets/$schoolId") }
                            )
                        }
                        composable("attendance/menu/{schoolId}/{userId}") { backStackEntry ->
                            val schoolId = backStackEntry.arguments?.getString("schoolId") ?: ""
                            val userId = backStackEntry.arguments?.getString("userId") ?: ""
                            com.example.vistarapp.ui.screens.AttendanceMenuScreen(
                                schoolId = schoolId,
                                userId = userId,
                                onStartAttendance = { navController.navigate("attendance/start/$schoolId/$userId") },
                                onShowAttendance = { navController.navigate("attendance/show/$schoolId") },
                                onMonthlyAttendance = { navController.navigate("attendance/monthly/$schoolId") }
                            )
                        }
                        composable("attendance/show/{schoolId}") { backStackEntry ->
                            val schoolId = backStackEntry.arguments?.getString("schoolId") ?: ""
                            com.example.vistarapp.ui.screens.ShowAttendanceScreen(
                                schoolId = schoolId,
                                onOpenSession = { sessionId -> navController.navigate("attendance/show/detail/$sessionId") }
                            )
                        }
                        composable("attendance/show/detail/{sessionId}") { backStackEntry ->
                            val sessionId = backStackEntry.arguments?.getString("sessionId") ?: ""
                            com.example.vistarapp.ui.screens.ShowAttendanceDetailScreen(sessionId = sessionId)
                        }
                        composable("attendance/monthly/{schoolId}") { backStackEntry ->
                            val schoolId = backStackEntry.arguments?.getString("schoolId") ?: ""
                            com.example.vistarapp.ui.screens.MonthlyAttendanceScreen(schoolId)
                        }
                        composable("students/{schoolId}") { backStackEntry ->
                            StudentsScreen(schoolId = backStackEntry.arguments?.getString("schoolId") ?: "")
                        }
                        composable("marksheets/{schoolId}") { backStackEntry ->
                            MarksheetsScreen(schoolId = backStackEntry.arguments?.getString("schoolId") ?: "")
                        }
                        composable("attendance/start/{schoolId}/{userId}") { backStackEntry ->
                            val schoolId = backStackEntry.arguments?.getString("schoolId") ?: ""
                            val userId = backStackEntry.arguments?.getString("userId") ?: ""
                            StartAttendanceScreen(
                                schoolId = schoolId,
                                userId = userId,
                                onStartAttendance = { sessionId, lectureName ->
                                    val intent = Intent(this@MainActivity, RecordAttendanceActivity::class.java).apply {
                                        putExtra(RecordAttendanceActivity.EXTRA_SESSION_ID, sessionId)
                                        putExtra(RecordAttendanceActivity.EXTRA_LECTURE_NAME, lectureName)
                                    }
                                    startActivity(intent)
                                }
                            )
                        }
                        // Route retained for backward compatibility if needed
                    }
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    VISTARAPPTheme {
        Greeting("Android")
    }
}