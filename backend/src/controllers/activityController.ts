import { Request, Response } from 'express';
import ActivityService from '../services/ActivityService';
import logger from '../utils/logger';

/**
 * Create a new activity
 */
export const createActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      type,
      subject,
      description,
      duration,
      outcome,
      recordingUrl,
      emailMessageId,
      metadata,
      contactId,
      dealId,
      ticketId,
      userId,
      occurredAt,
    } = req.body;

    // Validate required fields
    if (!type || !subject || !contactId) {
      return res.status(400).json({
        error: 'Missing required fields: type, subject, contactId',
      });
    }

    // Validate activity type
    const validTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const activity = await ActivityService.createActivity(tenant.id, {
      type,
      subject,
      description,
      duration,
      outcome,
      recordingUrl,
      emailMessageId,
      metadata,
      contactId,
      dealId,
      ticketId,
      userId: userId || user.userId,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
    });

    res.status(201).json(activity);
  } catch (error: any) {
    logger.error('Error in createActivity controller:', error);
    res.status(500).json({ error: error.message || 'Failed to create activity' });
  }
};

/**
 * Get activity by ID
 */
export const getActivity = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const activity = await ActivityService.getActivityById(tenant.id, id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error: any) {
    logger.error('Error in getActivity controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity' });
  }
};

/**
 * Get all activities with filters
 */
export const getActivities = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      page,
      limit,
      search,
      type,
      contactId,
      dealId,
      ticketId,
      userId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    // Handle "me" or "current" for userId filter
    let userIdFilter = userId as string | undefined;
    if (userIdFilter === 'me' || userIdFilter === 'current') {
      userIdFilter = user.userId;
    }

    const result = await ActivityService.getActivities(tenant.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      type: type as any,
      contactId: contactId as string,
      dealId: dealId as string,
      ticketId: ticketId as string,
      userId: userIdFilter,
      startDate: startDate as string,
      endDate: endDate as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Error in getActivities controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activities' });
  }
};

/**
 * Get activity feed - unified timeline
 */
export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page, limit, entityType, entityId, userId, startDate, endDate } = req.query;

    // Validate entityType if provided
    if (entityType) {
      const validTypes = ['contact', 'deal', 'ticket'];
      if (!validTypes.includes(entityType as string)) {
        return res.status(400).json({
          error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}`,
        });
      }
    }

    // Handle "me" or "current" for userId filter
    let userIdFilter = userId as string | undefined;
    if (userIdFilter === 'me' || userIdFilter === 'current') {
      userIdFilter = user.userId;
    }

    const result = await ActivityService.getActivityFeed(tenant.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      entityType: entityType as string,
      entityId: entityId as string,
      userId: userIdFilter,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Error in getActivityFeed controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity feed' });
  }
};

/**
 * Update activity
 */
export const updateActivity = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const {
      type,
      subject,
      description,
      duration,
      outcome,
      recordingUrl,
      emailMessageId,
      metadata,
      contactId,
      dealId,
      ticketId,
      userId,
      occurredAt,
    } = req.body;

    // Validate activity type if provided
    if (type) {
      const validTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}`,
        });
      }
    }

    const activity = await ActivityService.updateActivity(tenant.id, id, {
      type,
      subject,
      description,
      duration,
      outcome,
      recordingUrl,
      emailMessageId,
      metadata,
      contactId,
      dealId,
      ticketId,
      userId,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error: any) {
    logger.error('Error in updateActivity controller:', error);
    res.status(500).json({ error: error.message || 'Failed to update activity' });
  }
};

/**
 * Delete activity
 */
export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const activity = await ActivityService.deleteActivity(tenant.id, id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully', activity });
  } catch (error: any) {
    logger.error('Error in deleteActivity controller:', error);
    res.status(500).json({ error: error.message || 'Failed to delete activity' });
  }
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, startDate, endDate } = req.query;

    // Handle "me" or "current" for userId filter
    let userIdFilter = userId as string | undefined;
    if (userIdFilter === 'me' || userIdFilter === 'current') {
      userIdFilter = user.userId;
    }

    const stats = await ActivityService.getActivityStats(tenant.id, {
      userId: userIdFilter,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json(stats);
  } catch (error: any) {
    logger.error('Error in getActivityStats controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity stats' });
  }
};
