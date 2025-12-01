package com.tawasol.crm.data.repository

import com.tawasol.crm.data.local.dao.UserDao
import com.tawasol.crm.data.local.entity.toEntity
import com.tawasol.crm.data.local.entity.toUser
import com.tawasol.crm.data.model.InviteUserRequest
import com.tawasol.crm.data.model.UpdateUserRoleRequest
import com.tawasol.crm.data.model.User
import com.tawasol.crm.data.remote.ApiService
import com.tawasol.crm.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val apiService: ApiService,
    private val userDao: UserDao
) {
    fun getUsers(): Flow<Resource<List<User>>> = flow {
        emit(Resource.Loading())
        try {
            // Try remote first
            try {
                val response = apiService.getUsers()
                if (response.success) {
                    // Cache to Room
                    userDao.insertUsers(response.data.map { it.toEntity() })
                    emit(Resource.Success(response.data))
                } else {
                    // Fallback to cache
                    val cachedUsers = userDao.getAllUsers().first().map { it.toUser() }
                    emit(Resource.Success(cachedUsers))
                }
            } catch (e: Exception) {
                // Network error - use cache
                val cachedUsers = userDao.getAllUsers().first().map { it.toUser() }
                if (cachedUsers.isNotEmpty()) {
                    emit(Resource.Success(cachedUsers))
                } else {
                    emit(Resource.Error(e.localizedMessage ?: "No cached data available"))
                }
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to load users"))
        }
    }
    
    // Get cached users as Flow for real-time updates
    fun getCachedUsers(): Flow<List<User>> {
        return userDao.getAllUsers().map { entities ->
            entities.map { it.toUser() }
        }
    }
    
    suspend fun updateUserOnlineStatus(userId: Int, isOnline: Boolean) {
        userDao.updateUserOnlineStatus(userId, isOnline)
    }
    
    fun getUser(userId: Int): Flow<Resource<User>> = flow {
        emit(Resource.Loading())
        try {
            val response = apiService.getUser(userId)
            if (response.success) {
                emit(Resource.Success(response.data))
            } else {
                emit(Resource.Error(response.message ?: "Failed to load user"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to load user"))
        }
    }
    
    fun inviteUser(request: InviteUserRequest): Flow<Resource<User>> = flow {
        emit(Resource.Loading())
        try {
            val response = apiService.inviteUser(request)
            if (response.success) {
                // Cache the new user
                userDao.insertUser(response.data.toEntity())
                emit(Resource.Success(response.data))
            } else {
                emit(Resource.Error(response.message ?: "Failed to invite user"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to invite user"))
        }
    }
    
    fun updateUserRole(userId: Int, request: UpdateUserRoleRequest): Flow<Resource<User>> = flow {
        emit(Resource.Loading())
        try {
            val response = apiService.updateUserRole(userId, request)
            if (response.success) {
                // Update cache
                userDao.updateUser(response.data.toEntity())
                emit(Resource.Success(response.data))
            } else {
                emit(Resource.Error(response.message ?: "Failed to update user role"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to update user role"))
        }
    }
    
    fun deleteUser(userId: Int): Flow<Resource<Unit>> = flow {
        emit(Resource.Loading())
        try {
            val response = apiService.deleteUser(userId)
            if (response.success) {
                // Remove from cache
                userDao.deleteUser(userId)
                emit(Resource.Success(Unit))
            } else {
                emit(Resource.Error(response.message ?: "Failed to delete user"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to delete user"))
        }
    }
}
