import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, validateRefreshToken } from '../middleware/auth';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes (require authentication)
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
