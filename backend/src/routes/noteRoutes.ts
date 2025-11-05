import { Router } from 'express';
import {
  createNote,
  getNote,
  getNotes,
  updateNote,
  deleteNote,
  getNoteStats,
} from '../controllers/noteController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Note routes
router.post('/', createNote);
router.get('/', getNotes);
router.get('/stats', getNoteStats); // Stats route before /:id
router.get('/:id', getNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
