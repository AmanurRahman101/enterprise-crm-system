import React, { useEffect, useState } from 'react';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface IncomingCallProps {
  callerName: string;
  callerAvatar?: string;
  callType: 'AUDIO' | 'VIDEO';
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCall: React.FC<IncomingCallProps> = ({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
}) => {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // Play ringtone (browser's default notification sound)
    const playRingtone = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    };

    // Ring every second
    const ringtoneInterval = setInterval(() => {
      if (isRinging) {
        playRingtone();
      }
    }, 1000);

    return () => {
      clearInterval(ringtoneInterval);
      setIsRinging(false);
    };
  }, [isRinging]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-pulse-slow">
        {/* Caller Info */}
        <div className="text-center">
          {/* Avatar */}
          <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-6 shadow-lg">
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-white">
                {callerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Caller Name */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {callerName}
          </h2>

          {/* Call Type */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {callType === 'VIDEO' ? (
              <>
                <VideoCameraIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Incoming Video Call
                </p>
              </>
            ) : (
              <>
                <PhoneIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Incoming Voice Call
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-6">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="group relative"
              aria-label="Reject call"
            >
              <div className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95">
                <XMarkIcon className="h-10 w-10 text-white" />
              </div>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Decline
              </span>
            </button>

            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="group relative"
              aria-label="Accept call"
            >
              <div className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95 animate-pulse">
                <PhoneIcon className="h-10 w-10 text-white" />
              </div>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Accept
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
