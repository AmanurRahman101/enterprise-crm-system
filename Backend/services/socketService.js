// Socket.io Service
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.userId;
      socket.organizationId = decoded.currentOrganizationId;
      socket.userType = decoded.userType;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const organizationId = socket.organizationId;
    const room = `${userId}:${organizationId}`;
    socket.join(room);
    
    // Join organization room for presence updates (must be done before tracking)
    socket.join(`org:${organizationId}`);

    // Track user as online
    const wasOnline = onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    console.log(`User ${userId} connected to organization ${organizationId}`);

    // Notify organization members that user came online (only if wasn't already online)
    if (!wasOnline) {
      io.to(`org:${organizationId}`).emit('user_online', {
        userId,
        organizationId
      });
    }

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      
      // Remove socket from online users
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        
        // If no more sockets for this user, mark as offline
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          
          // Notify organization members that user went offline
          io.to(`org:${organizationId}`).emit('user_offline', {
            userId,
            organizationId
          });
        }
      }
    });
  });

  // Helper function to emit events to specific user:organization room
  const emitToRoom = (userId, organizationId, event, data) => {
    const room = `${userId}:${organizationId}`;
    io.to(room).emit(event, data);
  };

  // Helper function to emit to all users in an organization
  const emitToOrganization = (organizationId, event, data) => {
    io.to(`org:${organizationId}`).emit(event, { ...data, organizationId });
  };

  // Check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
  };

  // Get all online user IDs
  const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
  };

  return { 
    emitToRoom, 
    emitToOrganization,
    isUserOnline,
    getOnlineUsers
  };
};

