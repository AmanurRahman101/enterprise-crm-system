package com.tawasol.crm.presentation.users

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
import com.tawasol.crm.data.model.User
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsersScreen(
    viewModel: UsersViewModel = hiltViewModel()
) {
    val usersState by viewModel.usersState.collectAsState()
    var showInviteDialog by remember { mutableStateOf(false) }
    var selectedRoleFilter by remember { mutableStateOf("all") }
    
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
                    text = "Team Members",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Indigo600,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Manage users and permissions",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray600
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Invite Button
        Button(
            onClick = { showInviteDialog = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Indigo600
            )
        ) {
            Icon(
                Icons.Default.PersonAdd,
                contentDescription = "Invite",
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Invite User")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Role Filter Chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("all", "admin", "manager", "employee", "client").forEach { role ->
                FilterChip(
                    selected = selectedRoleFilter == role,
                    onClick = { selectedRoleFilter = role },
                    label = { Text(role.uppercase()) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Indigo600,
                        selectedLabelColor = androidx.compose.ui.graphics.Color.White
                    )
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        when (usersState) {
            is Resource.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Indigo600)
                }
            }
            is Resource.Success -> {
                val users = (usersState as Resource.Success<List<User>>).data ?: emptyList()
                val filteredUsers = if (selectedRoleFilter == "all") {
                    users
                } else {
                    users.filter { it.role == selectedRoleFilter }
                }
                
                if (filteredUsers.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.People,
                        message = "No users found"
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredUsers) { user ->
                            UserCard(
                                user = user,
                                onUpdateRole = { userId, newRole ->
                                    viewModel.updateUserRole(userId, newRole)
                                },
                                onDelete = { userId ->
                                    viewModel.deleteUser(userId)
                                }
                            )
                        }
                    }
                }
            }
            is Resource.Error -> {
                ErrorMessage(
                    message = (usersState as Resource.Error).message ?: "Failed to load users",
                    onRetry = { viewModel.loadUsers() }
                )
            }
        }
    }
    
    if (showInviteDialog) {
        InviteUserDialog(
            onDismiss = { showInviteDialog = false },
            onInvite = { email, name, role, orgId ->
                viewModel.inviteUser(email, name, role, orgId)
                showInviteDialog = false
            }
        )
    }
}

@Composable
fun UserCard(
    user: User,
    onUpdateRole: (Int, String) -> Unit,
    onDelete: (Int) -> Unit
) {
    var showRoleDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
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
            // Avatar
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = Indigo100,
                modifier = Modifier.size(56.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = "User",
                        tint = Indigo600,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // User Info
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = user.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = Gray900
                    )
                    
                    user.isOnline?.let { isOnline ->
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
                
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = Gray600
                )
                
                user.phone?.let { phone ->
                    Text(
                        text = phone,
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray600
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                UserRoleBadge(role = user.role)
            }
            
            // Actions
            Column(horizontalAlignment = Alignment.End) {
                IconButton(onClick = { showRoleDialog = true }) {
                    Icon(
                        Icons.Default.Edit,
                        contentDescription = "Edit Role",
                        tint = Indigo600
                    )
                }
                IconButton(onClick = { showDeleteDialog = true }) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Delete",
                        tint = Error
                    )
                }
            }
        }
    }
    
    if (showRoleDialog) {
        UpdateRoleDialog(
            currentRole = user.role,
            onDismiss = { showRoleDialog = false },
            onUpdate = { newRole ->
                onUpdateRole(user.id, newRole)
                showRoleDialog = false
            }
        )
    }
    
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete User") },
            text = { Text("Are you sure you want to delete ${user.name}?") },
            confirmButton = {
                Button(
                    onClick = {
                        onDelete(user.id)
                        showDeleteDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun UserRoleBadge(role: String) {
    val (bgColor, textColor, icon) = when (role.lowercase()) {
        "admin" -> Triple(Error.copy(alpha = 0.1f), Error, Icons.Default.Shield)
        "manager" -> Triple(Warning.copy(alpha = 0.1f), Warning, Icons.Default.AdminPanelSettings)
        "employee" -> Triple(Info.copy(alpha = 0.1f), Indigo600, Icons.Default.Work)
        "client" -> Triple(Success.copy(alpha = 0.1f), Success, Icons.Default.Person)
        else -> Triple(Gray200, Gray700, Icons.Default.Person)
    }
    
    Surface(
        shape = MaterialTheme.shapes.small,
        color = bgColor
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                contentDescription = role,
                modifier = Modifier.size(14.dp),
                tint = textColor
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = role.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = textColor
            )
        }
    }
}

@Composable
fun InviteUserDialog(
    onDismiss: () -> Unit,
    onInvite: (String, String, String, Int) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("employee") }
    var orgId by remember { mutableStateOf("1") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Invite User") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = orgId,
                    onValueChange = { orgId = it },
                    label = { Text("Organization ID") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Text(
                    text = "Role",
                    style = MaterialTheme.typography.labelMedium,
                    color = Gray700
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("admin", "manager", "employee", "client").forEach { r ->
                        FilterChip(
                            selected = role == r,
                            onClick = { role = r },
                            label = { Text(r.uppercase()) },
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
                    if (email.isNotBlank() && name.isNotBlank()) {
                        onInvite(email, name, role, orgId.toIntOrNull() ?: 1)
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600
                ),
                enabled = email.isNotBlank() && name.isNotBlank()
            ) {
                Text("Invite")
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
fun UpdateRoleDialog(
    currentRole: String,
    onDismiss: () -> Unit,
    onUpdate: (String) -> Unit
) {
    var selectedRole by remember { mutableStateOf(currentRole) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update User Role") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Select new role",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray700
                )
                
                listOf("admin", "manager", "employee", "client").forEach { role ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedRole == role,
                            onClick = { selectedRole = role },
                            colors = RadioButtonDefaults.colors(
                                selectedColor = Indigo600
                            )
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = role.uppercase(),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onUpdate(selectedRole) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600
                )
            ) {
                Text("Update")
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
