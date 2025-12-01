package com.tawasol.crm.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.auth.TokenManager
import com.tawasol.crm.data.model.User
import com.tawasol.crm.data.repository.UserRepository
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val tokenManager: TokenManager
) : ViewModel() {
    
    private val _userState = MutableStateFlow<Resource<User>>(Resource.Loading())
    val userState: StateFlow<Resource<User>> = _userState.asStateFlow()
    
    private val _updateState = MutableStateFlow<Resource<User>?>(null)
    val updateState: StateFlow<Resource<User>?> = _updateState.asStateFlow()
    
    init {
        loadCurrentUser()
    }
    
    private fun loadCurrentUser() {
        viewModelScope.launch {
            val userId = tokenManager.userId.first()
            if (userId != null) {
                userRepository.getUser(userId).collect { resource ->
                    _userState.value = resource
                }
            } else {
                _userState.value = Resource.Error("User not found")
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            tokenManager.clearTokens()
        }
    }
}
