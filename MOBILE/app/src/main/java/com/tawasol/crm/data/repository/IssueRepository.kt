package com.tawasol.crm.data.repository

import com.tawasol.crm.data.local.dao.IssueDao
import com.tawasol.crm.data.local.entity.toEntity
import com.tawasol.crm.data.local.entity.toIssue
import com.tawasol.crm.data.model.*
import com.tawasol.crm.data.remote.ApiService
import com.tawasol.crm.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class IssueRepository @Inject constructor(
    private val apiService: ApiService,
    private val issueDao: IssueDao
) {
    
    fun getIssues(): Flow<Resource<List<Issue>>> = flow {
        try {
            emit(Resource.Loading())
            
            // Try remote first
            try {
                val response = apiService.getIssues()
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val issues = response.body()!!.issues ?: emptyList()
                    
                    // Cache to Room
                    issueDao.insertIssues(issues.map { it.toEntity() })
                    
                    emit(Resource.Success(issues))
                } else {
                    // Fallback to cache
                    val cachedIssues = issueDao.getAllIssues().first().map { it.toIssue() }
                    emit(Resource.Success(cachedIssues))
                }
            } catch (e: Exception) {
                // Network error - use cache
                val cachedIssues = issueDao.getAllIssues().first().map { it.toIssue() }
                if (cachedIssues.isNotEmpty()) {
                    emit(Resource.Success(cachedIssues))
                } else {
                    emit(Resource.Error(e.localizedMessage ?: "No cached data available"))
                }
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    // Get cached issues as Flow for real-time updates
    fun getCachedIssues(): Flow<List<Issue>> {
        return issueDao.getAllIssues().map { entities ->
            entities.map { it.toIssue() }
        }
    }
    
    fun getClientIssues(): Flow<Resource<List<Issue>>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.getClientIssues()
            
            if (response.isSuccessful && response.body()?.success == true) {
                val issues = response.body()!!.issues ?: emptyList()
                emit(Resource.Success(issues))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch client issues"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun createIssue(request: CreateIssueRequest): Flow<Resource<Issue>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.createIssue(request)
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.data?.let { issue ->
                    // Cache the new issue
                    issueDao.insertIssue(issue.toEntity())
                    emit(Resource.Success(issue))
                } ?: emit(Resource.Error("Issue created but data not returned"))
            } else {
                emit(Resource.Error("Failed to create issue"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun createClientIssue(request: CreateIssueRequest): Flow<Resource<Issue>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.createClientIssue(request)
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.data?.let {
                    emit(Resource.Success(it))
                } ?: emit(Resource.Error("Issue created but data not returned"))
            } else {
                emit(Resource.Error("Failed to create issue"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun updateIssue(id: Int, request: CreateIssueRequest): Flow<Resource<Issue>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.updateIssue(id, request)
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.data?.let { issue ->
                    // Update cache
                    issueDao.updateIssue(issue.toEntity())
                    emit(Resource.Success(issue))
                } ?: emit(Resource.Error("Issue updated but data not returned"))
            } else {
                emit(Resource.Error("Failed to update issue"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun deleteIssue(id: Int): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.deleteIssue(id)
            
            if (response.isSuccessful && response.body()?.success == true) {
                // Remove from cache
                issueDao.deleteIssue(id)
                emit(Resource.Success(Unit))
            } else {
                emit(Resource.Error("Failed to delete issue"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
}
