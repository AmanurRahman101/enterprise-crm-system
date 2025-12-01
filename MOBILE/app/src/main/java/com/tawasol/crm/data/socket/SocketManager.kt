package com.tawasol.crm.data.socket

import android.util.Log
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import java.net.URISyntaxException
import javax.inject.Inject
import javax.inject.Singleton

sealed class SocketEvent {
    data class DealUpdated(val dealId: Int, val data: String) : SocketEvent()
    data class IssueUpdated(val issueId: Int, val data: String) : SocketEvent()
    data class NewMessage(val from: String, val message: String) : SocketEvent()
    data class UserOnlineStatus(val userId: Int, val isOnline: Boolean) : SocketEvent()
    data class CallIncoming(val callData: String) : SocketEvent()
    data class Error(val message: String) : SocketEvent()
}

enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    ERROR
}

@Singleton
class SocketManager @Inject constructor() {
    
    private var socket: Socket? = null
    private val gson = Gson()
    
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState
    
    private val _events = MutableSharedFlow<SocketEvent>()
    val events: SharedFlow<SocketEvent> = _events
    
    companion object {
        private const val TAG = "SocketManager"
        private const val WS_URL = "ws://10.0.2.2:3001" // Emulator localhost
    }
    
    fun connect(token: String) {
        if (socket?.connected() == true) {
            Log.d(TAG, "Socket already connected")
            return
        }
        
        try {
            _connectionState.value = ConnectionState.CONNECTING
            
            val options = IO.Options().apply {
                auth = mapOf("token" to token)
                reconnection = true
                reconnectionDelay = 1000
                reconnectionAttempts = 5
                timeout = 10000
            }
            
            socket = IO.socket(WS_URL, options)
            
            socket?.apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "Socket connected")
                    _connectionState.value = ConnectionState.CONNECTED
                }
                
                on(Socket.EVENT_DISCONNECT) {
                    Log.d(TAG, "Socket disconnected")
                    _connectionState.value = ConnectionState.DISCONNECTED
                }
                
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.e(TAG, "Socket connection error: ${args.firstOrNull()}")
                    _connectionState.value = ConnectionState.ERROR
                }
                
                // Deal events
                on("deal:updated") { args ->
                    args.firstOrNull()?.let { data ->
                        handleDealUpdate(data as JSONObject)
                    }
                }
                
                on("deal:created") { args ->
                    args.firstOrNull()?.let { data ->
                        handleDealUpdate(data as JSONObject)
                    }
                }
                
                on("deal:deleted") { args ->
                    args.firstOrNull()?.let { data ->
                        handleDealUpdate(data as JSONObject)
                    }
                }
                
                // Issue events
                on("issue:updated") { args ->
                    args.firstOrNull()?.let { data ->
                        handleIssueUpdate(data as JSONObject)
                    }
                }
                
                on("issue:created") { args ->
                    args.firstOrNull()?.let { data ->
                        handleIssueUpdate(data as JSONObject)
                    }
                }
                
                // Message events
                on("message:new") { args ->
                    args.firstOrNull()?.let { data ->
                        handleNewMessage(data as JSONObject)
                    }
                }
                
                // User status events
                on("user:online") { args ->
                    args.firstOrNull()?.let { data ->
                        handleUserStatus(data as JSONObject, true)
                    }
                }
                
                on("user:offline") { args ->
                    args.firstOrNull()?.let { data ->
                        handleUserStatus(data as JSONObject, false)
                    }
                }
                
                // Call events
                on("call:incoming") { args ->
                    args.firstOrNull()?.let { data ->
                        handleIncomingCall(data as JSONObject)
                    }
                }
                
                connect()
            }
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Invalid socket URL", e)
            _connectionState.value = ConnectionState.ERROR
        } catch (e: Exception) {
            Log.e(TAG, "Socket connection failed", e)
            _connectionState.value = ConnectionState.ERROR
        }
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _connectionState.value = ConnectionState.DISCONNECTED
        Log.d(TAG, "Socket disconnected manually")
    }
    
    fun emit(event: String, data: JSONObject) {
        socket?.emit(event, data)
    }
    
    private fun handleDealUpdate(data: JSONObject) {
        try {
            val dealId = data.optInt("id", -1)
            if (dealId != -1) {
                kotlinx.coroutines.GlobalScope.launch {
                    _events.emit(SocketEvent.DealUpdated(dealId, data.toString()))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling deal update", e)
        }
    }
    
    private fun handleIssueUpdate(data: JSONObject) {
        try {
            val issueId = data.optInt("id", -1)
            if (issueId != -1) {
                kotlinx.coroutines.GlobalScope.launch {
                    _events.emit(SocketEvent.IssueUpdated(issueId, data.toString()))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling issue update", e)
        }
    }
    
    private fun handleNewMessage(data: JSONObject) {
        try {
            val from = data.optString("from", "Unknown")
            val message = data.optString("message", "")
            kotlinx.coroutines.GlobalScope.launch {
                _events.emit(SocketEvent.NewMessage(from, message))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling new message", e)
        }
    }
    
    private fun handleUserStatus(data: JSONObject, isOnline: Boolean) {
        try {
            val userId = data.optInt("userId", -1)
            if (userId != -1) {
                kotlinx.coroutines.GlobalScope.launch {
                    _events.emit(SocketEvent.UserOnlineStatus(userId, isOnline))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling user status", e)
        }
    }
    
    private fun handleIncomingCall(data: JSONObject) {
        try {
            kotlinx.coroutines.GlobalScope.launch {
                _events.emit(SocketEvent.CallIncoming(data.toString()))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling incoming call", e)
        }
    }
    
    fun isConnected(): Boolean = socket?.connected() ?: false
}
