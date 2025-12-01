package com.tawasol.crm.data.local.dao

import androidx.room.*
import com.tawasol.crm.data.local.entity.DealEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DealDao {
    
    @Query("SELECT * FROM deals ORDER BY updatedAt DESC")
    fun getAllDeals(): Flow<List<DealEntity>>
    
    @Query("SELECT * FROM deals WHERE id = :dealId")
    fun getDealById(dealId: Int): Flow<DealEntity?>
    
    @Query("SELECT * FROM deals WHERE stageId = :stageId ORDER BY updatedAt DESC")
    fun getDealsByStage(stageId: Int): Flow<List<DealEntity>>
    
    @Query("SELECT * FROM deals WHERE organizationId = :orgId ORDER BY updatedAt DESC")
    fun getDealsByOrganization(orgId: Int): Flow<List<DealEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeal(deal: DealEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeals(deals: List<DealEntity>)
    
    @Update
    suspend fun updateDeal(deal: DealEntity)
    
    @Query("DELETE FROM deals WHERE id = :dealId")
    suspend fun deleteDeal(dealId: Int)
    
    @Query("DELETE FROM deals")
    suspend fun deleteAllDeals()
    
    @Query("DELETE FROM deals WHERE syncedAt < :timestamp")
    suspend fun deleteOldDeals(timestamp: Long)
}
