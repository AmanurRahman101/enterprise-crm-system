import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCustomerTicket,
  getCustomerTickets,
  getCustomerTicket,
  getCustomerCompanies,
  getAvailableCompanies,
} from '../controllers/customerTicketController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/customer/tickets
 * @desc    Create a new ticket as a customer
 * @access  Private (Customer only)
 */
router.post('/tickets', createCustomerTicket);

/**
 * @route   GET /api/customer/tickets
 * @desc    Get all tickets for the logged-in customer
 * @access  Private (Customer only)
 */
router.get('/tickets', getCustomerTickets);

/**
 * @route   GET /api/customer/tickets/:id
 * @desc    Get a specific ticket by ID
 * @access  Private (Customer only)
 */
router.get('/tickets/:id', getCustomerTicket);

/**
 * @route   GET /api/customer/companies
 * @desc    Get list of companies the customer has interacted with
 * @access  Private (Customer only)
 */
router.get('/companies', getCustomerCompanies);

/**
 * @route   GET /api/customer/available-companies
 * @desc    Get all available companies/organizations for creating tickets
 * @access  Private (Customer only)
 */
router.get('/available-companies', getAvailableCompanies);

export default router;
