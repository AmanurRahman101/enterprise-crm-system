package com.tawasol.crm.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tawasol.crm.data.model.ChatMessage
import com.tawasol.crm.data.model.ChatMessageRequest
import com.tawasol.crm.data.remote.ApiService
import com.tawasol.crm.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class Message(
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {
    
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        // Add welcome message
        _messages.value = listOf(
            Message(
                text = "Hello! I'm HudHud, your AI assistant. How can I help you today?",
                isUser = false
            )
        )
    }
    
    fun sendMessage(text: String) {
        if (text.isBlank()) return
        
        // Add user message
        val userMessage = Message(text = text, isUser = true)
        _messages.value = _messages.value + userMessage
        
        // Send to API
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val request = ChatMessageRequest(message = text)
                val response = apiService.sendChatMessage(request)
                
                if (response.success) {
                    val botMessage = Message(
                        text = response.data?.response ?: "I'm sorry, I couldn't process that.",
                        isUser = false
                    )
                    _messages.value = _messages.value + botMessage
                } else {
                    _error.value = response.message ?: "Failed to get response"
                }
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Failed to send message"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun clearError() {
        _error.value = null
    }
    
    fun clearChat() {
        _messages.value = listOf(
            Message(
                text = "Hello! I'm HudHud, your AI assistant. How can I help you today?",
                isUser = false
            )
        )
    }
}
