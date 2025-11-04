import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Tawasol CRM API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes (will be added incrementally)
app.get(`/api/${process.env.API_VERSION || 'v1'}`, (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Tawasol CRM API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Tawasol CRM Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, io };
