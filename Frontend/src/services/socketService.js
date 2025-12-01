// WebSocket Service using Socket.io Client
import { io } from 'socket.io-client';
import ApiService from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false; // Flag to prevent multiple simultaneous connections
  }

  // Initialize socket connection
  connect() {
    // Don't connect if already connected
    if (this.socket && this.socket.connected) {
      console.log('WebSocket already connected');
      return this.socket;
    }

    // Don't connect if already connecting
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return this.socket;
    }

    // Don't connect if max attempts reached (unless manually retrying)
    if (this.reconnectAttempts >= this.maxReconnectAttempts && this.socket === null) {
      console.warn('Max reconnection attempts reached. Use manual retry to reconnect.');
      return null;
    }

    const token = ApiService.getToken();
    const user = ApiService.getUser();
    const currentOrg = ApiService.getCurrentOrganization();

    if (!token || !user || !currentOrg) {
      console.warn('Cannot connect socket: missing authentication data');
      return null;
    }

    this.isConnecting = true;

    // Determine WebSocket URL - use same protocol and host as API URL
    let SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
    
    if (!SOCKET_URL) {
      // Use the API URL to determine socket URL (same host and protocol)
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        try {
          const url = new URL(apiUrl);
          SOCKET_URL = `${url.protocol}//${url.host}`;
        } catch (e) {
          console.warn('Invalid VITE_API_URL, using fallback');
        }
      }
      
      // Fallback: use current page protocol and hostname
      if (!SOCKET_URL) {
        const isHTTPS = window.location.protocol === 'https:';
        const protocol = isHTTPS ? 'https' : 'http';
        const hostname = window.location.hostname;
        const port = window.location.port || '3000';
        SOCKET_URL = `${protocol}://${hostname}:${port}`;
      }
    }

    console.log('🔌 Connecting to WebSocket:', SOCKET_URL);

    // Check if we should allow websocket upgrade
    // If protocol mismatch (HTTPS frontend, HTTP backend), disable websocket completely
    const socketProtocol = SOCKET_URL.startsWith('https://') ? 'wss' : 'ws';
    const pageProtocol = window.location.protocol;
    const isHTTPS = pageProtocol === 'https:';
    const isBackendHTTPS = SOCKET_URL.startsWith('https://');
    
    // Only allow websocket if both frontend and backend use the same protocol
    const allowWebsocketUpgrade = (isHTTPS && isBackendHTTPS) || (!isHTTPS && !isBackendHTTPS);
    
    if (!allowWebsocketUpgrade) {
      console.warn('⚠️ Protocol mismatch detected:');
      console.warn(`   Frontend: ${pageProtocol} (${isHTTPS ? 'HTTPS' : 'HTTP'})`);
      console.warn(`   Backend: ${isBackendHTTPS ? 'HTTPS' : 'HTTP'}`);
      console.warn('   Using polling only to avoid websocket upgrade errors');
    }

    // Initialize socket with auth
    // Completely disable websocket if protocols don't match
    const socketOptions = {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000, // 20 second timeout (longer for polling)
      forceNew: true, // Force new connection
      rememberUpgrade: false, // Don't remember upgrade preference
      autoConnect: true
    };

    // For HTTPS with self-signed certificates, use polling only to avoid WebSocket upgrade issues
    // WebSocket upgrades can fail with "Invalid frame header" errors with self-signed certs
    if (allowWebsocketUpgrade && isHTTPS && isBackendHTTPS) {
      // Try websocket, but fallback to polling if upgrade fails
      socketOptions.transports = ['polling', 'websocket'];
      socketOptions.upgrade = true;
      // Add longer timeout for HTTPS connections
      socketOptions.timeout = 30000;
    } else if (allowWebsocketUpgrade) {
      // HTTP to HTTP - websocket should work fine
      socketOptions.transports = ['polling', 'websocket'];
      socketOptions.upgrade = true;
    } else {
      // Completely disable websocket - use polling only
      socketOptions.transports = ['polling'];
      socketOptions.upgrade = false;
    }

    this.socket = io(SOCKET_URL, socketOptions);

    // Additional safety: prevent any websocket upgrade attempts when protocols don't match
    if (!allowWebsocketUpgrade) {
      // Block upgrade attempts at multiple levels
      const blockUpgrade = () => {
        if (this.socket && this.socket.io) {
          // Block at manager level
          if (this.socket.io.engine) {
            const engine = this.socket.io.engine;
            // Prevent upgrade by overriding the upgrade method
            if (engine.upgrade && typeof engine.upgrade === 'function') {
              const originalUpgrade = engine.upgrade.bind(engine);
              engine.upgrade = function(transport) {
                if (transport && (transport.name === 'websocket' || transport.constructor.name === 'WebSocket')) {
                  console.warn('⚠️ Blocked websocket upgrade due to protocol mismatch');
                  return false;
                }
                try {
                  return originalUpgrade(transport);
                } catch (e) {
                  console.warn('Upgrade blocked:', e.message);
                  return false;
                }
              };
            }
          }
          
          // Also prevent upgrade at the manager level
          if (this.socket.io.engine && this.socket.io.engine.transport) {
            const transport = this.socket.io.engine.transport;
            if (transport.on) {
              transport.on('upgrade', () => {
                console.warn('⚠️ Transport upgrade attempt blocked');
              });
            }
          }
        }
      };

      // Try to block immediately and also after connection
      setTimeout(blockUpgrade, 100);
      if (this.socket) {
        this.socket.on('connect', () => {
          blockUpgrade();
        });
      }
    }

    // Handle upgrade errors (polling to websocket) - suppress harmless errors with self-signed certs
    this.socket.io.on('upgradeError', (error) => {
      // Suppress "Invalid frame header" errors - common with self-signed certificates
      const errorMsg = error.message || String(error);
      if (errorMsg.includes('Invalid frame header') || 
          errorMsg.includes('websocket') ||
          errorMsg.includes('SSL') ||
          errorMsg.includes('certificate')) {
        // Silently ignore - polling will continue to work fine
        console.log('ℹ️ WebSocket upgrade skipped (using polling instead)');
        return;
      }
      console.warn('⚠️ WebSocket upgrade error:', errorMsg);
    });

    // Suppress engine-level upgrade errors
    if (this.socket.io.engine) {
      this.socket.io.engine.on('upgradeError', (error) => {
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('Invalid frame header')) {
          // Silently ignore - expected with protocol mismatch
          return;
        }
        console.warn('⚠️ Engine upgrade error:', errorMsg);
      });
    }

    // Suppress browser console errors for websocket upgrade failures
    // This is a workaround for the "Invalid frame header" error that appears in browser console
    const originalError = console.error;
    const suppressWebsocketErrors = (...args) => {
      const message = args.join(' ');
      if (message.includes('Invalid frame header') && message.includes('websocket')) {
        // Suppress this specific error - it's harmless when using polling
        return;
      }
      originalError.apply(console, args);
    };
    
    // Only suppress during connection attempt
    const restoreConsole = () => {
      if (console.error === suppressWebsocketErrors) {
        console.error = originalError;
      }
    };
    
    // Temporarily suppress during upgrade attempts
    if (!allowWebsocketUpgrade) {
      console.error = suppressWebsocketErrors;
      this.socket.on('connect', () => {
        setTimeout(restoreConsole, 2000);
      });
      setTimeout(restoreConsole, 5000); // Restore after 5 seconds anyway
    }

    // Connection successful
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected via', this.socket.io.engine.transport.name);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      // Join organization room
      this.socket.emit('join_organization', {
        userId: user.userId,
        organizationId: currentOrg.id
      });

      // Emit to custom listeners
      this.emitToListeners('connected', { socketId: this.socket.id });
    });

    // Handle transport upgrade
    this.socket.io.on('upgrade', () => {
      console.log('✅ Transport upgraded to:', this.socket.io.engine.transport.name);
    });

    // Handle upgrade errors (polling to websocket) - catch errors during transport upgrade
    this.socket.io.on('upgradeError', (error) => {
      console.warn('⚠️ WebSocket upgrade failed, staying on polling:', error.message || error);
      console.warn('💡 This is normal if there\'s a protocol mismatch (HTTPS frontend, HTTP backend)');
      // This is not critical - polling will continue to work
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.connected = false;
      this.isConnecting = false;
      this.reconnectAttempts++;

      // If WSS fails and we're using HTTPS, try falling back to HTTP
      if (this.reconnectAttempts === 1 && SOCKET_URL.startsWith('https://')) {
        console.warn('⚠️ HTTPS/WSS connection failed, this might be a protocol mismatch');
        console.warn('💡 Make sure backend supports HTTPS/WSS or use HTTP for both frontend and backend');
        console.warn('💡 If backend is HTTP, set VITE_API_URL=http://192.168.0.101:3000 in Frontend/.env');
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Stopping reconnection attempts.');
        console.error('💡 Check that:');
        console.error('   1. Backend server is running');
        console.error('   2. Backend protocol (HTTP/HTTPS) matches frontend');
        console.error('   3. VITE_SOCKET_URL or VITE_API_URL is correctly configured');
        console.error('   4. If using HTTPS frontend with HTTP backend, set VITE_API_URL to HTTP');
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        this.emitToListeners('max_reconnect_failed');
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.connected = false;
      this.emitToListeners('disconnected', { reason });
    });

    // Handle incoming events
    this.setupEventHandlers();

    return this.socket;
  }

  // Setup event handlers for incoming messages
  setupEventHandlers() {
    if (!this.socket) return;

    // New activity notification
    this.socket.on('new_activity', (data) => {
      console.log('📬 New activity:', data);
      this.emitToListeners('new_activity', data);
    });

    // Deal updated
    this.socket.on('deal_updated', (data) => {
      console.log('💼 Deal updated:', data);
      this.emitToListeners('deal_updated', data);
    });

    // Issue updated
    this.socket.on('issue_updated', (data) => {
      console.log('🐛 Issue updated:', data);
      this.emitToListeners('issue_updated', data);
    });

    // New notification
    this.socket.on('notification', (data) => {
      console.log('🔔 Notification:', data);
      this.emitToListeners('notification', data);
    });

    // Chatbot message
    this.socket.on('chatbot_message', (data) => {
      console.log('🤖 Chatbot message:', data);
      this.emitToListeners('chatbot_message', data);
    });

    // User joined organization
    this.socket.on('user_joined', (data) => {
      console.log('👋 User joined:', data);
      this.emitToListeners('user_joined', data);
    });

    // User left organization
    this.socket.on('user_left', (data) => {
      console.log('👋 User left:', data);
      this.emitToListeners('user_left', data);
    });

    // User came online (presence update)
    this.socket.on('user_online', (data) => {
      console.log('🟢 User came online:', data);
      this.emitToListeners('user_online', data);
    });

    // User went offline (presence update)
    this.socket.on('user_offline', (data) => {
      console.log('🔴 User went offline:', data);
      this.emitToListeners('user_offline', data);
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners(); // Remove all listeners to prevent reconnection
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.isConnecting = false;
      this.reconnectAttempts = 0; // Reset reconnection attempts
      console.log('WebSocket disconnected manually');
    }
  }

  // Manual retry connection (resets attempt counter)
  retryConnection() {
    this.reconnectAttempts = 0;
    this.disconnect();
    return this.connect();
  }

  // Check if connected
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit: Socket not connected');
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Remove listener
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit to custom listeners
  emitToListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Send chatbot message
  sendChatMessage(message) {
    this.emit('chat_message', { message });
  }

  // Join specific room
  joinRoom(roomName) {
    this.emit('join_room', { room: roomName });
  }

  // Leave specific room
  leaveRoom(roomName) {
    this.emit('leave_room', { room: roomName });
  }

  // Request missed notifications
  async fetchMissedNotifications(since) {
    try {
      const response = await ApiService.request(
        `/api/notifications/missed?since=${since}`
      );
      return response.notifications || [];
    } catch (error) {
      console.error('Error fetching missed notifications:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new SocketService();

