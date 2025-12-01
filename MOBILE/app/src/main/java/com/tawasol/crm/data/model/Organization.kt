package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class Organization(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("createdAt")
    val createdAt: String,
    
    @SerializedName("role")
    val role: String? = null // owner, admin, manager, agent, viewer
)

data class OrganizationResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("organizations")
    val organizations: List<Organization>? = null,
    
    @SerializedName("organization")
    val organization: Organization? = null,
    
    @SerializedName("message")
    val message: String? = null
)

data class CreateOrganizationRequest(
    @SerializedName("name")
    val name: String,
    
    @SerializedName("description")
    val description: String? = null
)

data class SwitchOrganizationRequest(
    @SerializedName("organizationId")
    val organizationId: Int
)

data class SwitchOrganizationResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("token")
    val token: String? = null,
    
    @SerializedName("message")
    val message: String? = null
)
