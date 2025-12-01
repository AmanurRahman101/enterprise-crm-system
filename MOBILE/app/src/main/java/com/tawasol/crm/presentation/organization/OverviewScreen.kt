package com.tawasol.crm.presentation.organization

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tawasol.crm.presentation.theme.*

@Composable
fun OverviewScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Dashboard Overview",
            style = MaterialTheme.typography.headlineLarge,
            color = Indigo600,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Your organization at a glance",
            style = MaterialTheme.typography.bodyMedium,
            color = Gray600
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Stats Grid
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                modifier = Modifier.weight(1f),
                title = "Active Deals",
                value = "0",
                icon = Icons.Default.TrendingUp,
                color = Success
            )
            
            StatCard(
                modifier = Modifier.weight(1f),
                title = "Open Issues",
                value = "0",
                icon = Icons.Default.BugReport,
                color = Warning
            )
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                modifier = Modifier.weight(1f),
                title = "Total Contacts",
                value = "0",
                icon = Icons.Default.Contacts,
                color = Indigo600
            )
            
            StatCard(
                modifier = Modifier.weight(1f),
                title = "Revenue",
                value = "$0",
                icon = Icons.Default.AttachMoney,
                color = Success
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Placeholder for charts/analytics
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Gray50
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.BarChart,
                    contentDescription = "Analytics",
                    modifier = Modifier.size(48.dp),
                    tint = Gray400
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Analytics Coming Soon",
                    style = MaterialTheme.typography.titleMedium,
                    color = Gray600
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Charts and insights will appear here",
                    style = MaterialTheme.typography.bodySmall,
                    color = Gray500
                )
            }
        }
    }
}

@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: androidx.compose.ui.graphics.Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = androidx.compose.ui.graphics.Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Icon(
                icon,
                contentDescription = title,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Gray900
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = Gray600
            )
        }
    }
}
