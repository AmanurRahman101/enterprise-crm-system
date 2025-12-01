package com.tawasol.crm.data.mcp

import android.util.Log
import com.tawasol.crm.BuildConfig
import com.tawasol.crm.data.local.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class McpClient @Inject constructor(
    private val tokenManager: TokenManager,
    private val okHttpClient: OkHttpClient
) {
    private val TAG = "McpClient"
    private val scope = CoroutineScope(Dispatchers.IO + Job())
    
    private var eventSource: EventSource? = null
    private var isClientMode = false
    
    private val _connectionState = MutableStateFlow<McpConnectionState>(McpConnectionState.Disconnected)
    val connectionState: StateFlow<McpConnectionState> = _connectionState
    
    private val _toolsAvailable = MutableStateFlow<List<McpTool>>(emptyList())
    val toolsAvailable: StateFlow<List<McpTool>> = _toolsAvailable
    
    /**
     * Connect to MCP server via SSE
     * @param clientMode true for client mode (/mcp/client/sse), false for org mode (/mcp/org/sse)
     */
    fun connect(clientMode: Boolean = false) {
        disconnect() // Disconnect any existing connection
        
        this.isClientMode = clientMode
        val url = if (clientMode) BuildConfig.MCP_CLIENT_URL else BuildConfig.MCP_ORG_URL
        
        scope.launch {
            val token = tokenManager.getToken() ?: run {
                Log.e(TAG, "No auth token available")
                _connectionState.value = McpConnectionState.Error("No authentication token")
                return@launch
            }
            
            try {
                val request = Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer $token")
                    .build()
                
                _connectionState.value = McpConnectionState.Connecting
                
                val listener = object : EventSourceListener() {
                    override fun onOpen(eventSource: EventSource, response: Response) {
                        Log.d(TAG, "SSE connection opened")
                        _connectionState.value = McpConnectionState.Connected
                    }
                    
                    override fun onEvent(
                        eventSource: EventSource,
                        id: String?,
                        type: String?,
                        data: String
                    ) {
                        Log.d(TAG, "SSE event received - type: $type, data: $data")
                        handleSseEvent(type, data)
                    }
                    
                    override fun onClosed(eventSource: EventSource) {
                        Log.d(TAG, "SSE connection closed")
                        _connectionState.value = McpConnectionState.Disconnected
                    }
                    
                    override fun onFailure(
                        eventSource: EventSource,
                        t: Throwable?,
                        response: Response?
                    ) {
                        Log.e(TAG, "SSE connection failed", t)
                        _connectionState.value = McpConnectionState.Error(
                            t?.message ?: "Connection failed"
                        )
                    }
                }
                
                eventSource = EventSources.createFactory(okHttpClient)
                    .newEventSource(request, listener)
                
            } catch (e: Exception) {
                Log.e(TAG, "Failed to connect to MCP", e)
                _connectionState.value = McpConnectionState.Error(e.message ?: "Unknown error")
            }
        }
    }
    
    private fun handleSseEvent(type: String?, data: String) {
        try {
            when (type) {
                "tools" -> {
                    // Parse available tools
                    val json = JSONObject(data)
                    val toolsArray = json.optJSONArray("tools")
                    val tools = mutableListOf<McpTool>()
                    
                    toolsArray?.let {
                        for (i in 0 until it.length()) {
                            val toolObj = it.getJSONObject(i)
                            tools.add(
                                McpTool(
                                    name = toolObj.getString("name"),
                                    description = toolObj.optString("description", ""),
                                    inputSchema = toolObj.optJSONObject("inputSchema")?.toString()
                                )
                            )
                        }
                    }
                    
                    _toolsAvailable.value = tools
                    Log.d(TAG, "Received ${tools.size} tools from MCP server")
                }
                "message" -> {
                    // Handle server messages
                    Log.d(TAG, "Server message: $data")
                }
                else -> {
                    Log.d(TAG, "Unknown event type: $type")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling SSE event", e)
        }
    }
    
    fun disconnect() {
        eventSource?.cancel()
        eventSource = null
        _connectionState.value = McpConnectionState.Disconnected
        _toolsAvailable.value = emptyList()
    }
    
    fun isConnected(): Boolean {
        return _connectionState.value is McpConnectionState.Connected
    }
}

sealed class McpConnectionState {
    object Disconnected : McpConnectionState()
    object Connecting : McpConnectionState()
    object Connected : McpConnectionState()
    data class Error(val message: String) : McpConnectionState()
}

data class McpTool(
    val name: String,
    val description: String,
    val inputSchema: String?
)
