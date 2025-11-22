import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

const VoiceCall = ({ contactId, contactName, contactType, onClose }) => {
  const [callState, setCallState] = useState('idle'); // idle, connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const localStreamRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    // Initialize Agora client
    const initCall = async () => {
      try {
        setCallState('connecting');

        // Get Agora token from backend
        const response = await ApiService.request('/api/agora/token', {
          method: 'POST',
          body: {
            channelName: `call_${contactId}_${Date.now()}`,
            role: 'publisher'
          }
        });

        if (!response.success) {
          throw new Error('Failed to get Agora token');
        }

        const { token, channelName, appId } = response;

        // Initialize Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // Set up event handlers
        client.on('stream-added', (evt) => {
          const stream = evt.stream;
          client.subscribe(stream);
        });

        client.on('stream-subscribed', (evt) => {
          const remoteStream = evt.stream;
          // Play remote audio
          remoteStream.play('remote-audio-' + remoteStream.getId());
        });

        client.on('peer-leave', () => {
          toast.info(`${contactName} left the call`);
          endCall();
        });

        // Join channel
        await client.join(appId, channelName, token, null);

        // Create local audio stream
        const localStream = AgoraRTC.createStream({
          audio: true,
          video: false
        });
        localStreamRef.current = localStream;

        await localStream.init();
        await client.publish(localStream);

        setCallState('connected');
        callStartTimeRef.current = Date.now();
        
        // Start call duration timer
        timerIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
            setCallDuration(duration);
          }
        }, 1000);

        toast.success('Call connected');

        // Log call activity
        await ApiService.request('/api/activities', {
          method: 'POST',
          body: {
            entityType: contactType === 'person' ? 'contact_person' : 'contact_org',
            entityId: contactId,
            actionType: 'call_started',
            description: `Started voice call with ${contactName}`
          }
        });

      } catch (err) {
        console.error('Error initializing call:', err);
        setError(err.message || 'Failed to initialize call');
        setCallState('ended');
        toast.error('Failed to connect call');
      }
    };

    initCall();

    // Cleanup on unmount
    return () => {
      endCall(true);
    };
  }, [contactId, contactName, contactType]);

  const endCall = async (isCleanup = false) => {
    try {
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Close local stream
      if (localStreamRef.current) {
        localStreamRef.current.close();
        localStreamRef.current = null;
      }

      // Leave channel and close client
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      const duration = callStartTimeRef.current 
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      // Log call end activity (only if not cleanup)
      if (!isCleanup && callStartTimeRef.current) {
        await ApiService.request('/api/activities', {
          method: 'POST',
          body: {
            entityType: contactType === 'person' ? 'contact_person' : 'contact_org',
            entityId: contactId,
            actionType: 'call_ended',
            description: `Ended voice call with ${contactName}`,
            metadata: { duration }
          }
        });

        toast.success(`Call ended (${formatDuration(duration)})`);
      }

      setCallState('ended');
      
      // Close modal after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);

    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      if (isMuted) {
        localStreamRef.current.unmuteAudio();
        toast.success('Microphone unmuted');
      } else {
        localStreamRef.current.muteAudio();
        toast.success('Microphone muted');
      }
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStateInfo = () => {
    switch (callState) {
      case 'connecting':
        return { text: 'Connecting...', color: 'text-yellow-600', icon: '⏳' };
      case 'connected':
        return { text: 'Connected', color: 'text-green-600', icon: '✓' };
      case 'ended':
        return { text: 'Call Ended', color: 'text-gray-600', icon: '✗' };
      default:
        return { text: 'Initializing...', color: 'text-gray-600', icon: '⏳' };
    }
  };

  const stateInfo = getCallStateInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Call Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 text-white text-center">
          <div className="mb-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto flex items-center justify-center text-4xl">
              {contactType === 'person' ? '👤' : '🏢'}
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">{contactName}</h2>
          <div className={`flex items-center justify-center space-x-2 ${stateInfo.color}`}>
            <span className="text-xl">{stateInfo.icon}</span>
            <span className="text-sm font-medium">{stateInfo.text}</span>
          </div>
        </div>

        {/* Call Duration */}
        {callState === 'connected' && (
          <div className="px-6 py-4 bg-gray-50 text-center">
            <div className="text-3xl font-mono font-bold text-gray-900">
              {formatDuration(callDuration)}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Call Controls */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Mute Button */}
            {callState === 'connected' && (
              <button
                onClick={toggleMute}
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center transition-all
                  ${isMuted 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                  }
                `}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}

            {/* End Call Button */}
            {(callState === 'connected' || callState === 'connecting') && (
              <button
                onClick={() => endCall()}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all shadow-lg"
                title="End Call"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            )}

            {/* Close Button (when call ended) */}
            {callState === 'ended' && (
              <button
                onClick={onClose}
                className="w-16 h-16 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all shadow-lg"
                title="Close"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Hidden audio container for remote streams */}
        <div id="remote-audio-container" className="hidden"></div>
      </div>
    </div>
  );
};

export default VoiceCall;

