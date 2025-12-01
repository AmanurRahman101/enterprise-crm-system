package com.tawasol.crm

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class TawasolApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
