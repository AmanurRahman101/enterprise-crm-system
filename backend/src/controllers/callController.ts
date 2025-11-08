import { Request, Response } from 'express';
import CallService from '../services/CallService';
import logger from '../utils/logger';

export class CallController {
  /**
   * Create a call log
   */
  static async createCallLog(req: Request, res: Response): Promise<void> {
    try {
      const { contactId, duration, callType, status, direction, roomName, notes } = req.body;
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;

      if (!contactId || duration === undefined) {
        res.status(400).json({
          success: false,
          message: 'Contact ID and duration are required',
        });
        return;
      }

      const callLog = await CallService.createCallLog({
        contactId,
        userId,
        tenantId,
        duration,
        callType: callType || 'AUDIO',
        status: status || 'COMPLETED',
        direction: direction || 'OUTBOUND',
        roomName,
        notes,
      });

      logger.info(`Call log created: ${callLog.id}`);

      res.status(201).json({
        success: true,
        message: 'Call log created successfully',
        data: callLog,
      });
    } catch (error: any) {
      logger.error('Create call log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create call log',
        error: error.message,
      });
    }
  }

  /**
   * Get call history for a contact
   */
  static async getCallHistoryForContact(req: Request, res: Response): Promise<void> {
    try {
      const { contactId } = req.params;
      const tenantId = (req as any).tenantId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const calls = await CallService.getCallHistoryForContact(contactId, tenantId, limit);

      res.json({
        success: true,
        data: calls,
      });
    } catch (error: any) {
      logger.error('Get call history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get call history',
        error: error.message,
      });
    }
  }

  /**
   * Get call statistics
   */
  static async getCallStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const { startDate, endDate } = req.query;

      const stats = await CallService.getCallStats(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get call stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get call statistics',
        error: error.message,
      });
    }
  }

  /**
   * Get recent calls for user
   */
  static async getRecentCalls(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const calls = await CallService.getRecentCallsForUser(userId, tenantId, limit);

      res.json({
        success: true,
        data: calls,
      });
    } catch (error: any) {
      logger.error('Get recent calls error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent calls',
        error: error.message,
      });
    }
  }
}
