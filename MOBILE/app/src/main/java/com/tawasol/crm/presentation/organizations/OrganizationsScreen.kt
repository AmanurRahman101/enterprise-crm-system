package com.tawasol.crm.presentation.organizations

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
import com.tawasol.crm.data.local.TokenManager
import com.tawasol.crm.data.model.Organization
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrganizationsScreen(
    viewModel: OrganizationsViewModel = hiltViewModel(),
    tokenManager: TokenManager,
    onOrganizationSelected: (Int) -> Unit = {}
) {
    val organizationsState by viewModel.organizationsState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var currentOrgId by remember { mutableStateOf<Int?>(null) }
    
    val scope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        currentOrgId = tokenManager.getOrganizationId().first()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Organizations") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Indigo600,
                    titleContentColor = androidx.compose.ui.graphics.Color.White
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = Indigo600
            ) {
                Icon(
                    Icons.Default.Add,
                    contentDescription = "Create Organization",
                    tint = androidx.compose.ui.graphics.Color.White
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text(
                text = "Select an organization to switch",
                style = MaterialTheme.typography.bodyMedium,
                color = Gray600
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            when (organizationsState) {
                is Resource.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = Indigo600)
                    }
                }
                is Resource.Success -> {
                    val organizations = (organizationsState as Resource.Success<List<Organization>>).data ?: emptyList()
                    
                    if (organizations.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.Business,
                            message = "No organizations yet",
                            action = "Create Organization",
                            onAction = { showCreateDialog = true }
                        )
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(organizations) { org ->
                                OrganizationCard(
                                    organization = org,
                                    isSelected = org.id == currentOrgId,
                                    onSelect = {
                                        scope.launch {
                                            tokenManager.saveOrganizationId(org.id)
                                            currentOrgId = org.id
                                            onOrganizationSelected(org.id)
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
                is Resource.Error -> {
                    ErrorMessage(
                        message = (organizationsState as Resource.Error).message ?: "Failed to load organizations",
                        onRetry = { viewModel.loadOrganizations() }
                    )
                }
            }
        }
    }
    
    if (showCreateDialog) {
        CreateOrganizationDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { name, description ->
                viewModel.createOrganization(name, description)
                showCreateDialog = false
            }
        )
    }
}

@Composable
fun OrganizationCard(
    organization: Organization,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) Indigo100 else androidx.compose.ui.graphics.Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        onClick = onSelect
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = if (isSelected) Indigo600 else Indigo100,
                modifier = Modifier.size(56.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Business,
                        contentDescription = "Organization",
                        tint = if (isSelected) androidx.compose.ui.graphics.Color.White else Indigo600,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = organization.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isSelected) Indigo600 else Gray900
                )
                
                organization.description?.let { desc ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = desc,
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray600
                    )
                }
            }
            
            if (isSelected) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = "Selected",
                    tint = Indigo600,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

@Composable
fun CreateOrganizationDialog(
    onDismiss: () -> Unit,
    onCreate: (String, String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Organization") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Organization Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { 
                    if (name.isNotBlank()) {
                        onCreate(name, description)
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600
                ),
                enabled = name.isNotBlank()
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
fun EmptyState(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    message: String,
    action: String? = null,
    onAction: (() -> Unit)? = null
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
        
        if (action != null && onAction != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onAction,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600
                )
            ) {
                Text(action)
            }
        }
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
