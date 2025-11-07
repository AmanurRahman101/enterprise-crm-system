import { Router } from 'express';
import { ContactController } from '../controllers/contactController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

/**
 * Contact Routes
 * Base path: /api/contacts
 * All routes require authentication and tenant identification
 */

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Contact CRUD operations
router.post('/', ContactController.createContact);
router.get('/', ContactController.getContacts);
router.get('/stats', ContactController.getContactStats);
router.get('/:id', ContactController.getContact);
router.put('/:id', ContactController.updateContact);
router.delete('/:id', ContactController.deleteContact);

export default router;
