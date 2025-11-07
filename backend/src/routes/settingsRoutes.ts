import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant identification and authentication to all routes
router.use(tenantMiddleware);
router.use(authenticate);

/**
 * GET /api/settings/general
 * Get general tenant settings
 */
router.get('/general', SettingsController.getGeneralSettings);

/**
 * PUT /api/settings/general
 * Update general tenant settings
 */
router.put('/general', SettingsController.updateGeneralSettings);

export default router;
