import { Request, Response } from 'express';
import { DealService } from '../services/DealService';
import logger from '../utils/logger';

const dealService = new DealService();

/**
 * Create a new deal
 */
export const createDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const {
      title,
      value,
      currency,
      stage,
      probability,
      priority,
      source,
      description,
      expectedCloseDate,
      contactId,
      companyId,
      ownerId,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (value === undefined || value === null) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    if (!contactId) {
      res.status(400).json({ error: 'Contact ID is required' });
      return;
    }

    // Use provided ownerId or default to current user
    const dealOwnerId = ownerId || req.user.userId;

    const deal = await dealService.createDeal({
      tenantId: req.tenant.id,
      title,
      value,
      currency,
      stage,
      probability,
      priority,
      source,
      description,
      expectedCloseDate,
      contactId,
      companyId,
      ownerId: dealOwnerId,
    });

    logger.info(`Deal created: ${deal.id} by user ${req.user.userId} in tenant ${req.tenant.id}`);
    res.status(201).json(deal);
  } catch (error: any) {
    logger.error('Error creating deal:', error);
    res.status(500).json({ error: error.message || 'Failed to create deal' });
  }
};

/**
 * Get a single deal by ID
 */
export const getDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const deal = await dealService.getDealById(id, req.tenant.id);
    res.json(deal);
  } catch (error: any) {
    logger.error('Error fetching deal:', error);
    if (error.message === 'Deal not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  }
};

/**
 * Get all deals with pagination and filters
 */
export const getDeals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const {
      stage,
      ownerId,
      contactId,
      companyId,
      priority,
      minValue,
      maxValue,
      expectedCloseDateFrom,
      expectedCloseDateTo,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    // Handle special "me" or "current" value for ownerId
    let effectiveOwnerId = ownerId as string;
    if (ownerId === 'me' || ownerId === 'current') {
      effectiveOwnerId = req.user.userId;
    }

    const filters = {
      stage: stage as any,
      ownerId: effectiveOwnerId,
      contactId: contactId as string,
      companyId: companyId as string,
      priority: priority as any,
      minValue: minValue ? parseFloat(minValue as string) : undefined,
      maxValue: maxValue ? parseFloat(maxValue as string) : undefined,
      expectedCloseDateFrom: expectedCloseDateFrom as string,
      expectedCloseDateTo: expectedCloseDateTo as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await dealService.getDeals(req.tenant.id, filters);
    res.json(result);
  } catch (error: any) {
    logger.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
};

/**
 * Update a deal
 */
export const updateDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const {
      title,
      value,
      currency,
      stage,
      probability,
      priority,
      source,
      description,
      expectedCloseDate,
      contactId,
      companyId,
      ownerId,
      lostReason,
    } = req.body;

    const deal = await dealService.updateDeal(id, req.tenant.id, {
      title,
      value,
      currency,
      stage,
      probability,
      priority,
      source,
      description,
      expectedCloseDate,
      contactId,
      companyId,
      ownerId,
      lostReason,
    });

    logger.info(`Deal updated: ${id} in tenant ${req.tenant.id}`);
    res.json(deal);
  } catch (error: any) {
    logger.error('Error updating deal:', error);
    if (error.message === 'Deal not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update deal' });
    }
  }
};

/**
 * Move deal to a new stage
 */
export const moveDealStage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;
    const { stage, lostReason } = req.body;

    if (!stage) {
      res.status(400).json({ error: 'Stage is required' });
      return;
    }

    const validStages = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    if (!validStages.includes(stage)) {
      res.status(400).json({ error: 'Invalid stage' });
      return;
    }

    const deal = await dealService.moveDealStage(id, req.tenant.id, stage, lostReason);

    logger.info(`Deal ${id} moved to stage ${stage} in tenant ${req.tenant.id}`);
    res.json(deal);
  } catch (error: any) {
    logger.error('Error moving deal stage:', error);
    if (error.message === 'Deal not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to move deal stage' });
    }
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const result = await dealService.deleteDeal(id, req.tenant.id);

    logger.info(`Deal deleted: ${id} in tenant ${req.tenant.id}`);
    res.json(result);
  } catch (error: any) {
    logger.error('Error deleting deal:', error);
    if (error.message === 'Deal not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  }
};

/**
 * Get deal statistics
 */
export const getDealStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const stats = await dealService.getDealStats(req.tenant.id);
    res.json(stats);
  } catch (error: any) {
    logger.error('Error fetching deal stats:', error);
    res.status(500).json({ error: 'Failed to fetch deal statistics' });
  }
};
