import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  reactivateUser,
  getUserStats,
  getTeamMembers,
  getUserActivity,
  getProfile,
  updateProfile,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  approveUser,
  rejectUser
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

/**
 * User Management Routes
 * Base path: /api/users
 * 
 * Admin-only routes for managing users within a tenant
 * All routes require authentication and tenant context
 */

// Apply tenant and authentication middleware to all routes
router.use(tenantMiddleware);
router.use(requireTenant);
router.use(authenticate);

/**
 * Public team member endpoint (all authenticated users can access)
 * Used for assignment dropdowns in contacts, deals, tasks, tickets
 */
router.get('/team', getTeamMembers);

/**
 * User profile routes (current user can access their own profile)
 */
// Get current user's profile
router.get('/profile', getProfile);

// Update current user's profile
router.put('/profile', updateProfile);

// Change current user's password
router.put('/password', changePassword);

// Get notification preferences
router.get('/notifications', getNotificationPreferences);

// Update notification preferences
router.put('/notifications', updateNotificationPreferences);

/**
 * Admin-only routes
 * Require ADMIN or MANAGER role
 */

// Get user statistics
router.get('/stats', authorize('ADMIN', 'MANAGER'), getUserStats);

// List all users with filters
router.get('/', authorize('ADMIN', 'MANAGER'), getUsers);

// Get specific user details
router.get('/:id', authorize('ADMIN', 'MANAGER'), getUserById);

// Update user
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateUser);

// Deactivate user
router.post('/:id/deactivate', authorize('ADMIN', 'MANAGER'), deactivateUser);

// Reactivate user
router.post('/:id/reactivate', authorize('ADMIN', 'MANAGER'), reactivateUser);

// Approve pending user (Admin only)
router.post('/:id/approve', authorize('ADMIN'), approveUser);

// Reject pending user (Admin only)
router.post('/:id/reject', authorize('ADMIN'), rejectUser);

// Get user activity summary
router.get('/:id/activity', authorize('ADMIN', 'MANAGER'), getUserActivity);

export default router;
