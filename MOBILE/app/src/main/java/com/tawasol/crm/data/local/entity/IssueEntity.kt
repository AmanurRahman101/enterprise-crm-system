package com.tawasol.crm.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tawasol.crm.data.model.Issue

@Entity(tableName = "issues")
data class IssueEntity(
    @PrimaryKey val id: Int,
    val title: String,
    val description: String,
    val status: String,
    val priority: String,
    val dealId: Int?,
    val dealTitle: String?,
    val organizationId: Int,
    val reportedById: Int,
    val reportedByName: String?,
    val jiraTicketId: String?,
    val jiraTicketUrl: String?,
    val createdAt: String?,
    val updatedAt: String?,
    val syncedAt: Long = System.currentTimeMillis()
)

fun IssueEntity.toIssue(): Issue {
    return Issue(
        id = id,
        title = title,
        description = description,
        status = status,
        priority = priority,
        dealId = dealId,
        dealTitle = dealTitle,
        organizationId = organizationId,
        reportedById = reportedById,
        reportedByName = reportedByName,
        jiraTicketId = jiraTicketId,
        jiraTicketUrl = jiraTicketUrl,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun Issue.toEntity(): IssueEntity {
    return IssueEntity(
        id = id,
        title = title,
        description = description,
        status = status,
        priority = priority,
        dealId = dealId,
        dealTitle = dealTitle,
        organizationId = organizationId,
        reportedById = reportedById,
        reportedByName = reportedByName,
        jiraTicketId = jiraTicketId,
        jiraTicketUrl = jiraTicketUrl,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
