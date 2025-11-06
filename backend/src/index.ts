import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import contactRoutes from './modules/contacts/contact.routes';
import userRoutes from './modules/users/user.routes';
import organizationRoutes from './modules/organization/organization.routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';
import { identifyOrganization } from './middleware/domain.middleware';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Domain identification middleware (runs on all requests)
app.use(identifyOrganization);

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/organization', authenticate, organizationRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
