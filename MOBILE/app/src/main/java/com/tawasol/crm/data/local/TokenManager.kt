package com.tawasol.crm.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.tawasol.crm.data.model.User
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "tawasol_prefs")

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private val dataStore = context.dataStore
    
    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val USER_KEY = stringPreferencesKey("user_data")
        private val ORGANIZATION_ID_KEY = intPreferencesKey("organization_id")
        private val ORGANIZATION_ROLE_KEY = stringPreferencesKey("organization_role")
    }
    
    suspend fun saveToken(token: String) {
        dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }
    
    suspend fun getToken(): String? {
        return dataStore.data.map { preferences ->
            preferences[TOKEN_KEY]
        }.first()
    }
    
    suspend fun saveUser(user: User) {
        dataStore.edit { preferences ->
            preferences[USER_KEY] = gson.toJson(user)
        }
    }
    
    suspend fun getUser(): User? {
        return dataStore.data.map { preferences ->
            preferences[USER_KEY]?.let { json ->
                gson.fromJson(json, User::class.java)
            }
        }.first()
    }
    
    suspend fun saveOrganizationId(orgId: Int) {
        dataStore.edit { preferences ->
            preferences[ORGANIZATION_ID_KEY] = orgId
        }
    }
    
    suspend fun getOrganizationId(): Int? {
        return dataStore.data.map { preferences ->
            preferences[ORGANIZATION_ID_KEY]
        }.first()
    }
    
    suspend fun saveOrganizationRole(role: String) {
        dataStore.edit { preferences ->
            preferences[ORGANIZATION_ROLE_KEY] = role
        }
    }
    
    suspend fun getOrganizationRole(): String? {
        return dataStore.data.map { preferences ->
            preferences[ORGANIZATION_ROLE_KEY]
        }.first()
    }
    
    val isLoggedIn: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[TOKEN_KEY] != null
    }
    
    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
