package com.tawasol.crm.presentation.users

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.InviteUserRequest
import com.tawasol.crm.data.model.UpdateUserRoleRequest
import com.tawasol.crm.data.model.User
import com.tawasol.crm.data.repository.UserRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UsersViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _usersState = MutableStateFlow<Resource<List<User>>>(Resource.Loading())
    val usersState: StateFlow<Resource<List<User>>> = _usersState.asStateFlow()
    
    private val _inviteUserState = MutableStateFlow<Resource<User>?>(null)
    val inviteUserState: StateFlow<Resource<User>?> = _inviteUserState.asStateFlow()
    
    private val _updateRoleState = MutableStateFlow<Resource<User>?>(null)
    val updateRoleState: StateFlow<Resource<User>?> = _updateRoleState.asStateFlow()
    
    private val _deleteUserState = MutableStateFlow<Resource<Unit>?>(null)
    val deleteUserState: StateFlow<Resource<Unit>?> = _deleteUserState.asStateFlow()
    
    init {
        loadUsers()
    }
    
    fun loadUsers() {
        viewModelScope.launch {
            userRepository.getUsers().collect { resource ->
                _usersState.value = resource
            }
        }
    }
    
    fun inviteUser(email: String, name: String, role: String, organizationId: Int) {
        viewModelScope.launch {
            val request = InviteUserRequest(email, name, role, organizationId)
            userRepository.inviteUser(request).collect { resource ->
                _inviteUserState.value = resource
                if (resource is Resource.Success) {
                    loadUsers() // Refresh list
                }
            }
        }
    }
    
    fun updateUserRole(userId: Int, role: String) {
        viewModelScope.launch {
            val request = UpdateUserRoleRequest(role)
            userRepository.updateUserRole(userId, request).collect { resource ->
                _updateRoleState.value = resource
                if (resource is Resource.Success) {
                    loadUsers() // Refresh list
                }
            }
        }
    }
    
    fun deleteUser(userId: Int) {
        viewModelScope.launch {
            userRepository.deleteUser(userId).collect { resource ->
                _deleteUserState.value = resource
                if (resource is Resource.Success) {
                    loadUsers() // Refresh list
                }
            }
        }
    }
    
    fun clearInviteState() {
        _inviteUserState.value = null
    }
    
    fun clearUpdateRoleState() {
        _updateRoleState.value = null
    }
    
    fun clearDeleteState() {
        _deleteUserState.value = null
    }
    
    fun getUsersByRole(role: String): List<User> {
        return when (val state = _usersState.value) {
            is Resource.Success -> state.data?.filter { it.role == role } ?: emptyList()
            else -> emptyList()
        }
    }
}
