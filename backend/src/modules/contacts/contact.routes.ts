import { Router } from 'express';
import contactController from './contact.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantIsolation } from '../../middleware/tenant.middleware';

const router = Router();

// Apply authentication and tenant isolation to all contact routes
router.use(authenticate);
router.use(tenantIsolation);

/**
 * @route   GET /api/contacts/stats
 * @desc    Get contact statistics
 * @access  Private
 */
router.get('/stats', (req, res, next) => {
  contactController.getContactStats(req as any, res).catch(next);
});

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts with optional filtering
 * @access  Private
 * @query   status, search, page, limit
 */
router.get('/', (req, res, next) => {
  contactController.getAllContacts(req as any, res).catch(next);
});

/**
 * @route   GET /api/contacts/:id
 * @desc    Get a single contact by ID
 * @access  Private
 */
router.get('/:id', (req, res, next) => {
  contactController.getContactById(req as any, res).catch(next);
});

/**
 * @route   POST /api/contacts
 * @desc    Create a new contact
 * @access  Private
 */
router.post('/', (req, res, next) => {
  contactController.createContact(req as any, res).catch(next);
});

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update a contact
 * @access  Private
 */
router.put('/:id', (req, res, next) => {
  contactController.updateContact(req as any, res).catch(next);
});

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete a contact
 * @access  Private
 */
router.delete('/:id', (req, res, next) => {
  contactController.deleteContact(req as any, res).catch(next);
});

export default router;
