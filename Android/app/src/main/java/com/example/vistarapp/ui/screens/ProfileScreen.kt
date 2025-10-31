package com.example.vistarapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Person

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import com.example.vistarapp.data.api.ApiClient
import com.example.vistarapp.data.model.UserProfile
import com.example.vistarapp.data.model.UpdateProfileRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    userId: String,
    onBackClick: () -> Unit,
    onLogout: () -> Unit
) {
    var isEditing by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showSnackbar by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf("") }
    
    var profile by remember { mutableStateOf(UserProfile()) }
    var editedProfile by remember { mutableStateOf(UserProfile()) }
    
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    // Load profile data on screen load
    LaunchedEffect(userId) {
        try {
            val response = ApiClient.service.getUserProfile(userId)
            if (response.isSuccessful) {
                response.body()?.let { profileData ->
                    profile = profileData
                    editedProfile = profile
                }
            } else {
                error = "Failed to load profile: ${response.code()}"
            }
        } catch (e: Exception) {
            error = "Error loading profile: ${e.message}"
        } finally {
            loading = false
        }
    }

    // Show snackbar when needed
    LaunchedEffect(showSnackbar) {
        if (showSnackbar) {
            snackbarHostState.showSnackbar(snackbarMessage)
            showSnackbar = false
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "Profile",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    if (isEditing) {
                        IconButton(
                            onClick = {
                                scope.launch {
                                    try {
                                        val updateRequest = UpdateProfileRequest(
                                             first_name = editedProfile.first_name,
                                             last_name = editedProfile.last_name,
                                             phone = editedProfile.phone,
                                             address = editedProfile.address
                                         )
                                        val response = ApiClient.service.updateUserProfile(userId, updateRequest)
                                        if (response.isSuccessful) {
                                            response.body()?.let { updatedProfile ->
                                                profile = updatedProfile
                                                editedProfile = profile
                                                isEditing = false
                                                snackbarMessage = "Profile updated successfully!"
                                                showSnackbar = true
                                            }
                                        } else {
                                            snackbarMessage = "Failed to save profile: ${response.code()}"
                                            showSnackbar = true
                                        }
                                    } catch (e: Exception) {
                                        snackbarMessage = "Failed to update profile: ${e.message}"
                                        showSnackbar = true
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Save"
                            )
                        }
                    } else {
                        IconButton(
                            onClick = { 
                                editedProfile = profile
                                isEditing = true 
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit"
                            )
                        }
                    }
                    
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Logout"
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            if (loading) {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (error != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = error!!,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            } else {
                // Profile Avatar and Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Card(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile Avatar",
                                modifier = Modifier.size(40.dp),
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Column {
                        Text(
                            text = if (profile.first_name.isNotEmpty() || profile.last_name.isNotEmpty()) {
                    "${profile.first_name} ${profile.last_name}".trim()
                } else {
                    "User Profile"
                },
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = profile.email,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(bottom = 24.dp))

                // Profile Fields
                if (isEditing) {
                    // Edit Mode
                    OutlinedTextField(
                        value = editedProfile.first_name,
                        onValueChange = { editedProfile = editedProfile.copy(first_name = it) },
                        label = { Text("First Name") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    )
                    
                    OutlinedTextField(
                        value = editedProfile.last_name,
                        onValueChange = { editedProfile = editedProfile.copy(last_name = it) },
                        label = { Text("Last Name") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    )
                    
                    OutlinedTextField(
                        value = editedProfile.email,
                        onValueChange = { editedProfile = editedProfile.copy(email = it) },
                        label = { Text("Email") },
                        enabled = false,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    )
                    
                    OutlinedTextField(
                        value = editedProfile.phone,
                        onValueChange = { editedProfile = editedProfile.copy(phone = it) },
                        label = { Text("Phone") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    )
                    
                    OutlinedTextField(
                        value = editedProfile.address,
                        onValueChange = { editedProfile = editedProfile.copy(address = it) },
                        label = { Text("Address") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        minLines = 3
                    )
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                editedProfile = profile
                                isEditing = false
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancel")
                        }
                        
                        Button(
                            onClick = {
                                scope.launch {
                                    try {
                                        val updateRequest = UpdateProfileRequest(
                                             first_name = editedProfile.first_name,
                                             last_name = editedProfile.last_name,
                                             phone = editedProfile.phone,
                                             address = editedProfile.address
                                         )
                                        val response = ApiClient.service.updateUserProfile(userId, updateRequest)
                                        if (response.isSuccessful) {
                                            response.body()?.let { updatedProfile ->
                                                profile = updatedProfile
                                                editedProfile = profile
                                                isEditing = false
                                                snackbarMessage = "Profile updated successfully!"
                                                showSnackbar = true
                                            }
                                        } else {
                                            snackbarMessage = "Failed to save profile: ${response.code()}"
                                            showSnackbar = true
                                        }
                                    } catch (e: Exception) {
                                        snackbarMessage = "Failed to update profile: ${e.message}"
                                        showSnackbar = true
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Save")
                        }
                    }
                } else {
                    // View Mode
                    ProfileField("First Name", profile.first_name.ifEmpty { "Not provided" })
                    ProfileField("Last Name", profile.last_name.ifEmpty { "Not provided" })
                    ProfileField("Email", profile.email)
                    ProfileField("Phone", profile.phone.ifEmpty { "Not provided" })
                    ProfileField("Address", profile.address.ifEmpty { "Not provided" })
                }
            }
        }
    }
}

@Composable
private fun ProfileField(label: String, value: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge
        )
    }
}