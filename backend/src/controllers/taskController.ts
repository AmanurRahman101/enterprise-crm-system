import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import logger from '../utils/logger';

const taskService = new TaskService();

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      contactId,
      dealId,
      assigneeId,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Use provided assigneeId or default to current user
    const taskAssigneeId = assigneeId || req.user.userId;

    const task = await taskService.createTask({
      tenantId: req.tenant.id,
      title,
      description,
      status,
      priority,
      dueDate,
      contactId,
      dealId,
      assigneeId: taskAssigneeId,
      creatorId: req.user.userId, // Current user is the creator
    });

    logger.info(`Task created: ${task.id} by user ${req.user.userId} in tenant ${req.tenant.id}`);
    res.status(201).json(task);
  } catch (error: any) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
};

/**
 * Get a single task by ID
 */
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const task = await taskService.getTaskById(id, req.tenant.id);
    res.json(task);
  } catch (error: any) {
    logger.error('Error fetching task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
};

/**
 * Get all tasks with pagination and filters
 */
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant || !req.user) {
      res.status(401).json({ error: 'Authentication and tenant identification required' });
      return;
    }

    const {
      status,
      priority,
      assigneeId,
      creatorId,
      contactId,
      dealId,
      dueDateFrom,
      dueDateTo,
      overdue,
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

    // Handle special "me" or "current" value for creatorId
    let effectiveCreatorId = creatorId as string;
    if (creatorId === 'me' || creatorId === 'current') {
      effectiveCreatorId = req.user.userId;
    }

    const filters = {
      status: status as any,
      priority: priority as any,
      assigneeId: effectiveAssigneeId,
      creatorId: effectiveCreatorId,
      contactId: contactId as string,
      dealId: dealId as string,
      dueDateFrom: dueDateFrom as string,
      dueDateTo: dueDateTo as string,
      overdue: overdue === 'true',
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await taskService.getTasks(req.tenant.id, filters);
    res.json(result);
  } catch (error: any) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

/**
 * Update a task
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      contactId,
      dealId,
      assigneeId,
    } = req.body;

    const task = await taskService.updateTask(id, req.tenant.id, {
      title,
      description,
      status,
      priority,
      dueDate,
      contactId,
      dealId,
      assigneeId,
    });

    logger.info(`Task updated: ${id} in tenant ${req.tenant.id}`);
    res.json(task);
  } catch (error: any) {
    logger.error('Error updating task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update task' });
    }
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
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

    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const task = await taskService.updateTaskStatus(id, req.tenant.id, status);

    logger.info(`Task ${id} status updated to ${status} in tenant ${req.tenant.id}`);
    res.json(task);
  } catch (error: any) {
    logger.error('Error updating task status:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update task status' });
    }
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant identification required' });
      return;
    }

    const { id } = req.params;

    const result = await taskService.deleteTask(id, req.tenant.id);

    logger.info(`Task deleted: ${id} in tenant ${req.tenant.id}`);
    res.json(result);
  } catch (error: any) {
    logger.error('Error deleting task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};

/**
 * Get task statistics
 */
export const getTaskStats = async (req: Request, res: Response): Promise<void> => {
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

    const stats = await taskService.getTaskStats(req.tenant.id, effectiveUserId);
    res.json(stats);
  } catch (error: any) {
    logger.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
};
