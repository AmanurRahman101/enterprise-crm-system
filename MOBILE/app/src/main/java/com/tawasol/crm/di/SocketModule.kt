package com.tawasol.crm.di

import com.tawasol.crm.data.socket.SocketManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SocketModule {
    
    @Provides
    @Singleton
    fun provideSocketManager(): SocketManager {
        return SocketManager()
    }
}
