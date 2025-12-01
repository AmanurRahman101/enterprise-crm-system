package com.tawasol.crm.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.AuthResponse
import com.tawasol.crm.data.repository.AuthRepository
import com.tawasol.crm.util.Resource
import com.tawasol.crm.util.ValidationUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _signInState = MutableStateFlow<Resource<AuthResponse>?>(null)
    val signInState: StateFlow<Resource<AuthResponse>?> = _signInState.asStateFlow()
    
    private val _signUpState = MutableStateFlow<Resource<AuthResponse>?>(null)
    val signUpState: StateFlow<Resource<AuthResponse>?> = _signUpState.asStateFlow()
    
    // Validation state
    private val _emailError = MutableStateFlow<String?>(null)
    val emailError: StateFlow<String?> = _emailError.asStateFlow()
    
    private val _passwordError = MutableStateFlow<String?>(null)
    val passwordError: StateFlow<String?> = _passwordError.asStateFlow()
    
    private val _nameError = MutableStateFlow<String?>(null)
    val nameError: StateFlow<String?> = _nameError.asStateFlow()
    
    val isLoggedIn = authRepository.isLoggedIn()
    
    fun validateEmail(email: String): Boolean {
        _emailError.value = ValidationUtils.getEmailError(email)
        return _emailError.value == null
    }
    
    fun validatePassword(password: String): Boolean {
        _passwordError.value = ValidationUtils.getPasswordError(password)
        return _passwordError.value == null
    }
    
    fun validateName(name: String): Boolean {
        _nameError.value = ValidationUtils.getRequiredFieldError("Name", name)
        return _nameError.value == null
    }
    
    fun signIn(email: String, password: String) {
        // Validate inputs
        val isEmailValid = validateEmail(email)
        val isPasswordValid = validatePassword(password)
        
        if (!isEmailValid || !isPasswordValid) {
            return
        }
        
        viewModelScope.launch {
            authRepository.signIn(email, password).collect { resource ->
                _signInState.value = resource
            }
        }
    }
    
    fun signUp(email: String, password: String, fullName: String, organizationName: String?) {
        // Validate inputs
        val isEmailValid = validateEmail(email)
        val isPasswordValid = validatePassword(password)
        val isNameValid = validateName(fullName)
        
        if (!isEmailValid || !isPasswordValid || !isNameValid) {
            return
        }
        
        viewModelScope.launch {
            authRepository.signUp(email, password, fullName, organizationName).collect { resource ->
                _signUpState.value = resource
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
    
    fun resetSignInState() {
        _signInState.value = null
    }
    
    fun resetSignUpState() {
        _signUpState.value = null
    }
}
