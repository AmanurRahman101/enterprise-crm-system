package com.tawasol.crm.data.local.dao

import androidx.room.*
import com.tawasol.crm.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    
    @Query("SELECT * FROM users ORDER BY name ASC")
    fun getAllUsers(): Flow<List<UserEntity>>
    
    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserById(userId: Int): Flow<UserEntity?>
    
    @Query("SELECT * FROM users WHERE role = :role ORDER BY name ASC")
    fun getUsersByRole(role: String): Flow<List<UserEntity>>
    
    @Query("SELECT * FROM users WHERE organizationId = :orgId ORDER BY name ASC")
    fun getUsersByOrganization(orgId: Int): Flow<List<UserEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<UserEntity>)
    
    @Update
    suspend fun updateUser(user: UserEntity)
    
    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteUser(userId: Int)
    
    @Query("DELETE FROM users")
    suspend fun deleteAllUsers()
    
    @Query("UPDATE users SET isOnline = :isOnline WHERE id = :userId")
    suspend fun updateUserOnlineStatus(userId: Int, isOnline: Boolean)
}
