package com.tawasol.crm.presentation.organization

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tawasol.crm.data.local.TokenManager
import com.tawasol.crm.presentation.theme.*
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun MoreScreen(
    onLogout: () -> Unit = {},
    tokenManager: TokenManager = hiltViewModel<com.tawasol.crm.presentation.auth.AuthViewModel>().tokenManager
) {
    var showLogoutDialog by remember { mutableStateOf(false) }
    var userName by remember { mutableStateOf("User") }
    var userEmail by remember { mutableStateOf("") }
    
    val scope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        val user = tokenManager.getUser().first()
        userName = user?.name ?: "User"
        userEmail = user?.email ?: ""
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // User Profile Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Indigo100
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = MaterialTheme.shapes.medium,
                    color = Indigo600,
                    modifier = Modifier.size(56.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Profile",
                            tint = androidx.compose.ui.graphics.Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.width(16.dp))
                
                Column {
                    Text(
                        text = userName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = Gray900
                    )
                    Text(
                        text = userEmail,
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray600
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Menu Items
        Text(
            text = "ACCOUNT",
            style = MaterialTheme.typography.labelSmall,
            color = Gray600,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        MenuItem(
            icon = Icons.Default.Business,
            title = "Organizations",
            subtitle = "Manage your organizations"
        )
        
        MenuItem(
            icon = Icons.Default.Person,
            title = "Profile",
            subtitle = "Edit your profile information"
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "PREFERENCES",
            style = MaterialTheme.typography.labelSmall,
            color = Gray600,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        MenuItem(
            icon = Icons.Default.Settings,
            title = "Settings",
            subtitle = "App preferences and configuration"
        )
        
        MenuItem(
            icon = Icons.Default.Notifications,
            title = "Notifications",
            subtitle = "Manage notification preferences"
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "SUPPORT",
            style = MaterialTheme.typography.labelSmall,
            color = Gray600,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        MenuItem(
            icon = Icons.Default.Help,
            title = "Help & Support",
            subtitle = "Get help or contact support"
        )
        
        MenuItem(
            icon = Icons.Default.Info,
            title = "About",
            subtitle = "App version and information"
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Logout Button
        Button(
            onClick = { showLogoutDialog = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Error
            )
        ) {
            Icon(
                Icons.Default.Logout,
                contentDescription = "Logout",
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Logout")
        }
    }
    
    // Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text = { Text("Are you sure you want to logout?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            tokenManager.clearAll()
                            onLogout()
                        }
                    }
                ) {
                    Text("Logout", color = Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun MenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* TODO: Navigate to respective screen */ },
        colors = CardDefaults.cardColors(
            containerColor = androidx.compose.ui.graphics.Color.White
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                contentDescription = title,
                tint = Indigo600,
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
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
                Icons.Default.ChevronRight,
                contentDescription = "Navigate",
                tint = Gray400
            )
        }
    }
    
    Spacer(modifier = Modifier.height(8.dp))
}
