package com.tawasol.crm.data.local.dao

import androidx.room.*
import com.tawasol.crm.data.local.entity.IssueEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface IssueDao {
    
    @Query("SELECT * FROM issues ORDER BY createdAt DESC")
    fun getAllIssues(): Flow<List<IssueEntity>>
    
    @Query("SELECT * FROM issues WHERE id = :issueId")
    fun getIssueById(issueId: Int): Flow<IssueEntity?>
    
    @Query("SELECT * FROM issues WHERE status = :status ORDER BY createdAt DESC")
    fun getIssuesByStatus(status: String): Flow<List<IssueEntity>>
    
    @Query("SELECT * FROM issues WHERE priority = :priority ORDER BY createdAt DESC")
    fun getIssuesByPriority(priority: String): Flow<List<IssueEntity>>
    
    @Query("SELECT * FROM issues WHERE organizationId = :orgId ORDER BY createdAt DESC")
    fun getIssuesByOrganization(orgId: Int): Flow<List<IssueEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIssue(issue: IssueEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIssues(issues: List<IssueEntity>)
    
    @Update
    suspend fun updateIssue(issue: IssueEntity)
    
    @Query("DELETE FROM issues WHERE id = :issueId")
    suspend fun deleteIssue(issueId: Int)
    
    @Query("DELETE FROM issues")
    suspend fun deleteAllIssues()
    
    @Query("DELETE FROM issues WHERE syncedAt < :timestamp")
    suspend fun deleteOldIssues(timestamp: Long)
}
