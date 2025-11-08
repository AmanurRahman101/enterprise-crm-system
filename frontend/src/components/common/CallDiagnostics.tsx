import React, { useEffect, useState } from 'react';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';

/**
 * CallDiagnostics - Debug component for testing call functionality
 * Add this to your page temporarily to see socket status
 */
export const CallDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    // Check connection status
    const interval = setInterval(() => {
      setSocketConnected(socketService.isConnected());
    }, 1000);

    // Listen for authentication
    const unsubAuth = socketService.onAuthenticated(() => {
      setAuthenticated(true);
      setLastEvent('✅ Socket authenticated');
    });

    // Listen for all call events
    const unsubOffer = socketService.onCallOffer((data) => {
      setLastEvent(`📞 Incoming call from ${data.from.name}`);
    });

    const unsubAnswer = socketService.onCallAnswered((data) => {
      setLastEvent(`📞 Call ${data.accepted ? 'accepted' : 'rejected'}`);
    });

    const unsubEnd = socketService.onCallEnded((data) => {
      setLastEvent(`📞 Call ended by ${data.userId}`);
    });

    return () => {
      clearInterval(interval);
      unsubAuth();
      unsubOffer();
      unsubAnswer();
      unsubEnd();
    };
  }, []);

  const testCallOffer = () => {
    if (!user) {
      alert('You must be logged in');
      return;
    }

    // Send a test call offer to yourself (for testing)
    socketService.sendCallOffer({
      to: { userId: user.id },
      from: {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar || undefined,
      },
      roomName: `test-room-${Date.now()}`,
      callType: 'AUDIO',
    });

    setLastEvent('📤 Test call offer sent');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-lg shadow-xl p-4 z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
        🔍 Call Diagnostics
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">User:</span>
          <span className={`font-medium ${user ? 'text-green-600' : 'text-red-600'}`}>
            {user ? `${user.firstName} ${user.lastName}` : '❌ Not logged in'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Socket:</span>
          <span className={`font-medium ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
            {socketConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Authenticated:</span>
          <span className={`font-medium ${authenticated ? 'text-green-600' : 'text-yellow-600'}`}>
            {authenticated ? '✅ Yes' : '⏳ Waiting...'}
          </span>
        </div>

        {lastEvent && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
            <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
              Last Event:
            </div>
            <div className="text-blue-600 dark:text-blue-400">{lastEvent}</div>
          </div>
        )}

        <button
          onClick={testCallOffer}
          disabled={!socketConnected || !authenticated}
          className="mt-3 w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          Test Call (to self)
        </button>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <p className="font-semibold mb-1">Expected Flow:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Socket connects</li>
            <li>Socket authenticates</li>
            <li>Click "Test Call" → See incoming call popup</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
