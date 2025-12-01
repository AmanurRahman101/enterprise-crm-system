package com.tawasol.crm.presentation.client

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tawasol.crm.data.model.Issue
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@Composable
fun ClientIssuesScreen(
    viewModel: ClientViewModel = hiltViewModel()
) {
    val issuesState by viewModel.clientIssuesState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "My Issues",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Indigo600,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Report and track your support requests",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray600
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Create Issue Button
        Button(
            onClick = { showCreateDialog = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Indigo600
            )
        ) {
            Icon(
                Icons.Default.Add,
                contentDescription = "Create",
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Report New Issue")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        when (issuesState) {
            is Resource.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Indigo600)
                }
            }
            is Resource.Success -> {
                val issues = (issuesState as Resource.Success<List<Issue>>).data ?: emptyList()
                
                if (issues.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.CheckCircle,
                        message = "No issues reported"
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(issues) { issue ->
                            ClientIssueCard(issue)
                        }
                    }
                }
            }
            is Resource.Error -> {
                ErrorMessage(
                    message = (issuesState as Resource.Error).message ?: "Failed to load issues",
                    onRetry = { viewModel.loadClientIssues() }
                )
            }
        }
    }
    
    // Create Issue Dialog
    if (showCreateDialog) {
        CreateIssueDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { title, description, priority, dealId ->
                // TODO: Call viewModel.createIssue()
                showCreateDialog = false
            }
        )
    }
}

@Composable
fun ClientIssueCard(issue: Issue) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = androidx.compose.ui.graphics.Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = issue.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Gray900,
                    modifier = Modifier.weight(1f)
                )
                
                IssuePriorityBadge(priority = issue.priority)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = issue.description,
                style = MaterialTheme.typography.bodyMedium,
                color = Gray700,
                maxLines = 3
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IssueStatusBadge(status = issue.status)
                
                issue.dealTitle?.let { dealTitle ->
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = Blue100
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Assignment,
                                contentDescription = "Deal",
                                modifier = Modifier.size(14.dp),
                                tint = Indigo600
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = dealTitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = Indigo600
                            )
                        }
                    }
                }
            }
            
            issue.jiraTicketId?.let { ticketId ->
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Link,
                        contentDescription = "JIRA",
                        modifier = Modifier.size(16.dp),
                        tint = Gray600
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Ticket: $ticketId",
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray600,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
fun CreateIssueDialog(
    onDismiss: () -> Unit,
    onCreate: (String, String, String, Int?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("medium") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Report New Issue") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Issue Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )
                
                // Priority Selection
                Text(
                    text = "Priority",
                    style = MaterialTheme.typography.labelMedium,
                    color = Gray700
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("low", "medium", "high", "urgent").forEach { p ->
                        FilterChip(
                            selected = priority == p,
                            onClick = { priority = p },
                            label = { Text(p.uppercase()) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Indigo600,
                                selectedLabelColor = androidx.compose.ui.graphics.Color.White
                            )
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { 
                    if (title.isNotBlank() && description.isNotBlank()) {
                        onCreate(title, description, priority, null)
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600
                ),
                enabled = title.isNotBlank() && description.isNotBlank()
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun IssuePriorityBadge(priority: String) {
    val (bgColor, textColor) = when (priority.lowercase()) {
        "urgent" -> Pair(Error, androidx.compose.ui.graphics.Color.White)
        "high" -> Pair(Warning, androidx.compose.ui.graphics.Color.White)
        "medium" -> Pair(Info, androidx.compose.ui.graphics.Color.White)
        else -> Pair(Gray300, Gray700)
    }
    
    Surface(
        shape = MaterialTheme.shapes.small,
        color = bgColor
    ) {
        Text(
            text = priority.uppercase(),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = textColor
        )
    }
}

@Composable
fun IssueStatusBadge(status: String) {
    val (bgColor, textColor) = when (status.lowercase()) {
        "open" -> Pair(Gray200, Gray700)
        "in_progress" -> Pair(Blue100, Indigo600)
        "resolved" -> Pair(androidx.compose.ui.graphics.Color(0xFFDCFCE7), Success)
        "closed" -> Pair(Gray300, Gray700)
        else -> Pair(Gray200, Gray700)
    }
    
    Surface(
        shape = MaterialTheme.shapes.small,
        color = bgColor
    ) {
        Text(
            text = status.replace("_", " ").uppercase(),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = textColor
        )
    }
}

@Composable
fun EmptyState(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    message: String
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Gray400
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = Gray600
        )
    }
}

@Composable
fun ErrorMessage(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.Error,
            contentDescription = "Error",
            modifier = Modifier.size(48.dp),
            tint = Error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = Gray700
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = Indigo600
            )
        ) {
            Text("Retry")
        }
    }
}
