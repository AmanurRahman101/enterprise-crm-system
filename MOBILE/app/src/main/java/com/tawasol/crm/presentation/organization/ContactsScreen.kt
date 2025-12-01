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
import com.tawasol.crm.data.model.Contact
import com.tawasol.crm.presentation.components.SearchBar
import com.tawasol.crm.presentation.components.FilterChip
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@Composable
fun ContactsScreen(
    viewModel: ContactsViewModel = hiltViewModel()
) {
    val contactsState by viewModel.contactsState.collectAsState()
    val filteredContacts by viewModel.filteredContacts.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedTypeFilter by viewModel.selectedTypeFilter.collectAsState()
    val showOnlineOnly by viewModel.showOnlineOnly.collectAsState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Contacts",
            style = MaterialTheme.typography.headlineLarge,
            color = Indigo600,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Manage your client contacts",
            style = MaterialTheme.typography.bodyMedium,
            color = Gray600
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Search Bar
        SearchBar(
            query = searchQuery,
            onQueryChange = { viewModel.setSearchQuery(it) },
            placeholder = "Search contacts..."
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Contact Type Filter Chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    label = "All Types",
                    selected = selectedTypeFilter == null,
                    onClick = { viewModel.setTypeFilter(null) }
                )
            }
            
            items(listOf("person", "organization")) { type ->
                FilterChip(
                    label = type.capitalize(),
                    selected = selectedTypeFilter?.equals(type, ignoreCase = true) == true,
                    onClick = {
                        if (selectedTypeFilter?.equals(type, ignoreCase = true) == true) {
                            viewModel.setTypeFilter(null)
                        } else {
                            viewModel.setTypeFilter(type)
                        }
                    }
                )
            }
            
            item {
                FilterChip(
                    label = "Online Only",
                    selected = showOnlineOnly,
                    onClick = { viewModel.setShowOnlineOnly(!showOnlineOnly) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        when (contactsState) {
            is Resource.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Indigo600)
                }
            }
            is Resource.Success -> {
                if (filteredContacts.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.Contacts,
                        message = if (searchQuery.isNotBlank() || selectedTypeFilter != null || showOnlineOnly) {
                            "No contacts match your filters"
                        } else {
                            "No contacts yet"
                        }
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredContacts) { contact ->
                            ContactCard(contact)
                        }
                    }
                }
            }
            is Resource.Error -> {
                ErrorMessage(
                    message = (contactsState as Resource.Error).message ?: "Failed to load contacts",
                    onRetry = { viewModel.loadContacts() }
                )
            }
        }
    }
}

@Composable
fun ContactCard(contact: Contact) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = androidx.compose.ui.graphics.Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Contact Avatar/Icon
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = Indigo100,
                modifier = Modifier.size(56.dp)
            ) {
                Box(
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (contact.contactType == "person") 
                            Icons.Default.Person 
                        else 
                            Icons.Default.Business,
                        contentDescription = contact.contactType,
                        tint = Indigo600,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Contact Info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = contact.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = Gray900
                    )
                    
                    // Online status indicator
                    contact.isOnline?.let { isOnline ->
                        if (isOnline) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                shape = MaterialTheme.shapes.small,
                                color = Success,
                                modifier = Modifier.size(8.dp)
                            ) {}
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                contact.email?.let { email ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Email,
                            contentDescription = "Email",
                            modifier = Modifier.size(14.dp),
                            tint = Gray600
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = email,
                            style = MaterialTheme.typography.bodySmall,
                            color = Gray600
                        )
                    }
                }
                
                contact.phone?.let { phone ->
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Phone,
                            contentDescription = "Phone",
                            modifier = Modifier.size(14.dp),
                            tint = Gray600
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = phone,
                            style = MaterialTheme.typography.bodySmall,
                            color = Gray600
                        )
                    }
                }
            }
            
            // Contact type badge
            Surface(
                shape = MaterialTheme.shapes.small,
                color = if (contact.contactType == "person") Blue100 else Gray200
            ) {
                Text(
                    text = contact.contactType.uppercase(),
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (contact.contactType == "person") Indigo600 else Gray700
                )
            }
        }
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
