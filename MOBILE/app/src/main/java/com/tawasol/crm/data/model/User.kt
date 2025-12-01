package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("role")
    val role: String, // admin, manager, employee, client
    
    @SerializedName("phone")
    val phone: String? = null,
    
    @SerializedName("avatar")
    val avatar: String? = null,
    
    @SerializedName("organization_id")
    val organizationId: Int? = null,
    
    @SerializedName("organization_name")
    val organizationName: String? = null,
    
    @SerializedName("is_online")
    val isOnline: Boolean? = null,
    
    @SerializedName("last_seen")
    val lastSeen: String? = null,
    
    @SerializedName("created_at")
    val createdAt: String? = null
)

data class InviteUserRequest(
    @SerializedName("email")
    val email: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("role")
    val role: String,
    
    @SerializedName("organization_id")
    val organizationId: Int
)

data class UpdateUserRoleRequest(
    @SerializedName("role")
    val role: String
)
