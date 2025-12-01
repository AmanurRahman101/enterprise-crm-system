package com.tawasol.crm.di

import android.content.Context
import androidx.room.Room
import com.tawasol.crm.data.local.AppDatabase
import com.tawasol.crm.data.local.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "tawasol_crm_database"
        )
            .fallbackToDestructiveMigration()
            .build()
    }
    
    @Provides
    @Singleton
    fun provideDealDao(database: AppDatabase): DealDao {
        return database.dealDao()
    }
    
    @Provides
    @Singleton
    fun provideIssueDao(database: AppDatabase): IssueDao {
        return database.issueDao()
    }
    
    @Provides
    @Singleton
    fun provideContactDao(database: AppDatabase): ContactDao {
        return database.contactDao()
    }
    
    @Provides
    @Singleton
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }
}
