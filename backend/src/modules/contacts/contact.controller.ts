import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import contactService, { CreateContactDTO, UpdateContactDTO, ContactStatus } from './contact.service';

export class ContactController {
  /**
   * Get all contacts
   * GET /api/contacts
   */
  async getAllContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { status, search, page, limit } = req.query;

      const filters = {
        status: status as ContactStatus | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await contactService.getAllContacts(organizationId, filters);
      res.json(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   * GET /api/contacts/:id
   */
  async getContactById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const contact = await contactService.getContactById(id, organizationId);
      res.json(contact);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new contact
   * POST /api/contacts
   */
  async createContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const data: CreateContactDTO = req.body;

      const contact = await contactService.createContact(organizationId, data);
      res.status(201).json(contact);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a contact
   * PUT /api/contacts/:id
   */
  async updateContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const data: UpdateContactDTO = req.body;

      const contact = await contactService.updateContact(id, organizationId, data);
      res.json(contact);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a contact
   * DELETE /api/contacts/:id
   */
  async deleteContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const result = await contactService.deleteContact(id, organizationId);
      res.json(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get contact statistics
   * GET /api/contacts/stats
   */
  async getContactStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const stats = await contactService.getContactStats(organizationId);
      res.json(stats);
    } catch (error) {
      throw error;
    }
  }
}

export default new ContactController();
