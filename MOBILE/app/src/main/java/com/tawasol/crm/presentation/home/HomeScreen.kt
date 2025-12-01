package com.tawasol.crm.presentation.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tawasol.crm.presentation.theme.Gray700
import com.tawasol.crm.presentation.theme.Indigo600

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onLogout: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Tawasol",
                            color = Indigo600,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "CRM",
                            color = Gray700,
                            fontWeight = FontWeight.Light
                        )
                    }
                },
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Welcome to Tawasol CRM",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Indigo600
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Mobile app is ready!",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Gray700
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Tasks 1-5 completed ✓",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray700
                )
            }
        }
    }
}
