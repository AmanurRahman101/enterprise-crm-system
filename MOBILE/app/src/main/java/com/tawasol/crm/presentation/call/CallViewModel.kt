package com.tawasol.crm.presentation.call

import androidx.lifecycle.ViewModel
import com.tawasol.crm.data.agora.AgoraManager
import com.tawasol.crm.data.agora.CallState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class CallViewModel @Inject constructor(
    private val agoraManager: AgoraManager
) : ViewModel() {
    
    val callState: StateFlow<CallState> = agoraManager.callState
    val isMuted: StateFlow<Boolean> = agoraManager.isMuted
    val isVideoEnabled: StateFlow<Boolean> = agoraManager.isVideoEnabled
    val isSpeakerEnabled: StateFlow<Boolean> = agoraManager.isSpeakerEnabled
    val remoteUid: StateFlow<Int?> = agoraManager.remoteUid
    
    fun startVoiceCall(channelName: String, token: String? = null) {
        agoraManager.startVoiceCall(channelName, token)
    }
    
    fun startVideoCall(channelName: String, token: String? = null) {
        agoraManager.startVideoCall(channelName, token)
    }
    
    fun setupLocalVideo(view: android.view.SurfaceView) {
        agoraManager.setupLocalVideo(view)
    }
    
    fun setupRemoteVideo(view: android.view.SurfaceView, uid: Int) {
        agoraManager.setupRemoteVideo(view, uid)
    }
    
    fun toggleMute() {
        agoraManager.toggleMute()
    }
    
    fun toggleVideo() {
        agoraManager.toggleVideo()
    }
    
    fun toggleSpeaker() {
        agoraManager.toggleSpeaker()
    }
    
    fun switchCamera() {
        agoraManager.switchCamera()
    }
    
    fun endCall() {
        agoraManager.endCall()
    }
    
    override fun onCleared() {
        super.onCleared()
        agoraManager.destroy()
    }
}
