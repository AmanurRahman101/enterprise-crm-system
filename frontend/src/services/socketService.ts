import { io, Socket } from 'socket.io-client';

interface CallOffer {
  from: {
    userId: string;
    name: string;
    avatar?: string;
  };
  roomName: string;
  callType: 'AUDIO' | 'VIDEO';
}

interface CallAnswered {
  accepted: boolean;
  userId: string;
  roomName: string;
}

interface OnlineStatus {
  userId: string;
  online: boolean;
}

type CallOfferHandler = (data: CallOffer) => void;
type CallAnsweredHandler = (data: CallAnswered) => void;
type CallEndedHandler = (data: { userId: string }) => void;
type OnlineStatusHandler = (data: OnlineStatus) => void;
type AuthenticatedHandler = () => void;

/**
 * SocketService - Real-time communication service
 * Handles Socket.IO connection for call signaling and presence
 */
class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event handlers
  private onCallOfferHandlers: CallOfferHandler[] = [];
  private onCallAnsweredHandlers: CallAnsweredHandler[] = [];
  private onCallEndedHandlers: CallEndedHandler[] = [];
  private onUserOnlineStatusHandlers: OnlineStatusHandler[] = [];
  private onAuthenticatedHandlers: AuthenticatedHandler[] = [];

  constructor() {
    // Auto-detect backend URL
    const backendUrl = this.getBackendUrl();
    console.log('🔌 Initializing Socket.IO connection to:', backendUrl);

    this.socket = io(backendUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private getBackendUrl(): string {
    // Check if we're on network or localhost
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    } else {
      // Network access - use same hostname with backend port
      return `http://${hostname}:5000`;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Auto-authenticate if we have a token
      if (this.token) {
        this.authenticate(this.token);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('authenticated', () => {
      console.log('✅ Socket authenticated');
      this.onAuthenticatedHandlers.forEach((handler) => handler());
    });

    this.socket.on('auth-error', (data) => {
      console.error('❌ Socket authentication error:', data.message);
    });

    this.socket.on('incoming-call', (data: CallOffer) => {
      console.log('📞 Incoming call from:', data.from.name);
      this.onCallOfferHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('call-answered', (data: CallAnswered) => {
      console.log('📞 Call answered:', data.accepted ? 'Accepted' : 'Rejected');
      this.onCallAnsweredHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('call-ended', (data: { userId: string }) => {
      console.log('📞 Call ended by:', data.userId);
      this.onCallEndedHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('user-online-status', (data: OnlineStatus) => {
      this.onUserOnlineStatusHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('call-failed', (data: { reason: string; userId: string }) => {
      console.error('❌ Call failed:', data.reason);
      alert(`Call failed: ${data.reason}`);
    });
  }

  /**
   * Connect and authenticate with token
   */
  public connect(token: string): void {
    this.token = token;
    
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Authenticate with the server
   */
  public authenticate(token: string): void {
    if (this.socket) {
      this.socket.emit('authenticate', token);
    }
  }

  /**
   * Disconnect from socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.token = null;
  }

  /**
   * Send call offer to another user
   */
  public sendCallOffer(data: {
    to: { userId: string };
    from: { userId: string; name: string; avatar?: string };
    roomName: string;
    callType: 'AUDIO' | 'VIDEO';
  }): void {
    if (this.socket) {
      this.socket.emit('call-offer', data);
    }
  }

  /**
   * Answer a call (accept or reject)
   */
  public answerCall(data: {
    from: string;
    accepted: boolean;
    roomName: string;
  }): void {
    if (this.socket) {
      this.socket.emit('call-answer', data);
    }
  }

  /**
   * End an active call
   */
  public endCall(userId: string): void {
    if (this.socket) {
      this.socket.emit('call-end', { userId });
    }
  }

  /**
   * Check online status of users
   */
  public checkOnlineStatus(userIds: string[]): void {
    if (this.socket) {
      this.socket.emit('check-online-status', { userIds });
    }
  }

  // Event handler registration methods
  public onCallOffer(handler: CallOfferHandler): () => void {
    this.onCallOfferHandlers.push(handler);
    return () => {
      this.onCallOfferHandlers = this.onCallOfferHandlers.filter((h) => h !== handler);
    };
  }

  public onCallAnswered(handler: CallAnsweredHandler): () => void {
    this.onCallAnsweredHandlers.push(handler);
    return () => {
      this.onCallAnsweredHandlers = this.onCallAnsweredHandlers.filter((h) => h !== handler);
    };
  }

  public onCallEnded(handler: CallEndedHandler): () => void {
    this.onCallEndedHandlers.push(handler);
    return () => {
      this.onCallEndedHandlers = this.onCallEndedHandlers.filter((h) => h !== handler);
    };
  }

  public onUserOnlineStatus(handler: OnlineStatusHandler): () => void {
    this.onUserOnlineStatusHandlers.push(handler);
    return () => {
      this.onUserOnlineStatusHandlers = this.onUserOnlineStatusHandlers.filter((h) => h !== handler);
    };
  }

  public onAuthenticated(handler: AuthenticatedHandler): () => void {
    this.onAuthenticatedHandlers.push(handler);
    return () => {
      this.onAuthenticatedHandlers = this.onAuthenticatedHandlers.filter((h) => h !== handler);
    };
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
