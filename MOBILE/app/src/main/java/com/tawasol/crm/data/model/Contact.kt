package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class Contact(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("email")
    val email: String? = null,
    
    @SerializedName("phone")
    val phone: String? = null,
    
    @SerializedName("contact_type")
    val contactType: String, // person, organization
    
    @SerializedName("company")
    val company: String? = null,
    
    @SerializedName("position")
    val position: String? = null,
    
    @SerializedName("linked_user_id")
    val linkedUserId: Int? = null,
    
    @SerializedName("is_online")
    val isOnline: Boolean? = null,
    
    @SerializedName("created_at")
    val createdAt: String
)

data class ContactsResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("contacts")
    val contacts: List<Contact>? = null,
    
    @SerializedName("message")
    val message: String? = null
)
