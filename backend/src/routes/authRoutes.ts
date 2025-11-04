import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { getMyTenants, switchTenant } from '../controllers/authController';
import { authenticate, validateRefreshToken } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 * All routes require tenant identification via:
 * - X-Tenant-Subdomain header (e.g., "acme")
 * - X-Tenant-ID header
 * - Host subdomain (e.g., acme.tawasol.com)
 */

// Apply tenant middleware to all auth routes
router.use(tenantMiddleware);

// Public routes (require tenant)
router.post('/register', requireTenant, AuthController.register);
router.post('/login', requireTenant, AuthController.login);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes (require authentication + tenant)
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

// Cross-tenant routes (don't require tenant middleware)
router.get('/my-tenants', authenticate, getMyTenants);
router.post('/switch-tenant', authenticate, switchTenant);

export default router;
