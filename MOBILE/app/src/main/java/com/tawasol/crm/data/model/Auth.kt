package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("fullName")
    val fullName: String? = null,
    
    @SerializedName("userType")
    val userType: String? = null,
    
    @SerializedName("createdAt")
    val createdAt: String? = null
)

data class AuthResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String? = null,
    
    @SerializedName("token")
    val token: String? = null,
    
    @SerializedName("user")
    val user: User? = null
)

data class SignInRequest(
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password")
    val password: String
)

data class SignUpRequest(
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password")
    val password: String,
    
    @SerializedName("fullName")
    val fullName: String,
    
    @SerializedName("organizationName")
    val organizationName: String? = null
)
