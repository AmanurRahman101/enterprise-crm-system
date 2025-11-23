import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import callManager from '../services/callManager';
import ApiService from '../services/api';

const CallInterface = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'calling', 'ringing', 'connected'
  const [contactName, setContactName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00');
  const [incomingCall, setIncomingCall] = useState(null);

  const [receiverOrgName, setReceiverOrgName] = useState('');
  
  useEffect(() => {
    if (receiverOrgName) {
      console.log('🏢 receiverOrgName updated:', receiverOrgName);
    }
  }, [receiverOrgName]);
  
  useEffect(() => {
    // Load user's organizations for displaying receiver org name
    const loadOrganizations = async () => {
      try {
        const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
        return orgs;
      } catch (error) {
        console.error('Failed to load organizations:', error);
        return [];
      }
    };

    // Register callbacks
    callManager.onIncomingCall = async (data) => {
      console.log('📞 Incoming call data received:', data);
      setIncomingCall(data);
      // Use organization name if available, otherwise use caller name
      const displayName = data.organizationName || data.callerName;
      setContactName(displayName);
      
      // Determine receiver organization name if it's an organization call
      if (data.receiverType === 'organization') {
        console.log('🔍 Organization call detected:', {
          receiverType: data.receiverType,
          receiverOrganizationId: data.receiverOrganizationId,
          receiverOrganizationName: data.receiverOrganizationName,
          receiverName: data.receiverName
        });
        
        // Use receiverOrganizationName if provided by backend, otherwise look it up
        if (data.receiverOrganizationName) {
          console.log('✅ Using receiverOrganizationName from backend:', data.receiverOrganizationName);
          setReceiverOrgName(data.receiverOrganizationName);
        } else if (data.receiverOrganizationId) {
          console.log('🔍 Looking up organization name by ID:', data.receiverOrganizationId);
          const orgs = await loadOrganizations();
          console.log('📋 User organizations:', orgs);
          const receiverOrg = orgs.find(org => org.id === data.receiverOrganizationId);
          const orgName = receiverOrg ? receiverOrg.name : `Organization #${data.receiverOrganizationId}`;
          console.log('✅ Found organization name:', orgName);
          setReceiverOrgName(orgName);
        } else {
          console.warn('⚠️ No receiverOrganizationId or receiverOrganizationName found');
          setReceiverOrgName('');
        }
      } else {
        setReceiverOrgName('');
      }
      
      setCallStatus('incoming');
      setIsVisible(true);
    };

    callManager.onCallAnswered = () => {
      setCallStatus('connected');
      callManager.startCallTimer();
    };

    callManager.onCallConnected = () => {
      setCallStatus('connected');
    };

    callManager.onCallRejected = () => {
      setIsVisible(false);
      setCallStatus('idle');
      resetState();
    };

    callManager.onCallEnded = () => {
      setIsVisible(false);
      setCallStatus('idle');
      resetState();
    };

    callManager.onUserOffline = (message) => {
      alert(message);
      setIsVisible(false);
      setCallStatus('idle');
      resetState();
    };

    callManager.onCallTimerUpdate = (time) => {
      setCallDuration(time);
    };

    // Initialize callManager
    callManager.initialize().catch(error => {
      console.error('Failed to initialize call manager:', error);
    });

    return () => {
      // Cleanup
      callManager.onIncomingCall = null;
      callManager.onCallAnswered = null;
      callManager.onCallConnected = null;
      callManager.onCallRejected = null;
      callManager.onCallEnded = null;
      callManager.onUserOffline = null;
      callManager.onCallTimerUpdate = null;
    };
  }, []);

  const resetState = () => {
    setContactName('');
    setIsMuted(false);
    setCallDuration('00:00');
    setIncomingCall(null);
    setReceiverOrgName('');
  };

  const handleAnswerCall = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('✅ Answer button clicked!');
    console.log('Incoming call data (React state):', incomingCall);
    console.log('Incoming call data (callManager):', callManager.incomingCallData);
    
    // Ensure we have call data before proceeding
    if (!incomingCall) {
      console.error('❌ No incoming call data in React state!');
      toast.error('No incoming call data. Please try again.');
      return;
    }
    
    // Check if user has permission to answer calls (viewers cannot)
    const currentOrg = ApiService.getCurrentOrganization();
    const userRole = currentOrg?.role;
    
    // If it's an organization call, check permission
    if (incomingCall.receiverType === 'organization' && userRole === 'viewer') {
      toast.error('You do not have permission to answer organization calls. Viewers can only view information.');
      // Reject the call
      handleRejectCall(e);
      return;
    }
    
    // Show loading state
    setCallStatus('connecting');
    
    try {
      // Pass the incoming call data explicitly to ensure it's available
      const result = await callManager.answerCall(incomingCall);
      console.log('Answer call result:', result);
      
      if (result && result.success) {
        console.log('✅ Call answered successfully, updating UI...');
        setCallStatus('connected');
        setContactName(result.callerName);
        setIncomingCall(null); // Clear incoming call state
        toast.success('Call connected!');
      } else {
        console.error('❌ Failed to answer call:', result);
        const errorMsg = result?.error || 'Failed to answer call';
        alert('Call failed: ' + errorMsg); // Alert for mobile visibility
        toast.error(errorMsg);
        setIsVisible(false);
        setCallStatus('idle');
        resetState();
      }
    } catch (error) {
      console.error('❌ Error in handleAnswerCall:', error);
      const errorMsg = error.message || 'Unknown error';
      alert('Error answering call: ' + errorMsg); // Alert for mobile visibility
      toast.error('Error answering call: ' + errorMsg);
      setIsVisible(false);
      setCallStatus('idle');
      resetState();
    }
  };

  const handleRejectCall = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('✅ Reject button clicked');
    callManager.rejectCall();
    setIncomingCall(null);
    setIsVisible(false);
    setCallStatus('idle');
    resetState();
  };

  const handleHangup = async () => {
    await callManager.hangup();
    setIsVisible(false);
    setCallStatus('idle');
    resetState();
  };

  const handleToggleMute = async () => {
    const muted = await callManager.toggleMute();
    setIsMuted(muted);
  };

  // Function to trigger outgoing call (called from Contacts page)
  const makeCall = async (contactData) => {
    const result = await callManager.makeCall(contactData);
    if (result.success) {
      setContactName(result.displayName);
      setCallStatus('ringing');
      setIsVisible(true);
      return true;
    }
    return false;
  };

  // Expose makeCall function globally for other components
  useEffect(() => {
    window.makeCall = makeCall;
    return () => {
      delete window.makeCall;
    };
  }, []);

  if (!isVisible) return null;

  // Incoming Call Modal
  if (callStatus === 'incoming' && incomingCall) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {incomingCall?.organizationName ? (
                // Building icon for organization calls
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                // Person icon for individual calls
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Incoming Call</h2>
            
            {/* Caller Information */}
            <div className="mb-3">
              <p className="text-lg font-semibold text-gray-900">{contactName}</p>
              {incomingCall?.organizationName && (
                <p className="text-sm text-indigo-600 mt-1 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  From: {incomingCall.organizationName}
                </p>
              )}
            </div>
            
            {/* Call Type and Receiver Organization */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {incomingCall?.receiverType === 'organization' ? (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700">Organization Call</span>
                  {(receiverOrgName || incomingCall?.receiverOrganizationName) && (
                    <>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-700">
                        For: {receiverOrgName || incomingCall?.receiverOrganizationName || `Organization #${incomingCall?.receiverOrganizationId || ''}`}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">Personal Call</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500">Ringing...</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRejectCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              title="Reject"
              type="button"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleAnswerCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              title="Answer"
              type="button"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Active Call Interface
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{contactName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'calling' && 'Connecting...'}
            {callStatus === 'connecting' && 'Answering...'}
            {callStatus === 'connected' && callDuration}
          </p>
          {callStatus === 'connected' && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
            disabled={callStatus !== 'connected'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleHangup}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            title="Hang Up"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Ringtone audio element */}
      <audio id="ringtone" src="/media/tone.mp3" loop style={{ display: 'none' }}></audio>
    </div>,
    document.body
  );
};

export default CallInterface;

