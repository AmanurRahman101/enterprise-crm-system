import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';
import {
  createTicket,
  getTicket,
  getTicketByNumber,
  getTickets,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  getTicketStats,
} from '../controllers/ticketController';

const router = Router();

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Ticket routes
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/stats', getTicketStats); // Must be before /:id to avoid conflict
router.get('/number/:number', getTicketByNumber); // Get by ticket number
router.get('/:id', getTicket);
router.put('/:id', updateTicket);
router.put('/:id/status', updateTicketStatus); // Special route for status updates
router.delete('/:id', deleteTicket);

export default router;
