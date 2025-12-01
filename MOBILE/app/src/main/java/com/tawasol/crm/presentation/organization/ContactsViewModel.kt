package com.tawasol.crm.presentation.organization

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.Contact
import com.tawasol.crm.data.repository.ContactRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ContactsViewModel @Inject constructor(
    private val contactRepository: ContactRepository
) : ViewModel() {
    
    private val _contactsState = MutableStateFlow<Resource<List<Contact>>>(Resource.Loading())
    val contactsState: StateFlow<Resource<List<Contact>>> = _contactsState.asStateFlow()
    
    // Search and filter states
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    private val _selectedTypeFilter = MutableStateFlow<String?>(null)
    val selectedTypeFilter: StateFlow<String?> = _selectedTypeFilter.asStateFlow()
    
    private val _showOnlineOnly = MutableStateFlow(false)
    val showOnlineOnly: StateFlow<Boolean> = _showOnlineOnly.asStateFlow()
    
    // Filtered contacts based on search and filters
    val filteredContacts: StateFlow<List<Contact>> = combine(
        _contactsState,
        _searchQuery,
        _selectedTypeFilter,
        _showOnlineOnly
    ) { contactsResource, query, typeFilter, onlineOnly ->
        when (contactsResource) {
            is Resource.Success -> {
                var contacts = contactsResource.data ?: emptyList()
                
                // Apply search filter
                if (query.isNotBlank()) {
                    contacts = contacts.filter { contact ->
                        contact.name.contains(query, ignoreCase = true) ||
                        contact.email?.contains(query, ignoreCase = true) == true ||
                        contact.phone?.contains(query, ignoreCase = true) == true
                    }
                }
                
                // Apply type filter
                if (typeFilter != null) {
                    contacts = contacts.filter { it.contactType.equals(typeFilter, ignoreCase = true) }
                }
                
                // Apply online filter
                if (onlineOnly) {
                    contacts = contacts.filter { it.isOnline == true }
                }
                
                contacts
            }
            else -> emptyList()
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )
    
    init {
        loadContacts()
    }
    
    fun loadContacts() {
        viewModelScope.launch {
            contactRepository.getContacts().collect { resource ->
                _contactsState.value = resource
            }
        }
    }
    
    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }
    
    fun setTypeFilter(type: String?) {
        _selectedTypeFilter.value = type
    }
    
    fun setShowOnlineOnly(onlineOnly: Boolean) {
        _showOnlineOnly.value = onlineOnly
    }
}
