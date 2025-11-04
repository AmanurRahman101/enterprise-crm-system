import { Request, Response } from 'express';
import { CompanyService } from '../services/CompanyService';
import logger from '../utils/logger';

const companyService = new CompanyService();

/**
 * CompanyController - Handles company management endpoints
 */
export class CompanyController {
  /**
   * Create a new company
   * POST /api/companies
   */
  static async createCompany(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication and tenant identification required',
        });
        return;
      }

      const {
        name,
        industry,
        website,
        email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        employeeCount,
        annualRevenue,
        description,
        linkedIn,
        twitter,
        facebook,
        tags,
      } = req.body;

      // Validation
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Company name is required',
        });
        return;
      }

      const company = await companyService.createCompany({
        tenantId: req.tenant.id,
        ownerId: req.user.userId, // Current user becomes owner
        name,
        industry,
        website,
        email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        employeeCount,
        annualRevenue,
        description,
        linkedIn,
        twitter,
        facebook,
        tags,
      });

      logger.info(`Company created: ${company.name} by user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: company,
      });
    } catch (error) {
      logger.error('Create company error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create company',
      });
    }
  }

  /**
   * Get company by ID
   * GET /api/companies/:id
   */
  static async getCompany(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const { id } = req.params;

      const company = await companyService.getCompanyById(req.tenant.id, id);

      if (!company) {
        res.status(404).json({
          success: false,
          message: 'Company not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.error('Get company error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get company',
      });
    }
  }

  /**
   * Get all companies with pagination and filters
   * GET /api/companies
   */
  static async getCompanies(req: Request, res: Response): Promise<void> {
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
        industry,
        ownerId,
        tags,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await companyService.getCompanies({
        tenantId: req.tenant.id,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        industry: industry as string,
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
      logger.error('Get companies error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get companies',
      });
    }
  }

  /**
   * Update company
   * PUT /api/companies/:id
   */
  static async updateCompany(req: Request, res: Response): Promise<void> {
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

      const company = await companyService.updateCompany(
        req.tenant.id,
        id,
        updateData
      );

      logger.info(`Company updated: ${company.id} by user ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: company,
      });
    } catch (error) {
      logger.error('Update company error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update company',
      });
    }
  }

  /**
   * Delete company
   * DELETE /api/companies/:id
   */
  static async deleteCompany(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const { id } = req.params;

      await companyService.deleteCompany(req.tenant.id, id);

      logger.info(`Company deleted: ${id} by user ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      logger.error('Delete company error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete company',
      });
    }
  }

  /**
   * Get company statistics
   * GET /api/companies/stats
   */
  static async getCompanyStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({
          success: false,
          message: 'Tenant identification required',
        });
        return;
      }

      const stats = await companyService.getCompanyStats(req.tenant.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get company stats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get company stats',
      });
    }
  }
}
