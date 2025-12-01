package com.tawasol.crm.presentation.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tawasol.crm.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsScreen(
    onBackPressed: () -> Unit = {}
) {
    var dealNotifications by remember { mutableStateOf(true) }
    var issueNotifications by remember { mutableStateOf(true) }
    var messageNotifications by remember { mutableStateOf(true) }
    var callNotifications by remember { mutableStateOf(true) }
    var soundEnabled by remember { mutableStateOf(true) }
    var vibrationEnabled by remember { mutableStateOf(true) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notification Settings") },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Indigo600,
                    titleContentColor = androidx.compose.ui.graphics.Color.White,
                    navigationIconContentColor = androidx.compose.ui.graphics.Color.White
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "NOTIFICATION TYPES",
                style = MaterialTheme.typography.labelSmall,
                color = Gray600,
                fontWeight = FontWeight.Bold
            )
            
            NotificationToggle(
                icon = Icons.Default.TrendingUp,
                title = "Deal Updates",
                description = "Get notified about deal assignments and updates",
                checked = dealNotifications,
                onCheckedChange = { dealNotifications = it }
            )
            
            NotificationToggle(
                icon = Icons.Default.BugReport,
                title = "Issue Updates",
                description = "Get notified about new and updated issues",
                checked = issueNotifications,
                onCheckedChange = { issueNotifications = it }
            )
            
            NotificationToggle(
                icon = Icons.Default.Message,
                title = "Messages",
                description = "Get notified about new messages",
                checked = messageNotifications,
                onCheckedChange = { messageNotifications = it }
            )
            
            NotificationToggle(
                icon = Icons.Default.Call,
                title = "Calls",
                description = "Get notified about incoming calls",
                checked = callNotifications,
                onCheckedChange = { callNotifications = it }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "NOTIFICATION SETTINGS",
                style = MaterialTheme.typography.labelSmall,
                color = Gray600,
                fontWeight = FontWeight.Bold
            )
            
            NotificationToggle(
                icon = Icons.Default.VolumeUp,
                title = "Sound",
                description = "Play sound for notifications",
                checked = soundEnabled,
                onCheckedChange = { soundEnabled = it }
            )
            
            NotificationToggle(
                icon = Icons.Default.Vibration,
                title = "Vibration",
                description = "Vibrate for notifications",
                checked = vibrationEnabled,
                onCheckedChange = { vibrationEnabled = it }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Blue100
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = "Info",
                        tint = Indigo600
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Make sure notifications are enabled in your device settings",
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray700
                    )
                }
            }
        }
    }
}

@Composable
fun NotificationToggle(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Gray600
                )
            }
            
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = androidx.compose.ui.graphics.Color.White,
                    checkedTrackColor = Indigo600
                )
            )
        }
    }
}
