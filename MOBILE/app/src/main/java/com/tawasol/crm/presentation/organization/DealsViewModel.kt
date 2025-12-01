package com.tawasol.crm.presentation.organization

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.Deal
import com.tawasol.crm.data.model.DealStage
import com.tawasol.crm.data.repository.DealRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DealsViewModel @Inject constructor(
    private val dealRepository: DealRepository
) : ViewModel() {
    
    private val _dealsState = MutableStateFlow<Resource<List<Deal>>>(Resource.Loading())
    val dealsState: StateFlow<Resource<List<Deal>>> = _dealsState.asStateFlow()
    
    private val _stagesState = MutableStateFlow<Resource<List<DealStage>>>(Resource.Loading())
    val stagesState: StateFlow<Resource<List<DealStage>>> = _stagesState.asStateFlow()
    
    // Search and filter states
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    private val _selectedStageFilter = MutableStateFlow<Int?>(null)
    val selectedStageFilter: StateFlow<Int?> = _selectedStageFilter.asStateFlow()
    
    // Filtered deals based on search and filters
    val filteredDeals: StateFlow<List<Deal>> = combine(
        _dealsState,
        _searchQuery,
        _selectedStageFilter
    ) { dealsResource, query, stageFilter ->
        when (dealsResource) {
            is Resource.Success -> {
                var deals = dealsResource.data ?: emptyList()
                
                // Apply search filter
                if (query.isNotBlank()) {
                    deals = deals.filter { deal ->
                        deal.title.contains(query, ignoreCase = true) ||
                        deal.description?.contains(query, ignoreCase = true) == true ||
                        deal.assignedUserName?.contains(query, ignoreCase = true) == true ||
                        deal.clientName?.contains(query, ignoreCase = true) == true
                    }
                }
                
                // Apply stage filter
                if (stageFilter != null) {
                    deals = deals.filter { it.stageId == stageFilter }
                }
                
                deals
            }
            else -> emptyList()
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )
    
    init {
        loadDeals()
        loadStages()
    }
    
    fun loadDeals() {
        viewModelScope.launch {
            dealRepository.getDeals().collect { resource ->
                _dealsState.value = resource
            }
        }
    }
    
    fun loadStages() {
        viewModelScope.launch {
            dealRepository.getDealStages().collect { resource ->
                _stagesState.value = resource
            }
        }
    }
    
    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }
    
    fun setStageFilter(stageId: Int?) {
        _selectedStageFilter.value = stageId
    }
    
    fun getDealsByStage(stageId: Int): List<Deal> {
        return filteredDeals.value.filter { it.stageId == stageId }
    }
}
