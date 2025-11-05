import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
} from '../controllers/taskController';

const router = Router();

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Task routes
router.post('/', createTask);
router.get('/', getTasks);
router.get('/stats', getTaskStats); // Must be before /:id to avoid conflict
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.put('/:id/status', updateTaskStatus); // Special route for status updates
router.delete('/:id', deleteTask);

export default router;
