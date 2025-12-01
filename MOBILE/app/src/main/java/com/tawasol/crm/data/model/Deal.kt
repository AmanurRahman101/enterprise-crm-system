package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class Deal(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("value")
    val value: Double? = null,
    
    @SerializedName("stage_id")
    val stageId: Int,
    
    @SerializedName("stage_name")
    val stageName: String,
    
    @SerializedName("assigned_user_id")
    val assignedUserId: Int? = null,
    
    @SerializedName("assigned_user_name")
    val assignedUserName: String? = null,
    
    @SerializedName("assigned_user_email")
    val assignedUserEmail: String? = null,
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("expected_close_date")
    val expectedCloseDate: String? = null,
    
    @SerializedName("created_at")
    val createdAt: String,
    
    @SerializedName("updated_at")
    val updatedAt: String
)

data class DealStage(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("color")
    val color: String,
    
    @SerializedName("display_order")
    val displayOrder: Int
)

data class DealsResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("deals")
    val deals: List<Deal>? = null,
    
    @SerializedName("message")
    val message: String? = null
)

data class DealStagesResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("stages")
    val stages: List<DealStage>? = null
)

data class CreateDealRequest(
    @SerializedName("title")
    val title: String,
    
    @SerializedName("value")
    val value: Double? = null,
    
    @SerializedName("stage_id")
    val stageId: Int,
    
    @SerializedName("assigned_user_id")
    val assignedUserId: Int? = null,
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("expected_close_date")
    val expectedCloseDate: String? = null
)
