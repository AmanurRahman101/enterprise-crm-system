package com.tawasol.crm.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tawasol.crm.data.model.Contact

@Entity(tableName = "contacts")
data class ContactEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val email: String?,
    val phone: String?,
    val contactType: String,
    val organizationId: Int,
    val userId: Int?,
    val isOnline: Boolean?,
    val createdAt: String?,
    val syncedAt: Long = System.currentTimeMillis()
)

fun ContactEntity.toContact(): Contact {
    return Contact(
        id = id,
        name = name,
        email = email,
        phone = phone,
        contactType = contactType,
        organizationId = organizationId,
        userId = userId,
        isOnline = isOnline,
        createdAt = createdAt
    )
}

fun Contact.toEntity(): ContactEntity {
    return ContactEntity(
        id = id,
        name = name,
        email = email,
        phone = phone,
        contactType = contactType,
        organizationId = organizationId,
        userId = userId,
        isOnline = isOnline,
        createdAt = createdAt
    )
}
