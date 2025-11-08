import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import { AuthUtils } from '../utils/auth';
import { prisma } from '../config/database';

interface OnlineUser {
  userId: string;
  socketId: string;
  tenantId: string | null;
  email: string;
  name: string;
}

interface CallOffer {
  from: {
    userId: string;
    name: string;
    avatar?: string;
  };
  to: {
    userId: string;
  };
  roomName: string;
  callType: 'AUDIO' | 'VIDEO';
}

/**
 * SocketService - Handles real-time Socket.IO connections
 */
export class SocketService {
  private io: Server;
  private onlineUsers: Map<string, OnlineUser> = new Map(); // userId -> user info
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = AuthUtils.verifyAccessToken(token);
          const userId = decoded.userId;

          // Fetch user details from database
          const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              tenantId: true,
            },
          });

          if (!userRecord) {
            socket.emit('auth-error', { message: 'User not found' });
            return;
          }

          // Store user info
          const user = {
            userId,
            socketId: socket.id,
            tenantId: decoded.tenantId || null,
            email: decoded.email,
            name: `${userRecord.firstName} ${userRecord.lastName}`,
          };

          this.onlineUsers.set(userId, user);
          this.userSockets.set(userId, socket.id);

          socket.data.userId = userId;
          socket.data.user = user;

          logger.info(`User authenticated: ${userId} (${user.name})`);

          // Notify user they're online
          socket.emit('authenticated', { userId, online: true });

          // Broadcast online status to relevant users
          this.broadcastOnlineStatus(userId, true);
        } catch (error) {
          logger.error('Socket authentication error:', error);
          socket.emit('auth-error', { message: 'Authentication failed' });
        }
      });

      // Handle call offer (User A wants to call User B)
      socket.on('call-offer', (data: CallOffer) => {
        const targetSocketId = this.userSockets.get(data.to.userId);

        if (targetSocketId) {
          logger.info(
            `Call offer from ${data.from.userId} to ${data.to.userId} (${data.callType})`
          );

          // Send call offer to target user
          this.io.to(targetSocketId).emit('incoming-call', {
            from: data.from,
            roomName: data.roomName,
            callType: data.callType,
          });
        } else {
          // Target user is offline
          socket.emit('call-failed', {
            reason: 'User is offline',
            userId: data.to.userId,
          });
        }
      });

      // Handle call answer (User B accepts the call)
      socket.on('call-answer', (data: { from: string; accepted: boolean; roomName: string }) => {
        const callerSocketId = this.userSockets.get(data.from);

        if (callerSocketId) {
          logger.info(`Call ${data.accepted ? 'accepted' : 'rejected'} by ${socket.data.userId}`);

          this.io.to(callerSocketId).emit('call-answered', {
            accepted: data.accepted,
            userId: socket.data.userId,
            roomName: data.roomName,
          });
        }
      });

      // Handle call end
      socket.on('call-end', (data: { userId: string }) => {
        const targetSocketId = this.userSockets.get(data.userId);

        if (targetSocketId) {
          logger.info(`Call ended by ${socket.data.userId}`);
          this.io.to(targetSocketId).emit('call-ended', {
            userId: socket.data.userId,
          });
        }
      });

      // Check if user is online
      socket.on('check-online-status', (data: { userIds: string[] }) => {
        const onlineStatuses = data.userIds.map((userId) => ({
          userId,
          online: this.onlineUsers.has(userId),
        }));

        socket.emit('online-statuses', onlineStatuses);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = socket.data.userId;

        if (userId) {
          logger.info(`User disconnected: ${userId}`);
          this.onlineUsers.delete(userId);
          this.userSockets.delete(userId);

          // Broadcast offline status
          this.broadcastOnlineStatus(userId, false);
        }
      });
    });
  }

  /**
   * Broadcast online status to relevant users
   */
  private broadcastOnlineStatus(userId: string, online: boolean): void {
    // Broadcast to all connected sockets
    // In a production app, you'd want to filter this to only relevant users
    this.io.emit('user-online-status', {
      userId,
      online,
    });
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get all online users
   */
  public getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Send notification to specific user
   */
  public sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }

    return false;
  }
}
