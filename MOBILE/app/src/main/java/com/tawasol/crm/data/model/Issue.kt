package com.tawasol.crm.data.model

import com.google.gson.annotations.SerializedName

data class Issue(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("description")
    val description: String,
    
    @SerializedName("status")
    val status: String, // open, in_progress, resolved, closed
    
    @SerializedName("priority")
    val priority: String, // low, medium, high, urgent
    
    @SerializedName("deal_id")
    val dealId: Int? = null,
    
    @SerializedName("deal_title")
    val dealTitle: String? = null,
    
    @SerializedName("jira_ticket_id")
    val jiraTicketId: String? = null,
    
    @SerializedName("jira_url")
    val jiraUrl: String? = null,
    
    @SerializedName("created_at")
    val createdAt: String,
    
    @SerializedName("updated_at")
    val updatedAt: String
)

data class IssuesResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("issues")
    val issues: List<Issue>? = null,
    
    @SerializedName("message")
    val message: String? = null
)

data class CreateIssueRequest(
    @SerializedName("title")
    val title: String,
    
    @SerializedName("description")
    val description: String,
    
    @SerializedName("priority")
    val priority: String = "medium",
    
    @SerializedName("dealId")
    val dealId: Int? = null
)
