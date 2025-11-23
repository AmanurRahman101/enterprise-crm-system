// ============================================
// Call Manager Service
// Handles Agora SDK and WebSocket for voice calling
// ============================================

import ApiService from './api';
import toast from 'react-hot-toast';

class CallManager {
    constructor() {
        this.agoraClient = null;
        this.localAudioTrack = null;
        this.remoteUsers = {};
        this.ws = null;
        this.isMuted = false;
        this.currentChannel = null;
        this.currentReceiverId = null;
        this.currentReceiverType = null;
        this.currentCallLogId = null;
        this.agoraAppId = null;
        this.ringtone = null;
        this.incomingCallData = null;
        this.callStartTime = null;
        this.callTimer = null;
        this.currentCallerId = null; // Store caller ID for receiver to notify on hangup
        
        // Event callbacks
        this.onIncomingCall = null;
        this.onCallAnswered = null;
        this.onCallRejected = null;
        this.onCallEnded = null;
        this.onUserOffline = null;
        this.onCallConnected = null;
    }

    // ============================================
    // Initialization
    // ============================================

    async initialize() {
        try {
            // Load Agora App ID from config
            const user = ApiService.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Initialize Agora client
            this.initAgoraClient();

            // Initialize ringtone
            this.ringtone = new Audio('/media/tone.mp3');
            this.ringtone.loop = true;

            // Connect to WebSocket for call signaling
            this.connectWebSocket();

            console.log('Call Manager initialized');
            return true;
        } catch (error) {
            console.error('Call Manager initialization error:', error);
            throw error;
        }
    }

    initAgoraClient() {
        if (!window.AgoraRTC) {
            throw new Error('Agora RTC SDK not loaded');
        }

        // Create RTC client in RTC mode with VP8 codec
        this.agoraClient = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        // Handle when remote user publishes audio/video
        this.agoraClient.on('user-published', async (user, mediaType) => {
            console.log('Remote user published:', user.uid, 'mediaType:', mediaType);
            await this.agoraClient.subscribe(user, mediaType);
            console.log('✅ Subscribed to remote user:', user.uid);

            // Play remote audio track
            if (mediaType === 'audio') {
                user.audioTrack.play();
                console.log('✅ Playing remote audio from user:', user.uid);
                
                // Call is now connected
                if (this.onCallConnected) {
                    this.onCallConnected();
                }
            }

            this.remoteUsers[user.uid] = user;
            console.log('Total remote users:', Object.keys(this.remoteUsers).length);
        });

        // Handle when remote user unpublishes media
        this.agoraClient.on('user-unpublished', (user, mediaType) => {
            console.log('User unpublished:', user.uid, mediaType);
        });

        // Handle when remote user leaves channel
        this.agoraClient.on('user-left', (user) => {
            console.log('Remote user left channel:', user.uid);
            delete this.remoteUsers[user.uid];

            // Only end call if there are no remote users AND we've been connected for at least 3 seconds
            // This prevents premature hangup during connection establishment
            if (Object.keys(this.remoteUsers).length === 0 && this.callStartTime && (Date.now() - this.callStartTime) > 3000) {
                console.log('All remote users left, ending call...');
                this.hangup();
            } else {
                console.log('Remote user left but not ending call yet. Remote users:', Object.keys(this.remoteUsers).length);
            }
        });

        console.log('Agora client initialized');
    }

    connectWebSocket() {
        const user = ApiService.getUser();
        if (!user) return;

        // WebSocket URL (adjust based on your server configuration)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_WS_HOST || window.location.hostname;
        const port = import.meta.env.VITE_WS_PORT || '3000';
        const wsUrl = `${protocol}//${host}:${port}/ws/calls`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected for calling');
            console.log('Registering user:', user.id, 'Name:', user.fullName);
            // Wait a bit before sending to ensure connection is fully established
            setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'register',
                        userId: user.id  // Use user.id, not user.userId
                    }));
                }
            }, 100);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting...');
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'incomingCall':
                this.handleIncomingCall(data);
                break;
            case 'callAnswered':
                if (this.onCallAnswered) {
                    this.onCallAnswered();
                }
                // Stop ringtone
                if (this.ringtone) {
                    this.ringtone.pause();
                    this.ringtone.currentTime = 0;
                }
                break;
            case 'callRejected':
                if (this.onCallRejected) {
                    this.onCallRejected();
                }
                this.hangup();
                break;
            case 'callEnded':
                if (this.onCallEnded) {
                    this.onCallEnded();
                }
                this.hangup();
                break;
            case 'userOffline':
                if (this.onUserOffline) {
                    this.onUserOffline(data.message);
                }
                this.hangup();
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // ============================================
    // Outgoing Call
    // ============================================

    async makeCall(contactData) {
        try {
            // Prevent multiple concurrent calls
            if (this.currentChannel) {
                toast.error('You are already in a call');
                return false;
            }

            const user = ApiService.getUser();
            const currentOrg = ApiService.getCurrentOrganization();

            if (!user || !currentOrg) {
                toast.error('Please sign in and select an organization');
                return false;
            }

            const { 
                userId, // For person calls
                linkedOrganizationId, // For organization calls
                firstName, 
                lastName, 
                name, // For organization
                type // 'person' or 'organization'
            } = contactData;

            const displayName = type === 'person' 
                ? `${firstName} ${lastName}` 
                : name;

            const receiverUserId = type === 'person' ? userId : null;
            const receiverOrgId = type === 'organization' ? linkedOrganizationId : null;

            // Check if receiver has a linked user account
            if (!receiverUserId && type === 'person') {
                toast.error('This contact is not linked to a user account');
                return false;
            }

            // Generate unique channel name
            const channelName = `call-${currentOrg.id}-${Date.now()}`;
            this.currentChannel = channelName;
            this.currentReceiverId = receiverUserId;
            this.currentReceiverType = type;

            // Request Agora token from server
            const tokenResponse = await ApiService.request('/api/calls/agora/token', {
                method: 'POST',
                body: JSON.stringify({ 
                    channelName, 
                    uid: user.id 
                })
            });

            if (!tokenResponse.success) {
                throw new Error('Failed to get token');
            }

            const { token, appId, uid } = tokenResponse;
            this.agoraAppId = appId;

            // Log call start on server
            const callLogResponse = await ApiService.request('/api/calls/start', {
                method: 'POST',
                body: JSON.stringify({
                    channelName,
                    receiverType: type,
                    receiverUserId: receiverUserId,
                    receiverOrganizationId: receiverOrgId,
                    receiverContactId: contactData.id,
                    receiverName: displayName
                })
            });

            if (callLogResponse.success) {
                this.currentCallLogId = callLogResponse.callLogId;
            }

            // Join Agora channel with token
            await this.agoraClient.join(appId, channelName, token, uid);
            console.log('Joined channel:', channelName);

            // Create microphone audio track and publish
            this.localAudioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
            await this.agoraClient.publish([this.localAudioTrack]);
            console.log('Published audio track');

            // When calling from an organization, show organization name instead of user name
            const callerDisplayName = currentOrg ? currentOrg.name : user.fullName;
            
            // Send call notification to target user via WebSocket
            console.log('Sending call to:', {
                targetUserId: receiverUserId,
                callerId: user.id,
                callerName: callerDisplayName,
                organizationName: currentOrg?.name,
                receiverName: displayName,
                wsReady: this.ws && this.ws.readyState === WebSocket.OPEN
            });
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // For organization calls, send receiverOrganizationId instead of targetUserId
                const callData = {
                    type: 'call',
                    channelName: channelName,
                    callerId: user.id,
                    callerName: callerDisplayName, // Organization name when calling from organization
                    organizationId: currentOrg.id,
                    organizationName: currentOrg.name,
                    receiverType: type,
                    receiverName: displayName
                };
                
                // For person calls, send targetUserId
                if (type === 'person' && receiverUserId) {
                    callData.targetUserId = receiverUserId;
                }
                
                // For organization calls, send receiverOrganizationId
                if (type === 'organization' && receiverOrgId) {
                    callData.receiverOrganizationId = receiverOrgId;
                    callData.receiverOrganizationName = name; // Include organization name
                }
                
                console.log('Sending call WebSocket message:', callData);
                
                this.ws.send(JSON.stringify(callData));
            } else {
                console.error('WebSocket not ready:', this.ws ? this.ws.readyState : 'null');
            }

            // Don't play ringtone for outgoing calls - only for incoming calls
            // Ringtone is played in handleIncomingCall() for the receiver

            return { success: true, displayName };

        } catch (error) {
            console.error('Call error:', error);
            toast.error('Failed to start call: ' + error.message);
            await this.hangup();
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // Incoming Call Handling
    // ============================================

    handleIncomingCall(data) {
        // Reject if already in a call
        if (this.currentChannel) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'rejectCall',
                    targetUserId: data.callerId
                }));
            }
            return;
        }

        this.incomingCallData = data;

        // Play ringtone for incoming call
        if (this.ringtone) {
            this.ringtone.play().catch(err => console.log('Ringtone play failed:', err));
        }

        // Trigger callback
        if (this.onIncomingCall) {
            this.onIncomingCall(data);
        }
    }

    async answerCall(incomingCallDataParam = null) {
        // Use passed data or fallback to stored data
        const callData = incomingCallDataParam || this.incomingCallData;
        
        if (!callData) {
            console.error('No incoming call data');
            console.error('IncomingCallDataParam:', incomingCallDataParam);
            console.error('this.incomingCallData:', this.incomingCallData);
            return { success: false, error: 'No incoming call data available' };
        }

        try {
            console.log('Answering call...');
            console.log('Using call data:', callData);
            
            // Stop ringtone
            if (this.ringtone) {
                this.ringtone.pause();
                this.ringtone.currentTime = 0;
            }

            const user = ApiService.getUser();
            const { channelName, callerId, callerName, organizationId } = callData;
            
            console.log('Call details:', { channelName, callerId, callerName, organizationId, receiverId: user.id });
            
            this.currentChannel = channelName;
            this.currentReceiverId = callerId;
            this.currentCallerId = callerId; // Store caller ID for later notification

            // Request Agora token for joining call
            // Include organizationId in the request header
            console.log('Requesting Agora token with organizationId:', organizationId);
            const tokenResponse = await ApiService.request('/api/calls/agora/token', {
                method: 'POST',
                headers: {
                    'X-Organization-Id': String(organizationId) // Pass the caller's organization ID
                },
                body: { 
                    channelName, 
                    uid: user.id 
                }
            });

            if (!tokenResponse.success) {
                throw new Error('Failed to get token');
            }

            const { token, appId, uid } = tokenResponse;
            this.agoraAppId = appId;
            console.log('Got Agora token, joining channel...');

            // Join Agora channel
            await this.agoraClient.join(appId, channelName, token, uid);
            console.log('✅ Joined channel:', channelName);

            // Create and publish audio track
            console.log('Creating microphone track...');
            this.localAudioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
            console.log('Publishing audio track...');
            await this.agoraClient.publish([this.localAudioTrack]);
            console.log('✅ Published audio track');

            // Notify caller that call was answered
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('Notifying caller that call was answered...');
                this.ws.send(JSON.stringify({
                    type: 'callAnswered',
                    targetUserId: callerId
                }));
            }

            // Clear incoming call data after successful answer
            this.incomingCallData = null;

            // Start call timer
            this.startCallTimer();

            console.log('✅ Call answered successfully');
            const callerDisplayName = callData.organizationName || callerName;
            return { success: true, callerName: callerDisplayName };

        } catch (error) {
            console.error('❌ Answer call error:', error);
            console.error('Error details:', error.message, error.stack);
            toast.error('Failed to answer call: ' + error.message);
            // Don't call hangup here as it might interfere with the call
            this.incomingCallData = null;
            return { success: false, error: error.message };
        }
    }

    rejectCall() {
        if (!this.incomingCallData) return;

        // Stop ringtone
        if (this.ringtone) {
            this.ringtone.pause();
            this.ringtone.currentTime = 0;
        }

        // Notify caller of rejection
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'rejectCall',
                targetUserId: this.incomingCallData.callerId
            }));
        }

        this.incomingCallData = null;
    }

    // ============================================
    // Call Controls
    // ============================================

    async hangup(status = 'completed') {
        try {
            // Stop ringtone
            if (this.ringtone) {
                this.ringtone.pause();
                this.ringtone.currentTime = 0;
            }

            // Determine who to notify based on call direction
            let targetUserIdToNotify = null;
            
            // If we have currentCallerId, we're the receiver - notify the caller
            if (this.currentCallerId) {
                targetUserIdToNotify = this.currentCallerId;
                console.log('Receiver hanging up, notifying caller:', targetUserIdToNotify);
            }
            // Otherwise, if we have currentReceiverId, we're the caller - notify the receiver
            else if (this.currentReceiverId) {
                targetUserIdToNotify = this.currentReceiverId;
                console.log('Caller hanging up, notifying receiver:', targetUserIdToNotify);
            }
            // Fallback: check incoming call data if still available
            else if (this.incomingCallData && this.incomingCallData.callerId) {
                targetUserIdToNotify = this.incomingCallData.callerId;
                console.log('Using incoming call data to notify caller:', targetUserIdToNotify);
            }

            // Notify other party
            if (targetUserIdToNotify && this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('📞 Sending endCall notification to user:', targetUserIdToNotify);
                this.ws.send(JSON.stringify({
                    type: 'endCall',
                    targetUserId: targetUserIdToNotify
                }));
            } else {
                console.warn('⚠️ Cannot send endCall notification:', {
                    targetUserIdToNotify,
                    wsReady: this.ws && this.ws.readyState === WebSocket.OPEN,
                    hasIncomingCallData: !!this.incomingCallData,
                    currentReceiverId: this.currentReceiverId,
                    currentCallerId: this.currentCallerId
                });
            }

            // Close local audio track
            if (this.localAudioTrack) {
                this.localAudioTrack.close();
                this.localAudioTrack = null;
            }

            // Leave Agora channel
            if (this.agoraClient && this.currentChannel) {
                await this.agoraClient.leave();
                console.log('Left channel');

                // Log call end on server
                if (this.currentCallLogId) {
                    await ApiService.request('/api/calls/end', {
                        method: 'POST',
                        body: JSON.stringify({
                            callLogId: this.currentCallLogId,
                            channelName: this.currentChannel,
                            status: status
                        })
                    });
                }
            }

            // Reset state
            this.currentChannel = null;
            this.currentReceiverId = null;
            this.currentReceiverType = null;
            this.currentCallLogId = null;
            this.currentCallerId = null; // Clear caller ID
            this.isMuted = false;
            this.remoteUsers = {};
            this.incomingCallData = null;

            // Clear timer
            if (this.callTimer) {
                clearInterval(this.callTimer);
                this.callTimer = null;
                this.callStartTime = null;
            }

            // Trigger callback
            if (this.onCallEnded) {
                this.onCallEnded();
            }

        } catch (error) {
            console.error('Hangup error:', error);
        }
    }

    async toggleMute() {
        if (!this.localAudioTrack) return;

        if (this.isMuted) {
            await this.localAudioTrack.setEnabled(true);
            this.isMuted = false;
        } else {
            await this.localAudioTrack.setEnabled(false);
            this.isMuted = true;
        }

        return this.isMuted;
    }

    startCallTimer() {
        this.callStartTime = Date.now();
        this.callTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            // You can emit an event here to update UI
            if (this.onCallTimerUpdate) {
                this.onCallTimerUpdate(formattedTime);
            }
        }, 1000);
    }

    // ============================================
    // Cleanup
    // ============================================

    destroy() {
        this.hangup();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.agoraClient) {
            this.agoraClient = null;
        }

        console.log('Call Manager destroyed');
    }
}

// Export singleton instance
const callManager = new CallManager();
export default callManager;

