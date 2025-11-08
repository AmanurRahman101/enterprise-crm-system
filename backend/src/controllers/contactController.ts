import { Request, Response } from 'express';
import { ContactService } from '../services/ContactService';
import logger from '../utils/logger';

const contactService = new ContactService();

/**
 * ContactController - Handles contact management endpoints
 */
export class ContactController {
  /**
   * Create a new contact
   * POST /api/contacts
   */
  static async createContact(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication and tenant identification required',
        });
        return;
      }

      const {
        companyId,
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        address,
        city,
        state,
        country,
        postalCode,
        website,
        linkedIn,
        twitter,
        facebook,
        tags,
      } = req.body;

      // Validation
      if (!firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'First name and last name are required',
        });
        return;
      }

      const contact = await contactService.createContact({
        tenantId: req.tenant.id,
        companyId,
        ownerId: req.user.userId, // Current user becomes owner
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        address,
        city,
        state,
        country,
        postalCode,
        website,
        linkedIn,
        twitter,
        facebook,
        tags,
      });

      logger.info(`Contact created: ${contact.firstName} ${contact.lastName} by user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        data: contact,
      });
    } catch (error) {
      logger.error('Create contact error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create contact',
      });
    }
  }

  /**
   * Get contact by ID
   * GET /api/contacts/:id
   */
  static async getContact(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const { id } = req.params;

      const contact = await contactService.getContactById(req.tenant.id, id);

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      logger.error('Get contact error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get contact',
      });
    }
  }

  /**
   * Get all contacts with pagination and filters
   * GET /api/contacts
   */
  static async getContacts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const {
        page,
        limit,
        search,
        companyId,
        ownerId,
        tags,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await contactService.getContacts({
        tenantId: req.tenant.id,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        companyId: companyId as string,
        ownerId: ownerId as string,
        tags: tags ? (tags as string).split(',') : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get contacts error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get contacts',
      });
    }
  }

  /**
   * Update contact
   * PUT /api/contacts/:id
   */
  static async updateContact(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const contact = await contactService.updateContact(
        req.tenant.id,
        id,
        updateData
      );

      logger.info(`Contact updated: ${contact.id} by user ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Contact updated successfully',
        data: contact,
      });
    } catch (error) {
      logger.error('Update contact error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update contact',
      });
    }
  }

  /**
   * Delete contact
   * DELETE /api/contacts/:id
   */
  static async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const { id } = req.params;

      await contactService.deleteContact(req.tenant.id, id);

      logger.info(`Contact deleted: ${id} by user ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error) {
      logger.error('Delete contact error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete contact',
      });
    }
  }

  /**
   * Get contact statistics
   * GET /api/contacts/stats
   */
  static async getContactStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const stats = await contactService.getContactStats(req.tenant.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get contact stats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get contact stats',
      });
    }
  }

  /**
   * Get contact user info (registration and online status)
   * GET /api/contacts/:id/user-info
   */
  static async getContactUserInfo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const { id } = req.params;
      const userInfo = await contactService.getContactUserInfo(req.tenant.id, id);

      res.status(200).json({
        success: true,
        data: userInfo,
      });
    } catch (error) {
      logger.error('Get contact user info error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get contact user info',
      });
    }
  }
}

