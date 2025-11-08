import { Router } from 'express';
import { CallController } from '../controllers/callController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Apply authentication to all routes
router.use(authenticate);

// Apply tenant requirement to all routes
router.use(requireTenant);

/**
 * @route   POST /api/calls
 * @desc    Create a call log
 * @access  Private
 */
router.post('/', CallController.createCallLog);

/**
 * @route   GET /api/calls/contact/:contactId
 * @desc    Get call history for a contact
 * @access  Private
 */
router.get('/contact/:contactId', CallController.getCallHistoryForContact);

/**
 * @route   GET /api/calls/stats
 * @desc    Get call statistics
 * @access  Private
 */
router.get('/stats', CallController.getCallStats);

/**
 * @route   GET /api/calls/recent
 * @desc    Get recent calls for user
 * @access  Private
 */
router.get('/recent', CallController.getRecentCalls);

export default router;
