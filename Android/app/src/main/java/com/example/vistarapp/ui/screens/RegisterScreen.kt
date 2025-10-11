package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.SignupRequest
import kotlinx.coroutines.launch

@Composable
fun RegisterScreen(onRegistered: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Register", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
        Spacer(Modifier.height(16.dp))
        Button(enabled = !loading, onClick = {
            loading = true
            error = null
            scope.launch {
                try {
                    val resp = ApiClient.service.signup(SignupRequest(email, password))
                    loading = false
                    if (resp.isSuccessful) {
                        onRegistered()
                    } else {
                        error = "Signup failed: ${resp.code()}"
                    }
                } catch (e: Exception) {
                    loading = false
                    error = e.message
                }
            }
        }) { Text(if (loading) "Registering..." else "Register") }
        error?.let { Spacer(Modifier.height(8.dp)); Text(it, color = MaterialTheme.colorScheme.error) }
    }
}