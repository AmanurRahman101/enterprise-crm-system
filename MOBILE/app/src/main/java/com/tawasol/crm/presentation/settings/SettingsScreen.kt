package com.tawasol.crm.presentation.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tawasol.crm.presentation.theme.*

@Composable
fun SettingsScreen() {
    var isDarkMode by remember { mutableStateOf(false) }
    var autoSync by remember { mutableStateOf(true) }
    var cacheData by remember { mutableStateOf(true) }
    var compactView by remember { mutableStateOf(false) }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        item {
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineLarge,
                color = Indigo600,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            // Appearance Section
            SectionHeader("Appearance")
            Spacer(modifier = Modifier.height(12.dp))
            
            SettingSwitch(
                icon = Icons.Default.DarkMode,
                title = "Dark Mode",
                subtitle = "Switch to dark theme",
                checked = isDarkMode,
                onCheckedChange = { isDarkMode = it }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            SettingSwitch(
                icon = Icons.Default.ViewCompact,
                title = "Compact View",
                subtitle = "Show more items on screen",
                checked = compactView,
                onCheckedChange = { compactView = it }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            // Data Section
            SectionHeader("Data & Sync")
            Spacer(modifier = Modifier.height(12.dp))
            
            SettingSwitch(
                icon = Icons.Default.Sync,
                title = "Auto Sync",
                subtitle = "Automatically sync data when online",
                checked = autoSync,
                onCheckedChange = { autoSync = it }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            SettingSwitch(
                icon = Icons.Default.Storage,
                title = "Cache Data",
                subtitle = "Store data locally for offline access",
                checked = cacheData,
                onCheckedChange = { cacheData = it }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            SettingButton(
                icon = Icons.Default.Delete,
                title = "Clear Cache",
                subtitle = "Remove all cached data",
                onClick = { /* TODO: Clear cache */ }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            // Language Section
            SectionHeader("Language & Region")
            Spacer(modifier = Modifier.height(12.dp))
            
            SettingButton(
                icon = Icons.Default.Language,
                title = "Language",
                subtitle = "English (US)",
                onClick = { /* TODO: Open language selector */ }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            SettingButton(
                icon = Icons.Default.AccessTime,
                title = "Time Zone",
                subtitle = "Auto detect",
                onClick = { /* TODO: Open timezone selector */ }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        item {
            // Advanced Section
            SectionHeader("Advanced")
            Spacer(modifier = Modifier.height(12.dp))
            
            SettingButton(
                icon = Icons.Default.BugReport,
                title = "Debug Mode",
                subtitle = "Enable logging and diagnostics",
                onClick = { /* TODO: Toggle debug mode */ }
            )
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
fun SettingSwitch(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Card(
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

@Composable
fun SettingButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
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
