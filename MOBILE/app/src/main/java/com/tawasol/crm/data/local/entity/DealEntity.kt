package com.tawasol.crm.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tawasol.crm.data.model.Deal

@Entity(tableName = "deals")
data class DealEntity(
    @PrimaryKey val id: Int,
    val title: String,
    val description: String?,
    val value: Double?,
    val stageId: Int,
    val stageName: String?,
    val organizationId: Int,
    val assignedUserId: Int?,
    val assignedUserName: String?,
    val clientId: Int?,
    val clientName: String?,
    val createdAt: String?,
    val updatedAt: String?,
    val syncedAt: Long = System.currentTimeMillis()
)

fun DealEntity.toDeal(): Deal {
    return Deal(
        id = id,
        title = title,
        description = description,
        value = value,
        stageId = stageId,
        stageName = stageName,
        organizationId = organizationId,
        assignedUserId = assignedUserId,
        assignedUserName = assignedUserName,
        clientId = clientId,
        clientName = clientName,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun Deal.toEntity(): DealEntity {
    return DealEntity(
        id = id,
        title = title,
        description = description,
        value = value,
        stageId = stageId,
        stageName = stageName,
        organizationId = organizationId,
        assignedUserId = assignedUserId,
        assignedUserName = assignedUserName,
        clientId = clientId,
        clientName = clientName,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
