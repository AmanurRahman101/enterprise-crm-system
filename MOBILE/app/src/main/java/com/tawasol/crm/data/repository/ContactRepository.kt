package com.tawasol.crm.data.repository

import com.tawasol.crm.data.local.dao.ContactDao
import com.tawasol.crm.data.local.entity.toContact
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
class ContactRepository @Inject constructor(
    private val apiService: ApiService,
    private val contactDao: ContactDao
) {
    
    fun getContacts(): Flow<Resource<List<Contact>>> = flow {
        try {
            emit(Resource.Loading())
            
            // Try remote first
            try {
                val response = apiService.getContacts()
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val contacts = response.body()!!.contacts ?: emptyList()
                    
                    // Cache to Room
                    contactDao.insertContacts(contacts.map { it.toEntity() })
                    
                    emit(Resource.Success(contacts))
                } else {
                    // Fallback to cache
                    val cachedContacts = contactDao.getAllContacts().first().map { it.toContact() }
                    emit(Resource.Success(cachedContacts))
                }
            } catch (e: Exception) {
                // Network error - use cache
                val cachedContacts = contactDao.getAllContacts().first().map { it.toContact() }
                if (cachedContacts.isNotEmpty()) {
                    emit(Resource.Success(cachedContacts))
                } else {
                    emit(Resource.Error(e.localizedMessage ?: "No cached data available"))
                }
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
    
    // Get cached contacts as Flow for real-time updates
    fun getCachedContacts(): Flow<List<Contact>> {
        return contactDao.getAllContacts().map { entities ->
            entities.map { it.toContact() }
        }
    }
    
    suspend fun updateContactOnlineStatus(contactId: Int, isOnline: Boolean) {
        contactDao.updateContactOnlineStatus(contactId, isOnline)
    }
    
    fun getContact(id: Int): Flow<Resource<Contact>> = flow {
        try {
            emit(Resource.Loading())
            val response = apiService.getContact(id)
            
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()!!.data?.let {
                    emit(Resource.Success(it))
                } ?: emit(Resource.Error("Contact not found"))
            } else {
                emit(Resource.Error("Failed to fetch contact"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "An error occurred"))
        }
    }
}
