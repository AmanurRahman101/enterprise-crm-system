package com.tawasol.crm.data.repository

import com.tawasol.crm.data.local.dao.DealDao
import com.tawasol.crm.data.local.entity.toDeal
import com.tawasol.crm.data.local.entity.toEntity
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
class DealRepository @Inject constructor(
    private val apiService: ApiService,
    private val dealDao: DealDao
) {
    
    fun getDeals(): Flow<Resource<List<Deal>>> = flow {
        try {
            emit(Resource.Loading())
            
            // Try remote first
            try {
                val response = apiService.getDeals()
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val deals = response.body()!!.deals ?: emptyList()
                    
                    // Cache to Room
                    dealDao.insertDeals(deals.map { it.toEntity() })
                    
                    emit(Resource.Success(deals))
                } else {
                    // Fallback to cache
                    val cachedDeals = dealDao.getAllDeals().first().map { it.toDeal() }
                    emit(Resource.Success(cachedDeals))
                }
            } catch (e: Exception) {
                // Network error - use cache
                val cachedDeals = dealDao.getAllDeals().first().map { it.toDeal() }
                if (cachedDeals.isNotEmpty()) {
                    emit(Resource.Success(cachedDeals))
                } else {
                    emit(Resource.Error(e.localizedMessage ?: "No cached data available"))
                }
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    // Get cached deals as Flow for real-time updates
    fun getCachedDeals(): Flow<List<Deal>> {
        return dealDao.getAllDeals().map { entities ->
            entities.map { it.toDeal() }
        }
    }
    
    fun getDealStages(): Flow<Resource<List<DealStage>>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.getDealStages()
            
            if (response.isSuccessful && response.body()?.success == true) {
                val stages = response.body()!!.stages ?: emptyList()
                emit(Resource.Success(stages))
            } else {
                emit(Resource.Error("Failed to fetch deal stages"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun createDeal(request: CreateDealRequest): Flow<Resource<Deal>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.createDeal(request)
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.data?.let { deal ->
                    // Cache the new deal
                    dealDao.insertDeal(deal.toEntity())
                    emit(Resource.Success(deal))
                } ?: emit(Resource.Error("Deal created but data not returned"))
            } else {
                emit(Resource.Error("Failed to create deal"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun updateDeal(id: Int, request: CreateDealRequest): Flow<Resource<Deal>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.updateDeal(id, request)
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.data?.let { deal ->
                    // Update cache
                    dealDao.updateDeal(deal.toEntity())
                    emit(Resource.Success(deal))
                } ?: emit(Resource.Error("Deal updated but data not returned"))
            } else {
                emit(Resource.Error("Failed to update deal"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun deleteDeal(id: Int): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.deleteDeal(id)
            
            if (response.isSuccessful && response.body()?.success == true) {
                // Remove from cache
                dealDao.deleteDeal(id)
                emit(Resource.Success(Unit))
            } else {
                emit(Resource.Error("Failed to delete deal"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    fun getClientDeals(): Flow<Resource<List<Deal>>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.getClientDeals()
            
            if (response.isSuccessful && response.body()?.success == true) {
                val deals = response.body()!!.deals ?: emptyList()
                emit(Resource.Success(deals))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch client deals"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
}
