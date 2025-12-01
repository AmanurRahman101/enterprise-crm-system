package com.tawasol.crm.presentation.organization

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.tawasol.crm.presentation.components.SearchBar
import com.tawasol.crm.presentation.components.FilterChip
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@Composable
fun IssuesScreen(
    viewModel: IssuesViewModel = hiltViewModel()
) {
    val issuesState by viewModel.issuesState.collectAsState()
    val filteredIssues by viewModel.filteredIssues.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedStatusFilter by viewModel.selectedStatusFilter.collectAsState()
    val selectedPriorityFilter by viewModel.selectedPriorityFilter.collectAsState()
    
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
            Text(
                text = "Issues",
                style = MaterialTheme.typography.headlineLarge,
                color = Indigo600,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Track and manage client-reported issues",
            style = MaterialTheme.typography.bodyMedium,
            color = Gray600
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Search Bar
        SearchBar(
            query = searchQuery,
            onQueryChange = { viewModel.setSearchQuery(it) },
            placeholder = "Search issues..."
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Status Filter Chips
        Text(
            text = "Status",
            style = MaterialTheme.typography.labelMedium,
            color = Gray600,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    label = "All",
                    selected = selectedStatusFilter == null,
                    onClick = { viewModel.setStatusFilter(null) }
                )
            }
            
            items(listOf("open", "in_progress", "resolved", "closed")) { status ->
                FilterChip(
                    label = status.replace("_", " ").capitalize(),
                    selected = selectedStatusFilter?.equals(status, ignoreCase = true) == true,
                    onClick = {
                        if (selectedStatusFilter?.equals(status, ignoreCase = true) == true) {
                            viewModel.setStatusFilter(null)
                        } else {
                            viewModel.setStatusFilter(status)
                        }
                    }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Priority Filter Chips
        Text(
            text = "Priority",
            style = MaterialTheme.typography.labelMedium,
            color = Gray600,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    label = "All",
                    selected = selectedPriorityFilter == null,
                    onClick = { viewModel.setPriorityFilter(null) }
                )
            }
            
            items(listOf("urgent", "high", "medium", "low")) { priority ->
                FilterChip(
                    label = priority.capitalize(),
                    selected = selectedPriorityFilter?.equals(priority, ignoreCase = true) == true,
                    onClick = {
                        if (selectedPriorityFilter?.equals(priority, ignoreCase = true) == true) {
                            viewModel.setPriorityFilter(null)
                        } else {
                            viewModel.setPriorityFilter(priority)
                        }
                    }
                )
            }
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
                if (filteredIssues.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.CheckCircle,
                        message = if (searchQuery.isNotBlank() || selectedStatusFilter != null || selectedPriorityFilter != null) {
                            "No issues match your filters"
                        } else {
                            "No issues reported"
                        }
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredIssues) { issue ->
                            IssueCard(issue)
                        }
                    }
                }
            }
            is Resource.Error -> {
                ErrorMessage(
                    message = (issuesState as Resource.Error).message ?: "Failed to load issues",
                    onRetry = { viewModel.loadIssues() }
                )
            }
        }
    }
}

@Composable
fun IssueCard(issue: Issue) {
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
                maxLines = 2
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
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
                        text = "JIRA: $ticketId",
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray600
                    )
                }
            }
        }
    }
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
