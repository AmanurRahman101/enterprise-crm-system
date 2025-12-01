package com.tawasol.crm.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.tawasol.crm.data.local.dao.*
import com.tawasol.crm.data.local.entity.*

@Database(
    entities = [
        DealEntity::class,
        IssueEntity::class,
        ContactEntity::class,
        UserEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dealDao(): DealDao
    abstract fun issueDao(): IssueDao
    abstract fun contactDao(): ContactDao
    abstract fun userDao(): UserDao
}
