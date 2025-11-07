import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * SettingsController - Handles tenant settings endpoints
 */
export class SettingsController {
  /**
   * Get general settings
   * GET /api/settings/general
   */
  static async getGeneralSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(400).json({
          success: false,
          message: 'Tenant identification required'
        });
        return;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenant.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          timezone: true,
          logo: true,
          settings: true,
        }
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error: any) {
      logger.error('Error fetching general settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message
      });
    }
  }

  /**
   * Update general settings
   * PUT /api/settings/general
   */
  static async updateGeneralSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(400).json({
          success: false,
          message: 'Tenant identification required'
        });
        return;
      }

      const { name, email, phone, timezone, logo, settings } = req.body;

      // Validate required fields
      if (!name || !email) {
        res.status(400).json({
          success: false,
          message: 'Company name and email are required'
        });
        return;
      }

      // Update tenant settings
      const updatedTenant = await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: {
          name,
          email,
          phone: phone || null,
          timezone: timezone || 'UTC',
          logo: logo || null,
          settings: settings || {},
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          timezone: true,
          logo: true,
          settings: true,
        }
      });

      logger.info(`Settings updated for tenant: ${req.tenant.name}`);

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedTenant
      });
    } catch (error: any) {
      logger.error('Error updating general settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  }
}
