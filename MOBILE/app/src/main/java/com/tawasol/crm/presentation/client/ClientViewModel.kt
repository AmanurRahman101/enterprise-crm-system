package com.tawasol.crm.presentation.client

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.Deal
import com.tawasol.crm.data.model.Issue
import com.tawasol.crm.data.repository.DealRepository
import com.tawasol.crm.data.repository.IssueRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientViewModel @Inject constructor(
    private val dealRepository: DealRepository,
    private val issueRepository: IssueRepository
) : ViewModel() {
    
    private val _dealsState = MutableStateFlow<Resource<List<Deal>>>(Resource.Loading())
    val dealsState: StateFlow<Resource<List<Deal>>> = _dealsState.asStateFlow()
    
    private val _issuesState = MutableStateFlow<Resource<List<Issue>>>(Resource.Loading())
    val issuesState: StateFlow<Resource<List<Issue>>> = _issuesState.asStateFlow()
    
    init {
        loadClientDeals()
        loadClientIssues()
    }
    
    fun loadClientDeals() {
        viewModelScope.launch {
            dealRepository.getClientDeals().collect { resource ->
                _dealsState.value = resource
            }
        }
    }
    
    fun loadClientIssues() {
        viewModelScope.launch {
            issueRepository.getClientIssues().collect { resource ->
                _issuesState.value = resource
            }
        }
    }
}
