import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService';
import logger from '../utils/logger';

const ticketService = new TicketService();

/**
 * Create a new ticket
 */
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const {
      subject,
      description,
      status,
      priority,
      category,
      source,
      tags,
      slaDeadline,
      contactId,
      assigneeId,
    } = req.body;

    if (!subject) {
      res.status(400).json({ error: 'Subject is required' });
      return;
    }

    if (!description) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }

    if (!contactId) {
      res.status(400).json({ error: 'Contact ID is required' });
      return;
    }

    const ticket = await ticketService.createTicket({
      tenantId: req.tenant.id,
      subject,
      description,
      status,
      priority,
      category,
      source,
      tags,
      slaDeadline,
      contactId,
      assigneeId,
    });

    logger.info(`Ticket created: ${ticket.ticketNumber} by user ${req.user.userId} in tenant ${req.tenant.id}`);
    res.status(201).json(ticket);
  } catch (error: any) {
    logger.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message || 'Failed to create ticket' });
  }
};

/**
 * Get a single ticket by ID
 */
export const getTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const ticket = await ticketService.getTicketById(id, req.tenant.id);
    res.json(ticket);
  } catch (error: any) {
    logger.error('Error fetching ticket:', error);
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  }
};

/**
 * Get a ticket by ticket number
 */
export const getTicketByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { number } = req.params;
    const ticketNumber = parseInt(number, 10);

    if (isNaN(ticketNumber)) {
      res.status(400).json({ error: 'Invalid ticket number' });
      return;
    }

    const ticket = await ticketService.getTicketByNumber(ticketNumber, req.tenant.id);
    res.json(ticket);
  } catch (error: any) {
    logger.error('Error fetching ticket by number:', error);
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  }
};

/**
 * Get all tickets with pagination and filters
 */
export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const {
      status,
      priority,
      category,
      source,
      assigneeId,
      contactId,
      tags,
      slaPast,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    // Handle special "me" or "current" value for assigneeId
    let effectiveAssigneeId = assigneeId as string;
    if (assigneeId === 'me' || assigneeId === 'current') {
      effectiveAssigneeId = req.user.userId;
    }

    const filters = {
      status: status as any,
      priority: priority as any,
      category: category as string,
      source: source as string,
      assigneeId: effectiveAssigneeId,
      contactId: contactId as string,
      tags: tags as string,
      slaPast: slaPast === 'true',
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await ticketService.getTickets(req.tenant.id, filters);
    res.json(result);
  } catch (error: any) {
    logger.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

/**
 * Update a ticket
 */
export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const {
      subject,
      description,
      status,
      priority,
      category,
      source,
      tags,
      slaDeadline,
      contactId,
      assigneeId,
    } = req.body;

    const ticket = await ticketService.updateTicket(id, req.tenant.id, {
      subject,
      description,
      status,
      priority,
      category,
      source,
      tags,
      slaDeadline,
      contactId,
      assigneeId,
    });

    logger.info(`Ticket updated: ${id} in tenant ${req.tenant.id}`);
    res.json(ticket);
  } catch (error: any) {
    logger.error('Error updating ticket:', error);
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update ticket' });
    }
  }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const ticket = await ticketService.updateTicketStatus(id, req.tenant.id, status);

    logger.info(`Ticket ${id} status updated to ${status} in tenant ${req.tenant.id}`);
    res.json(ticket);
  } catch (error: any) {
    logger.error('Error updating ticket status:', error);
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update ticket status' });
    }
  }
};

/**
 * Delete a ticket
 */
export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const result = await ticketService.deleteTicket(id, req.tenant.id);

    logger.info(`Ticket deleted: ${id} in tenant ${req.tenant.id}`);
    res.json(result);
  } catch (error: any) {
    logger.error('Error deleting ticket:', error);
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete ticket' });
    }
  }
};

/**
 * Get ticket statistics
 */
export const getTicketStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const { userId } = req.query;

    // Handle special "me" or "current" value for userId
    let effectiveUserId: string | undefined;
    if (userId === 'me' || userId === 'current') {
      effectiveUserId = req.user.userId;
    } else if (userId) {
      effectiveUserId = userId as string;
    }

    const stats = await ticketService.getTicketStats(req.tenant.id, effectiveUserId);
    res.json(stats);
  } catch (error: any) {
    logger.error('Error fetching ticket stats:', error);
    res.status(500).json({ error: 'Failed to fetch ticket statistics' });
  }
};
