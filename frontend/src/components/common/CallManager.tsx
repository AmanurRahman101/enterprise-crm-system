import React, { useEffect, useState } from 'react';
import { socketService } from '../../services/socketService';
import { IncomingCall } from './IncomingCall';
import { VoIPCall } from './VoIPCall';
import { useAuth } from '../../context/AuthContext';
import { callService } from '../../services/callService';

interface CallState {
  isIncomingCall: boolean;
  isInCall: boolean;
  caller?: {
    userId: string;
    name: string;
    avatar?: string;
  };
  roomName?: string;
  callType?: 'AUDIO' | 'VIDEO';
  callStartTime?: Date;
}

/**
 * CallManager - Global call state manager
 * Handles incoming calls and displays incoming call UI
 */
export const CallManager: React.FC = () => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    isIncomingCall: false,
    isInCall: false,
  });

  useEffect(() => {
    if (!user) return;

    // Listen for incoming calls
    const unsubscribeIncoming = socketService.onCallOffer((data) => {
      console.log('📞 Incoming call received:', data);
      
      setCallState({
        isIncomingCall: true,
        isInCall: false,
        caller: data.from,
        roomName: data.roomName,
        callType: data.callType,
      });
    });

    // Listen for call ended
    const unsubscribeEnded = socketService.onCallEnded((data) => {
      console.log('📞 Call ended by other party');
      
      // Log call if we were in a call
      if (callState.isInCall && callState.callStartTime) {
        const duration = Math.floor((new Date().getTime() - callState.callStartTime.getTime()) / 1000);
        
        callService.createCallLog({
          contactId: data.userId, // This should be contact ID, not user ID (need to map)
          duration,
          callType: callState.callType || 'AUDIO',
          status: 'COMPLETED',
          direction: 'INBOUND',
          notes: `Call with ${callState.caller?.name || 'Unknown'}`,
        }).catch(console.error);
      }
      
      setCallState({
        isIncomingCall: false,
        isInCall: false,
      });
    });

    return () => {
      unsubscribeIncoming();
      unsubscribeEnded();
    };
  }, [user, callState.isInCall, callState.callStartTime, callState.callType, callState.caller]);

  const handleAcceptCall = () => {
    if (!callState.caller || !callState.roomName) return;

    console.log('✅ Accepting call');
    
    // Send accept signal
    socketService.answerCall({
      from: callState.caller.userId,
      accepted: true,
      roomName: callState.roomName,
    });

    // Start the call
    setCallState((prev) => ({
      ...prev,
      isIncomingCall: false,
      isInCall: true,
      callStartTime: new Date(),
    }));
  };

  const handleRejectCall = () => {
    if (!callState.caller || !callState.roomName) return;

    console.log('❌ Rejecting call');
    
    // Send reject signal
    socketService.answerCall({
      from: callState.caller.userId,
      accepted: false,
      roomName: callState.roomName,
    });

    // Clear call state
    setCallState({
      isIncomingCall: false,
      isInCall: false,
    });
  };

  const handleEndCall = async () => {
    if (!callState.caller) return;

    console.log('📞 Ending call');
    
    // Send end call signal
    socketService.endCall(callState.caller.userId);

    // Log call
    if (callState.callStartTime) {
      const duration = Math.floor((new Date().getTime() - callState.callStartTime.getTime()) / 1000);
      
      try {
        await callService.createCallLog({
          contactId: callState.caller.userId, // This should be contact ID
          duration,
          callType: callState.callType || 'AUDIO',
          status: 'COMPLETED',
          direction: 'INBOUND',
          notes: `Call with ${callState.caller.name}`,
        });
      } catch (error) {
        console.error('Failed to log call:', error);
      }
    }

    // Clear call state
    setCallState({
      isIncomingCall: false,
      isInCall: false,
    });
  };

  // Render incoming call UI
  if (callState.isIncomingCall && callState.caller) {
    return (
      <IncomingCall
        callerName={callState.caller.name}
        callerAvatar={callState.caller.avatar}
        callType={callState.callType || 'AUDIO'}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    );
  }

  // Render active call UI
  if (callState.isInCall && callState.roomName && callState.caller) {
    const displayName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'User';

    return (
      <VoIPCall
        roomName={callState.roomName}
        displayName={displayName}
        contactName={callState.caller.name}
        onCallEnd={handleEndCall}
        audioOnly={callState.callType === 'AUDIO'}
      />
    );
  }

  return null;
};
