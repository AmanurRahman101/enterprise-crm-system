package com.tawasol.crm.data.repository

import com.tawasol.crm.data.local.TokenManager
import com.tawasol.crm.data.model.*
import com.tawasol.crm.data.remote.ApiService
import com.tawasol.crm.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    
    suspend fun signIn(email: String, password: String): Flow<Resource<AuthResponse>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.signIn(SignInRequest(email, password))
            
            if (response.isSuccessful && response.body()?.success == true) {
                val authResponse = response.body()!!
                authResponse.token?.let { tokenManager.saveToken(it) }
                authResponse.user?.let { tokenManager.saveUser(it) }
                emit(Resource.Success(authResponse))
            } else {
                val errorBody = response.errorBody()?.string()
                emit(Resource.Error(errorBody ?: "Sign in failed"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    suspend fun signUp(
        email: String,
        password: String,
        fullName: String,
        organizationName: String?
    ): Flow<Resource<AuthResponse>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.signUp(
                SignUpRequest(email, password, fullName, organizationName)
            )
            
            if (response.isSuccessful && response.body()?.success == true) {
                val authResponse = response.body()!!
                authResponse.token?.let { tokenManager.saveToken(it) }
                authResponse.user?.let { tokenManager.saveUser(it) }
                emit(Resource.Success(authResponse))
            } else {
                val errorBody = response.errorBody()?.string()
                emit(Resource.Error(errorBody ?: "Sign up failed"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    suspend fun verifyToken(): Flow<Resource<Boolean>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.verifyToken()
            
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(true))
            } else {
                await clearSession()
                emit(Resource.Success(false))
            }
        } catch (e: Exception) {
            await clearSession()
            emit(Resource.Success(false))
        }
    }
    
    suspend fun logout() {
        clearSession()
    }
    
    private suspend fun clearSession() {
        tokenManager.clearAll()
    }
    
    fun isLoggedIn(): Flow<Boolean> = tokenManager.isLoggedIn
    
    suspend fun getUser(): User? = tokenManager.getUser()
    
    suspend fun switchOrganization(organizationId: Int): Flow<Resource<SwitchOrganizationResponse>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.switchOrganization(
                SwitchOrganizationRequest(organizationId)
            )
            
            if (response.isSuccessful && response.body()?.success == true) {
                val switchResponse = response.body()!!
                switchResponse.token?.let { tokenManager.saveToken(it) }
                tokenManager.saveOrganizationId(organizationId)
                emit(Resource.Success(switchResponse))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to switch organization"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
}
