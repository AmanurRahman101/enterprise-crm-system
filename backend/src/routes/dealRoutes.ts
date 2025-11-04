import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';
import {
  createDeal,
  getDeal,
  getDeals,
  updateDeal,
  moveDealStage,
  deleteDeal,
  getDealStats,
} from '../controllers/dealController';

const router = Router();

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Deal routes
router.post('/', createDeal);
router.get('/', getDeals);
router.get('/stats', getDealStats); // Must be before /:id to avoid conflict
router.get('/:id', getDeal);
router.put('/:id', updateDeal);
router.put('/:id/stage', moveDealStage); // Special route for stage transitions
router.delete('/:id', deleteDeal);

export default router;
