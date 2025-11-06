import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';
import {
  getStages,
  getStage,
  createStage,
  updateStage,
  reorderStages,
  deleteStage,
  getStageStats,
} from '../controllers/dealStageController';

const router = Router();

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Stage routes
router.get('/stats', getStageStats); // Must be before /:id to avoid conflict
router.put('/reorder', reorderStages); // Must be before /:id to avoid conflict
router.get('/', getStages);
router.post('/', createStage);
router.get('/:id', getStage);
router.put('/:id', updateStage);
router.delete('/:id', deleteStage);

export default router;
