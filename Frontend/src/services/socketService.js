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
  }

  // Initialize socket connection
  connect() {
    const token = ApiService.getToken();
    const user = ApiService.getUser();
    const currentOrg = ApiService.getCurrentOrganization();

    if (!token || !user || !currentOrg) {
      console.warn('Cannot connect socket: missing authentication data');
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    // Initialize socket with auth
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    // Connection successful
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;

      // Join organization room
      this.socket.emit('join_organization', {
        userId: user.userId,
        organizationId: currentOrg.id
      });

      // Emit to custom listeners
      this.emitToListeners('connected', { socketId: this.socket.id });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.connected = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
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
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('WebSocket disconnected manually');
    }
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

