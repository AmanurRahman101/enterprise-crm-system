// Socket.io Service
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');

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
    const room = `${socket.userId}:${socket.organizationId}`;
    socket.join(room);

    console.log(`User ${socket.userId} connected to organization ${socket.organizationId}`);

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  // Helper function to emit events to specific user:organization room
  const emitToRoom = (userId, organizationId, event, data) => {
    const room = `${userId}:${organizationId}`;
    io.to(room).emit(event, data);
  };

  // Helper function to emit to all users in an organization
  const emitToOrganization = (organizationId, event, data) => {
    io.emit(event, { ...data, organizationId });
  };

  return { emitToRoom, emitToOrganization };
};

