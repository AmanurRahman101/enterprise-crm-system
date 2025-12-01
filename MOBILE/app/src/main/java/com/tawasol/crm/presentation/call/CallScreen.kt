package com.tawasol.crm.presentation.call

import android.view.SurfaceView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.tawasol.crm.data.agora.CallState
import com.tawasol.crm.presentation.theme.*

@Composable
fun CallScreen(
    channelName: String,
    isVideoCall: Boolean = false,
    contactName: String = "Unknown",
    onCallEnded: () -> Unit = {},
    viewModel: CallViewModel = hiltViewModel()
) {
    val callState by viewModel.callState.collectAsState()
    val isMuted by viewModel.isMuted.collectAsState()
    val isVideoEnabled by viewModel.isVideoEnabled.collectAsState()
    val isSpeakerEnabled by viewModel.isSpeakerEnabled.collectAsState()
    val remoteUid by viewModel.remoteUid.collectAsState()
    
    val context = LocalContext.current
    
    LaunchedEffect(Unit) {
        if (isVideoCall) {
            viewModel.startVideoCall(channelName)
        } else {
            viewModel.startVoiceCall(channelName)
        }
    }
    
    LaunchedEffect(callState) {
        if (callState == CallState.ENDED) {
            onCallEnded()
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Gray900)
    ) {
        if (isVideoCall && callState == CallState.CONNECTED) {
            // Video Views
            Column(modifier = Modifier.fillMaxSize()) {
                // Remote video (full screen)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    remoteUid?.let { uid ->
                        AndroidView(
                            factory = {
                                SurfaceView(context).apply {
                                    viewModel.setupRemoteVideo(this, uid)
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    } ?: run {
                        // Waiting for remote user
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Gray800),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = Indigo600)
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "Waiting for $contactName...",
                                    color = Color.White,
                                    style = MaterialTheme.typography.bodyLarge
                                )
                            }
                        }
                    }
                }
                
                // Local video (picture-in-picture)
                if (isVideoEnabled) {
                    Box(
                        modifier = Modifier
                            .padding(16.dp)
                            .size(120.dp, 160.dp),
                        contentAlignment = Alignment.TopEnd
                    ) {
                        AndroidView(
                            factory = {
                                SurfaceView(context).apply {
                                    viewModel.setupLocalVideo(this)
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }
        } else {
            // Voice call UI
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Surface(
                    shape = CircleShape,
                    color = Indigo600,
                    modifier = Modifier.size(120.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Contact",
                            tint = Color.White,
                            modifier = Modifier.size(64.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                Text(
                    text = contactName,
                    color = Color.White,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = when (callState) {
                        CallState.CALLING -> "Calling..."
                        CallState.RINGING -> "Ringing..."
                        CallState.CONNECTED -> if (remoteUid != null) "Connected" else "Waiting..."
                        CallState.ENDED -> "Call Ended"
                        CallState.ERROR -> "Connection Error"
                        else -> "Connecting..."
                    },
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
        
        // Call Controls (Bottom)
        CallControls(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp),
            isMuted = isMuted,
            isVideoEnabled = isVideoEnabled,
            isSpeakerEnabled = isSpeakerEnabled,
            isVideoCall = isVideoCall,
            onMuteToggle = { viewModel.toggleMute() },
            onVideoToggle = { viewModel.toggleVideo() },
            onSpeakerToggle = { viewModel.toggleSpeaker() },
            onSwitchCamera = { viewModel.switchCamera() },
            onEndCall = { viewModel.endCall() }
        )
    }
}

@Composable
fun CallControls(
    modifier: Modifier = Modifier,
    isMuted: Boolean,
    isVideoEnabled: Boolean,
    isSpeakerEnabled: Boolean,
    isVideoCall: Boolean,
    onMuteToggle: () -> Unit,
    onVideoToggle: () -> Unit,
    onSpeakerToggle: () -> Unit,
    onSwitchCamera: () -> Unit,
    onEndCall: () -> Unit
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Mute/Unmute
        CallControlButton(
            icon = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
            contentDescription = if (isMuted) "Unmute" else "Mute",
            isActive = !isMuted,
            onClick = onMuteToggle
        )
        
        // Speaker
        CallControlButton(
            icon = if (isSpeakerEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeDown,
            contentDescription = if (isSpeakerEnabled) "Speaker Off" else "Speaker On",
            isActive = isSpeakerEnabled,
            onClick = onSpeakerToggle
        )
        
        // Video Toggle (only for video calls)
        if (isVideoCall) {
            CallControlButton(
                icon = if (isVideoEnabled) Icons.Default.Videocam else Icons.Default.VideocamOff,
                contentDescription = if (isVideoEnabled) "Video Off" else "Video On",
                isActive = isVideoEnabled,
                onClick = onVideoToggle
            )
            
            // Switch Camera
            CallControlButton(
                icon = Icons.Default.Cameraswitch,
                contentDescription = "Switch Camera",
                isActive = true,
                onClick = onSwitchCamera
            )
        }
        
        // End Call
        FloatingActionButton(
            onClick = onEndCall,
            containerColor = Error,
            modifier = Modifier.size(64.dp)
        ) {
            Icon(
                Icons.Default.CallEnd,
                contentDescription = "End Call",
                tint = Color.White,
                modifier = Modifier.size(32.dp)
            )
        }
    }
}

@Composable
fun CallControlButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    contentDescription: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    FloatingActionButton(
        onClick = onClick,
        containerColor = if (isActive) Color.White.copy(alpha = 0.3f) else Gray700,
        modifier = Modifier.size(56.dp)
    ) {
        Icon(
            icon,
            contentDescription = contentDescription,
            tint = Color.White,
            modifier = Modifier.size(28.dp)
        )
    }
}
