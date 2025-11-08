import React, { useState, useEffect } from 'react';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { VoIPCall } from './VoIPCall';
import { useAuth } from '../../context/AuthContext';
import { callService } from '../../services/callService';
import { contactService } from '../../services/contactService';
import { socketService } from '../../services/socketService';

interface CallButtonProps {
  contactId: string;
  contactName: string;
  contactEmail?: string;
  onCallComplete?: (duration: number) => void;
  className?: string;
  showVideo?: boolean;
}

export const CallButton: React.FC<CallButtonProps> = ({
  contactId,
  contactName,
  onCallComplete,
  className = '',
  showVideo = false,
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [contactUserId, setContactUserId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [roomName, setRoomName] = useState<string>('');
  const { user } = useAuth();

  // Check if contact is registered
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const userInfo = await contactService.getContactUserInfo(contactId);
        setIsRegistered(userInfo.isRegistered);
        setContactUserId(userInfo.userId);
      } catch (error) {
        console.error('Failed to check contact registration:', error);
      }
    };

    checkRegistration();
  }, [contactId]);

  // Listen for call answer
  useEffect(() => {
    const unsubscribe = socketService.onCallAnswered((data) => {
      if (data.accepted) {
        console.log('✅ Call accepted, joining room:', data.roomName);
        setIsCalling(false);
        setIsInCall(true);
        setCallStartTime(new Date());
        setRoomName(data.roomName);
      } else {
        console.log('❌ Call rejected');
        setIsCalling(false);
        alert('Call was declined');
      }
    });

    return unsubscribe;
  }, []);

  const handleStartCall = async (videoEnabled: boolean) => {
    setIsVideoCall(videoEnabled);

    if (isRegistered && contactUserId) {
      // Registered contact - use Socket.IO signaling
      console.log('📞 Sending call offer to registered user:', contactUserId);
      
      const newRoomName = `${contactId}-${Date.now()}`;
      setRoomName(newRoomName);
      setIsCalling(true);

      socketService.sendCallOffer({
        to: { userId: contactUserId },
        from: {
          userId: user?.id || '',
          name: user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.email || 'Unknown',
          avatar: user?.avatar || undefined,
        },
        roomName: newRoomName,
        callType: videoEnabled ? 'VIDEO' : 'AUDIO',
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (isCalling) {
          setIsCalling(false);
          alert('Call timeout - user did not answer');
        }
      }, 30000);
    } else {
      // Non-registered contact - direct Jitsi call
      console.log('📞 Starting direct call (contact not registered)');
      const newRoomName = `${contactId}-${Date.now()}`;
      setRoomName(newRoomName);
      setCallStartTime(new Date());
      setIsInCall(true);
    }
  };

  const handleEndCall = async () => {
    setIsInCall(false);
    setIsCalling(false);
    
    // Send end call signal if calling registered user
    if (isRegistered && contactUserId) {
      socketService.endCall(contactUserId);
    }
    
    // Calculate call duration
    if (callStartTime) {
      const duration = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
      
      // Log call to backend
      try {
        await callService.createCallLog({
          contactId,
          duration,
          callType: isVideoCall ? 'VIDEO' : 'AUDIO',
          status: 'COMPLETED',
          direction: 'OUTBOUND',
          notes: `Call with ${contactName}`,
        });
        
        onCallComplete?.(duration);
      } catch (error) {
        console.error('Failed to log call:', error);
      }
    }
    
    setCallStartTime(null);
    setRoomName('');
  };

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || 'User';

  // Show active call UI
  if (isInCall && roomName) {
    return (
      <VoIPCall
        roomName={roomName}
        displayName={displayName}
        contactName={contactName}
        onCallEnd={handleEndCall}
        audioOnly={!isVideoCall}
      />
    );
  }

  // Show calling UI
  if (isCalling) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Calling {contactName}...</span>
        </div>
        <button
          onClick={() => setIsCalling(false)}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Audio Call Button */}
      <button
        onClick={() => handleStartCall(false)}
        className="flex items-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        title={isRegistered ? "Call (Real-time)" : "Call (Direct link)"}
      >
        <PhoneIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Call</span>
      </button>

      {/* Video Call Button */}
      {showVideo && (
        <button
          onClick={() => handleStartCall(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
          title={isRegistered ? "Video Call (Real-time)" : "Video Call (Direct link)"}
        >
          <VideoCameraIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Video</span>
        </button>
      )}
      
      {/* Registration indicator */}
      {isRegistered && (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          ● Registered
        </span>
      )}
    </div>
  );
};
