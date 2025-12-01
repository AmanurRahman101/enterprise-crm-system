package com.tawasol.crm.presentation.organization

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.Issue
import com.tawasol.crm.data.repository.IssueRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IssuesViewModel @Inject constructor(
    private val issueRepository: IssueRepository
) : ViewModel() {
    
    private val _issuesState = MutableStateFlow<Resource<List<Issue>>>(Resource.Loading())
    val issuesState: StateFlow<Resource<List<Issue>>> = _issuesState.asStateFlow()
    
    // Search and filter states
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    private val _selectedStatusFilter = MutableStateFlow<String?>(null)
    val selectedStatusFilter: StateFlow<String?> = _selectedStatusFilter.asStateFlow()
    
    private val _selectedPriorityFilter = MutableStateFlow<String?>(null)
    val selectedPriorityFilter: StateFlow<String?> = _selectedPriorityFilter.asStateFlow()
    
    // Filtered issues based on search and filters
    val filteredIssues: StateFlow<List<Issue>> = combine(
        _issuesState,
        _searchQuery,
        _selectedStatusFilter,
        _selectedPriorityFilter
    ) { issuesResource, query, statusFilter, priorityFilter ->
        when (issuesResource) {
            is Resource.Success -> {
                var issues = issuesResource.data ?: emptyList()
                
                // Apply search filter
                if (query.isNotBlank()) {
                    issues = issues.filter { issue ->
                        issue.title.contains(query, ignoreCase = true) ||
                        issue.description.contains(query, ignoreCase = true) ||
                        issue.jiraTicketId?.contains(query, ignoreCase = true) == true
                    }
                }
                
                // Apply status filter
                if (statusFilter != null) {
                    issues = issues.filter { it.status.equals(statusFilter, ignoreCase = true) }
                }
                
                // Apply priority filter
                if (priorityFilter != null) {
                    issues = issues.filter { it.priority.equals(priorityFilter, ignoreCase = true) }
                }
                
                issues
            }
            else -> emptyList()
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )
    
    init {
        loadIssues()
    }
    
    fun loadIssues() {
        viewModelScope.launch {
            issueRepository.getIssues().collect { resource ->
                _issuesState.value = resource
            }
        }
    }
    
    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }
    
    fun setStatusFilter(status: String?) {
        _selectedStatusFilter.value = status
    }
    
    fun setPriorityFilter(priority: String?) {
        _selectedPriorityFilter.value = priority
    }
}
