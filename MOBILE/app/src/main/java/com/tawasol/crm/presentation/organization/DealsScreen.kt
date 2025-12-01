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
import com.tawasol.crm.data.model.Deal
import com.tawasol.crm.data.model.DealStage
import com.tawasol.crm.presentation.components.SearchBar
import com.tawasol.crm.presentation.components.FilterChip
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@Composable
fun DealsScreen(
    viewModel: DealsViewModel = hiltViewModel()
) {
    val dealsState by viewModel.dealsState.collectAsState()
    val stagesState by viewModel.stagesState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedStageFilter by viewModel.selectedStageFilter.collectAsState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Deals Pipeline",
            style = MaterialTheme.typography.headlineLarge,
            color = Indigo600,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Search Bar
        SearchBar(
            query = searchQuery,
            onQueryChange = { viewModel.setSearchQuery(it) },
            placeholder = "Search deals..."
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Stage Filter Chips
        if (stagesState is Resource.Success) {
            val stages = (stagesState as Resource.Success<List<DealStage>>).data ?: emptyList()
            
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        label = "All Stages",
                        selected = selectedStageFilter == null,
                        onClick = { viewModel.setStageFilter(null) }
                    )
                }
                
                items(stages) { stage ->
                    FilterChip(
                        label = stage.name,
                        selected = selectedStageFilter == stage.id,
                        onClick = {
                            if (selectedStageFilter == stage.id) {
                                viewModel.setStageFilter(null)
                            } else {
                                viewModel.setStageFilter(stage.id)
                            }
                        }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
        }
        
        when (stagesState) {
            is Resource.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Indigo600)
                }
            }
            is Resource.Success -> {
                val stages = (stagesState as Resource.Success<List<DealStage>>).data ?: emptyList()
                
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(stages) { stage ->
                        val stageDeals = viewModel.getDealsByStage(stage.id)
                        // Only show stage if it has deals or no filter is applied
                        if (stageDeals.isNotEmpty() || selectedStageFilter == null) {
                            DealStageCard(
                                stage = stage,
                                deals = stageDeals
                            )
                        }
                    }
                }
            }
            is Resource.Error -> {
                ErrorMessage(
                    message = (stagesState as Resource.Error).message ?: "Failed to load stages",
                    onRetry = { viewModel.loadStages() }
                )
            }
        }
    }
}

@Composable
fun DealStageCard(
    stage: DealStage,
    deals: List<Deal>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Gray50
        )
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
                    text = stage.name,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = Indigo600
                )
                
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = Indigo100
                ) {
                    Text(
                        text = "${deals.size}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = Indigo600
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            if (deals.isEmpty()) {
                Text(
                    text = "No deals in this stage",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray500
                )
            } else {
                deals.forEach { deal ->
                    DealItem(deal)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun DealItem(deal: Deal) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = androidx.compose.ui.graphics.Color.White
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = deal.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = Gray900
            )
            
            deal.value?.let { value ->
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "$${"%.2f".format(value)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Success,
                    fontWeight = FontWeight.Bold
                )
            }
            
            deal.assignedUserName?.let { assignedUser ->
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = "Assigned to",
                        modifier = Modifier.size(16.dp),
                        tint = Gray600
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = assignedUser,
                        style = MaterialTheme.typography.bodySmall,
                        color = Gray600
                    )
                }
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
