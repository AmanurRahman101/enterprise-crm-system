package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class ApiError(
    @SerializedName("success")
    val success: Boolean = false,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("error")
    val error: String? = null,
    
    @SerializedName("errors")
    val errors: Map<String, String>? = null
)

data class ApiResponse<T>(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("data")
    val data: T? = null,
    
    @SerializedName("message")
    val message: String? = null
)
