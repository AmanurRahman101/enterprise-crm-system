import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { getMyTenants, switchTenant } from '../controllers/authController';
import { authenticate, validateRefreshToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 * 
 * Business routes require tenant identification via:
 * - X-Tenant-Subdomain header (e.g., "acme")
 * - X-Tenant-ID header
 * - Host subdomain (e.g., acme.tawasol.com)
 * 
 * Customer routes do NOT require tenant
 */

// Apply tenant middleware to all auth routes (but don't require it yet)
router.use(tenantMiddleware);

// Public routes - check isCustomer flag to determine if tenant is required
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
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
