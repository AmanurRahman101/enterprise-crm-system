package com.tawasol.crm.data.agora

import android.content.Context
import android.util.Log
import io.agora.rtc2.*
import io.agora.rtc2.video.VideoCanvas
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

enum class CallState {
    IDLE,
    CALLING,
    RINGING,
    CONNECTED,
    ENDED,
    ERROR
}

data class CallInfo(
    val channelName: String,
    val token: String? = null,
    val isVideoCall: Boolean = false,
    val remoteUid: Int? = null
)

@Singleton
class AgoraManager @Inject constructor(
    private val context: Context
) {
    private var rtcEngine: RtcEngine? = null
    private val appId = "YOUR_AGORA_APP_ID" // TODO: Add from backend config
    
    private val _callState = MutableStateFlow(CallState.IDLE)
    val callState: StateFlow<CallState> = _callState
    
    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted
    
    private val _isVideoEnabled = MutableStateFlow(true)
    val isVideoEnabled: StateFlow<Boolean> = _isVideoEnabled
    
    private val _isSpeakerEnabled = MutableStateFlow(false)
    val isSpeakerEnabled: StateFlow<Boolean> = _isSpeakerEnabled
    
    private val _remoteUid = MutableStateFlow<Int?>(null)
    val remoteUid: StateFlow<Int?> = _remoteUid
    
    companion object {
        private const val TAG = "AgoraManager"
    }
    
    private val rtcEventHandler = object : IRtcEngineEventHandler() {
        override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
            Log.d(TAG, "Joined channel: $channel, uid: $uid")
            _callState.value = CallState.CONNECTED
        }
        
        override fun onUserJoined(uid: Int, elapsed: Int) {
            Log.d(TAG, "Remote user joined: $uid")
            _remoteUid.value = uid
        }
        
        override fun onUserOffline(uid: Int, reason: Int) {
            Log.d(TAG, "Remote user offline: $uid")
            _remoteUid.value = null
        }
        
        override fun onLeaveChannel(stats: RtcStats?) {
            Log.d(TAG, "Left channel")
            _callState.value = CallState.ENDED
            _remoteUid.value = null
        }
        
        override fun onError(err: Int) {
            Log.e(TAG, "Agora error: $err")
            _callState.value = CallState.ERROR
        }
    }
    
    fun initializeEngine() {
        try {
            val config = RtcEngineConfig().apply {
                mContext = context
                mAppId = appId
                mEventHandler = rtcEventHandler
            }
            rtcEngine = RtcEngine.create(config)
            rtcEngine?.enableAudio()
            Log.d(TAG, "Agora engine initialized")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Agora engine", e)
            _callState.value = CallState.ERROR
        }
    }
    
    fun startVoiceCall(channelName: String, token: String? = null) {
        try {
            _callState.value = CallState.CALLING
            
            rtcEngine?.apply {
                setChannelProfile(Constants.CHANNEL_PROFILE_COMMUNICATION)
                joinChannel(token, channelName, null, 0)
            }
            
            Log.d(TAG, "Started voice call in channel: $channelName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start voice call", e)
            _callState.value = CallState.ERROR
        }
    }
    
    fun startVideoCall(channelName: String, token: String? = null) {
        try {
            _callState.value = CallState.CALLING
            
            rtcEngine?.apply {
                enableVideo()
                setChannelProfile(Constants.CHANNEL_PROFILE_COMMUNICATION)
                joinChannel(token, channelName, null, 0)
            }
            
            _isVideoEnabled.value = true
            Log.d(TAG, "Started video call in channel: $channelName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start video call", e)
            _callState.value = CallState.ERROR
        }
    }
    
    fun setupLocalVideo(view: android.view.SurfaceView) {
        rtcEngine?.setupLocalVideo(VideoCanvas(view, VideoCanvas.RENDER_MODE_HIDDEN, 0))
        rtcEngine?.startPreview()
    }
    
    fun setupRemoteVideo(view: android.view.SurfaceView, uid: Int) {
        rtcEngine?.setupRemoteVideo(VideoCanvas(view, VideoCanvas.RENDER_MODE_HIDDEN, uid))
    }
    
    fun toggleMute() {
        val newMuteState = !_isMuted.value
        rtcEngine?.muteLocalAudioStream(newMuteState)
        _isMuted.value = newMuteState
        Log.d(TAG, "Mute toggled: $newMuteState")
    }
    
    fun toggleVideo() {
        val newVideoState = !_isVideoEnabled.value
        rtcEngine?.muteLocalVideoStream(!newVideoState)
        _isVideoEnabled.value = newVideoState
        Log.d(TAG, "Video toggled: $newVideoState")
    }
    
    fun toggleSpeaker() {
        val newSpeakerState = !_isSpeakerEnabled.value
        rtcEngine?.setEnableSpeakerphone(newSpeakerState)
        _isSpeakerEnabled.value = newSpeakerState
        Log.d(TAG, "Speaker toggled: $newSpeakerState")
    }
    
    fun switchCamera() {
        rtcEngine?.switchCamera()
        Log.d(TAG, "Camera switched")
    }
    
    fun endCall() {
        rtcEngine?.apply {
            leaveChannel()
            stopPreview()
        }
        _callState.value = CallState.ENDED
        _remoteUid.value = null
        _isMuted.value = false
        _isVideoEnabled.value = true
        _isSpeakerEnabled.value = false
        Log.d(TAG, "Call ended")
    }
    
    fun destroy() {
        rtcEngine?.apply {
            leaveChannel()
            RtcEngine.destroy()
        }
        rtcEngine = null
        Log.d(TAG, "Agora engine destroyed")
    }
}
