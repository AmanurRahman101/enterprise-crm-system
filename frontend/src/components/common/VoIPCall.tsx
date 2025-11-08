import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface VoIPCallProps {
  roomName: string;
  displayName: string;
  contactName?: string;
  onCallEnd: () => void;
  audioOnly?: boolean;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const VoIPCall: React.FC<VoIPCallProps> = ({
  roomName,
  displayName,
  contactName,
  onCallEnd,
  audioOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApi = useRef<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      console.error('Jitsi Meet API not loaded');
      return;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: `TawasolCRM-${roomName}`,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName,
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: audioOnly,
        disableDeepLinking: true,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'hangup',
          'chat',
          'recording',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'tileview',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
    };

    jitsiApi.current = new window.JitsiMeetExternalAPI(domain, options);

    // Event listeners
    jitsiApi.current.addListener('videoConferenceJoined', () => {
      setIsConnecting(false);
      console.log('Call connected');
    });

    jitsiApi.current.addListener('readyToClose', () => {
      jitsiApi.current?.dispose();
      onCallEnd();
    });

    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      jitsiApi.current?.dispose();
    };
  }, [roomName, displayName, audioOnly, onCallEnd]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    jitsiApi.current?.executeCommand('hangup');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Call Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-gray-900/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {audioOnly ? (
                <PhoneIcon className="h-5 w-5 text-primary-400" />
              ) : (
                <VideoCameraIcon className="h-5 w-5 text-primary-400" />
              )}
              <span className="text-white font-medium">
                {contactName || 'VoIP Call'}
              </span>
            </div>
            {isConnecting ? (
              <span className="text-yellow-400 text-sm">Connecting...</span>
            ) : (
              <span className="text-green-400 text-sm">
                {formatDuration(callDuration)}
              </span>
            )}
          </div>
          <button
            onClick={handleEndCall}
            className="flex items-center space-x-2 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Connecting Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-white text-lg">Connecting to call...</p>
            <p className="text-gray-400 text-sm mt-2">
              Share the room link with others to join
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
