package com.tawasol.crm.data.local.dao

import androidx.room.*
import com.tawasol.crm.data.local.entity.ContactEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ContactDao {
    
    @Query("SELECT * FROM contacts ORDER BY name ASC")
    fun getAllContacts(): Flow<List<ContactEntity>>
    
    @Query("SELECT * FROM contacts WHERE id = :contactId")
    fun getContactById(contactId: Int): Flow<ContactEntity?>
    
    @Query("SELECT * FROM contacts WHERE contactType = :type ORDER BY name ASC")
    fun getContactsByType(type: String): Flow<List<ContactEntity>>
    
    @Query("SELECT * FROM contacts WHERE organizationId = :orgId ORDER BY name ASC")
    fun getContactsByOrganization(orgId: Int): Flow<List<ContactEntity>>
    
    @Query("SELECT * FROM contacts WHERE isOnline = 1 ORDER BY name ASC")
    fun getOnlineContacts(): Flow<List<ContactEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertContact(contact: ContactEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertContacts(contacts: List<ContactEntity>)
    
    @Update
    suspend fun updateContact(contact: ContactEntity)
    
    @Query("DELETE FROM contacts WHERE id = :contactId")
    suspend fun deleteContact(contactId: Int)
    
    @Query("DELETE FROM contacts")
    suspend fun deleteAllContacts()
    
    @Query("UPDATE contacts SET isOnline = :isOnline WHERE id = :contactId")
    suspend fun updateContactOnlineStatus(contactId: Int, isOnline: Boolean)
}
