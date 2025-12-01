package com.tawasol.crm.util

import androidx.compose.runtime.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

/**
 * Debounces text input changes with a delay
 * @param delay Time in milliseconds to wait before emitting the latest value
 */
@Composable
fun rememberDebouncedValue(
    value: String,
    delay: Long = 500L
): String {
    var debouncedValue by remember { mutableStateOf(value) }
    
    LaunchedEffect(value) {
        val job = launch {
            delay(delay)
            debouncedValue = value
        }
        
        // Cancel previous job when value changes
        awaitCancellation()
        job.cancel()
    }
    
    return debouncedValue
}
