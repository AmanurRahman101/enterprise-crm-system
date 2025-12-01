package com.tawasol.crm.data.repository

import com.tawasol.crm.data.model.*
import com.tawasol.crm.data.remote.ApiService
import com.tawasol.crm.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrganizationRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    fun getOrganizations(): Flow<Resource<List<Organization>>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.getOrganizations()
            
            if (response.isSuccessful && response.body()?.success == true) {
                val organizations = response.body()!!.organizations ?: emptyList()
                emit(Resource.Success(organizations))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch organizations"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun createOrganization(name: String, description: String?): Flow<Resource<Organization>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.createOrganization(
                CreateOrganizationRequest(name, description)
            )
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.organization?.let {
                    emit(Resource.Success(it))
                } ?: emit(Resource.Error("Organization created but data not returned"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to create organization"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
}
