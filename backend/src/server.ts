import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { SocketService } from './services/SocketService';
import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import companyRoutes from './routes/companyRoutes';
import dealRoutes from './routes/dealRoutes';
import dealStageRoutes from './routes/dealStageRoutes';
import taskRoutes from './routes/taskRoutes';
import ticketRoutes from './routes/ticketRoutes';
import settingsRoutes from './routes/settingsRoutes';
import activityRoutes from './routes/activityRoutes';
import noteRoutes from './routes/noteRoutes';
import userRoutes from './routes/userRoutes';
import callRoutes from './routes/callRoutes';
import tenantRoutes from './routes/tenantRoutes';
import customerRoutes from './routes/customerRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);

// Helper function to get network IP
function getNetworkIP(): string {
  const nets = require('os').networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Build allowed origins list
const networkIP = getNetworkIP();
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  `http://${networkIP}:3000`
];

logger.info(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);

// CORS configuration function
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked origin: ${origin}`);
      logger.warn(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, true); // Still allow in development, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'X-Tenant-Subdomain', 'X-Tenant-ID']
};

// Initialize Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: corsOptions
});

// Initialize Socket.IO service for call signaling
const socketService = new SocketService(io);
logger.info('✅ Socket.IO call signaling service initialized');

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Tawasol CRM API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes (will be added incrementally)
app.get(`/api/${process.env.API_VERSION || 'v1'}`, (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Tawasol CRM API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/docs'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Contact management routes
app.use('/api/contacts', contactRoutes);

// Company management routes
app.use('/api/companies', companyRoutes);

// Deal pipeline management routes
app.use('/api/deals', dealRoutes);

// Deal stage management routes (custom stages)
app.use('/api/deal-stages', dealStageRoutes);

// Task management routes
app.use('/api/tasks', taskRoutes);

// Ticket system routes
app.use('/api/tickets', ticketRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// Activity logging routes
app.use('/api/activities', activityRoutes);

// Note management routes
app.use('/api/notes', noteRoutes);

// User management routes
app.use('/api/users', userRoutes);

// Call/VoIP routes
app.use('/api/calls', callRoutes);

// Tenant routes (public)
app.use('/api/tenants', tenantRoutes);

// Customer routes (authenticated customers)
app.use('/api/customer', customerRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
// (Handled by SocketService)

// Start server
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 Tawasol CRM Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Accessible at: http://localhost:${PORT} and http://<your-ip>:${PORT}`);
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

export { app, io, socketService };
