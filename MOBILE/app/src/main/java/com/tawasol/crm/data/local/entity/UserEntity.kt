package com.tawasol.crm.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tawasol.crm.data.model.User

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val email: String,
    val role: String,
    val phone: String?,
    val avatar: String?,
    val organizationId: Int?,
    val organizationName: String?,
    val isOnline: Boolean?,
    val lastSeen: String?,
    val createdAt: String?,
    val syncedAt: Long = System.currentTimeMillis()
)

fun UserEntity.toUser(): User {
    return User(
        id = id,
        name = name,
        email = email,
        role = role,
        phone = phone,
        avatar = avatar,
        organizationId = organizationId,
        organizationName = organizationName,
        isOnline = isOnline,
        lastSeen = lastSeen,
        createdAt = createdAt
    )
}

fun User.toEntity(): UserEntity {
    return UserEntity(
        id = id,
        name = name,
        email = email,
        role = role,
        phone = phone,
        avatar = avatar,
        organizationId = organizationId,
        organizationName = organizationName,
        isOnline = isOnline,
        lastSeen = lastSeen,
        createdAt = createdAt
    )
}
