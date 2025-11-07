import { Request, Response } from 'express';
import dealStageService from '../services/DealStageService';
import logger from '../utils/logger';

export const getStages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const stages = await dealStageService.getStages(req.tenant.id);
    res.json({ success: true, data: stages });
  } catch (error: any) {
    logger.error('Error fetching stages:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch stages' });
  }
};

export const getStage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const { id } = req.params;
    const stage = await dealStageService.getStageById(id, req.tenant.id);
    res.json({ success: true, data: stage });
  } catch (error: any) {
    logger.error('Error fetching stage:', error);
    const status = error.message === 'Stage not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const createStage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const { name, color, probability, isDefault, isWon, isLost } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    const stage = await dealStageService.createStage(req.tenant.id, { name, color, probability, isDefault, isWon, isLost });
    logger.info(`Stage created: ${stage.id} in tenant ${req.tenant.id}`);
    res.status(201).json({ success: true, data: stage });
  } catch (error: any) {
    logger.error('Error creating stage:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create stage' });
  }
};

export const updateStage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const { id } = req.params;
    const { name, color, probability, isDefault, isWon, isLost, isActive } = req.body;
    const stage = await dealStageService.updateStage(id, req.tenant.id, { name, color, probability, isDefault, isWon, isLost, isActive });
    logger.info(`Stage updated: ${id} in tenant ${req.tenant.id}`);
    res.json({ success: true, data: stage });
  } catch (error: any) {
    logger.error('Error updating stage:', error);
    const status = error.message === 'Stage not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const reorderStages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const { stageIds } = req.body;
    if (!stageIds || !Array.isArray(stageIds)) {
      res.status(400).json({ success: false, message: 'stageIds array is required' });
      return;
    }
    const stages = await dealStageService.reorderStages(req.tenant.id, stageIds);
    logger.info(`Stages reordered in tenant ${req.tenant.id}`);
    res.json({ success: true, data: stages });
  } catch (error: any) {
    logger.error('Error reordering stages:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reorder stages' });
  }
};

export const deleteStage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const { id } = req.params;
    const { migrateToStageId } = req.body;
    await dealStageService.deleteStage(id, req.tenant.id, migrateToStageId);
    logger.info(`Stage deleted: ${id} in tenant ${req.tenant.id}`);
    res.json({ success: true, message: 'Stage deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting stage:', error);
    const status = error.message === 'Stage not found' ? 404 : error.message.includes('has deals') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getStageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ success: false, message: 'Tenant identification required' });
      return;
    }
    const stats = await dealStageService.getStageStats(req.tenant.id);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Error fetching stage stats:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch stage statistics' });
  }
};
