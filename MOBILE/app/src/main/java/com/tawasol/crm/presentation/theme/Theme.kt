package com.tawasol.crm.presentation.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Indigo600,
    onPrimary = Color.White,
    primaryContainer = Indigo100,
    onPrimaryContainer = Indigo700,
    
    secondary = Gray700,
    onSecondary = Color.White,
    secondaryContainer = Gray100,
    onSecondaryContainer = Gray900,
    
    tertiary = Blue50,
    onTertiary = Indigo600,
    
    background = Color.White,
    onBackground = Gray900,
    
    surface = Color.White,
    onSurface = Gray900,
    
    surfaceVariant = Gray50,
    onSurfaceVariant = Gray700,
    
    error = Error,
    onError = Color.White,
    
    outline = Gray300,
    outlineVariant = Gray200
)

@Composable
fun TawasolCRMTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme // For now, only light theme to match web
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Indigo600.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
