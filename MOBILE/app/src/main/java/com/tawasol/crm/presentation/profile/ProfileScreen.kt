package com.tawasol.crm.presentation.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tawasol.crm.data.model.User
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onNavigateToSettings: () -> Unit = {},
    onNavigateToNotificationSettings: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    val userState by viewModel.userState.collectAsState()
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        item {
            Text(
                text = "Profile",
                style = MaterialTheme.typography.headlineLarge,
                color = Indigo600,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            when (userState) {
                is Resource.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = Indigo600)
                    }
                }
                is Resource.Success -> {
                    val user = (userState as Resource.Success<User>).data
                    if (user != null) {
                        ProfileHeader(user)
                    }
                }
                is Resource.Error -> {
                    Text(
                        text = (userState as Resource.Error).message ?: "Failed to load profile",
                        color = Error
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
        
        item {
            // Account Section
            SectionHeader("Account")
            Spacer(modifier = Modifier.height(12.dp))
            
            ProfileMenuItem(
                icon = Icons.Default.Edit,
                title = "Edit Profile",
                subtitle = "Update your personal information",
                onClick = { /* TODO: Navigate to edit profile */ }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            ProfileMenuItem(
                icon = Icons.Default.Lock,
                title = "Change Password",
                subtitle = "Update your password",
                onClick = { /* TODO: Navigate to change password */ }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            // Preferences Section
            SectionHeader("Preferences")
            Spacer(modifier = Modifier.height(12.dp))
            
            ProfileMenuItem(
                icon = Icons.Default.Settings,
                title = "App Settings",
                subtitle = "Configure app preferences",
                onClick = onNavigateToSettings
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            ProfileMenuItem(
                icon = Icons.Default.Notifications,
                title = "Notification Settings",
                subtitle = "Manage notification preferences",
                onClick = onNavigateToNotificationSettings
            )
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            // About Section
            SectionHeader("About")
            Spacer(modifier = Modifier.height(12.dp))
            
            ProfileMenuItem(
                icon = Icons.Default.Info,
                title = "About Tawasol CRM",
                subtitle = "Version 1.0.0",
                onClick = { /* TODO: Show about dialog */ }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            ProfileMenuItem(
                icon = Icons.Default.PrivacyTip,
                title = "Privacy Policy",
                subtitle = "View our privacy policy",
                onClick = { /* TODO: Open privacy policy */ }
            )
            
            Spacer(modifier = Modifier.height(32.dp))
        }
        
        item {
            // Logout Button
            Button(
                onClick = {
                    viewModel.logout()
                    onLogout()
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Error
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Logout,
                    contentDescription = "Logout",
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Logout")
            }
        }
    }
}

@Composable
fun ProfileHeader(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Indigo50
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(Indigo600),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = user.name.first().uppercase(),
                    style = MaterialTheme.typography.headlineLarge,
                    color = androidx.compose.ui.graphics.Color.White,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = user.name,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Gray900
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyMedium,
                color = Gray600
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Role Badge
            Surface(
                shape = MaterialTheme.shapes.small,
                color = when (user.role.lowercase()) {
                    "admin" -> Error
                    "manager" -> Warning
                    "employee" -> Info
                    else -> Gray400
                }
            ) {
                Text(
                    text = user.role.uppercase(),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = androidx.compose.ui.graphics.Color.White
                )
            }
            
            if (user.phone != null) {
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Phone,
                        contentDescription = "Phone",
                        modifier = Modifier.size(16.dp),
                        tint = Gray600
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = user.phone,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Gray600
                    )
                }
            }
        }
    }
}

@Composable
fun SectionHeader(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = Gray900
    )
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = androidx.compose.ui.graphics.Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = Indigo600,
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = Gray900
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = Gray600
                )
            }
            
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Navigate",
                tint = Gray400,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
