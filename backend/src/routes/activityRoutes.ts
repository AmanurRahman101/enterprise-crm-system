import { Router } from 'express';
import {
  createActivity,
  getActivity,
  getActivities,
  getActivityFeed,
  updateActivity,
  deleteActivity,
  getActivityStats,
} from '../controllers/activityController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Activity routes
router.post('/', createActivity);
router.get('/', getActivities);
router.get('/stats', getActivityStats); // Stats route before /:id
router.get('/feed', getActivityFeed); // Feed route before /:id
router.get('/:id', getActivity);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
