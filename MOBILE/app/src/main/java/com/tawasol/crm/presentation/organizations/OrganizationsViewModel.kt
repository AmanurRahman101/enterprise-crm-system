package com.tawasol.crm.presentation.organizations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.CreateOrganizationRequest
import com.tawasol.crm.data.model.Organization
import com.tawasol.crm.data.repository.OrganizationRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrganizationsViewModel @Inject constructor(
    private val organizationRepository: OrganizationRepository
) : ViewModel() {
    
    private val _organizationsState = MutableStateFlow<Resource<List<Organization>>>(Resource.Loading())
    val organizationsState: StateFlow<Resource<List<Organization>>> = _organizationsState.asStateFlow()
    
    private val _createOrgState = MutableStateFlow<Resource<Organization>?>(null)
    val createOrgState: StateFlow<Resource<Organization>?> = _createOrgState.asStateFlow()
    
    init {
        loadOrganizations()
    }
    
    fun loadOrganizations() {
        viewModelScope.launch {
            organizationRepository.getOrganizations().collect { resource ->
                _organizationsState.value = resource
            }
        }
    }
    
    fun createOrganization(name: String, description: String) {
        viewModelScope.launch {
            val request = CreateOrganizationRequest(name, description)
            organizationRepository.createOrganization(request).collect { resource ->
                _createOrgState.value = resource
                if (resource is Resource.Success) {
                    loadOrganizations() // Refresh list
                }
            }
        }
    }
    
    fun clearCreateState() {
        _createOrgState.value = null
    }
}
