import { Request, Response } from 'express';
import { prisma } from '../config/database';
import logger from '../utils/logger';

/**
 * Customer Ticket Controller
 * Handles ticket creation and management for customer users
 */

/**
 * Create a ticket as a customer
 * POST /api/customer/tickets
 */
export const createCustomerTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
      return;
    }

    // Debug logging
    logger.info(`[CUSTOMER TICKET] User attempting to create ticket:`, {
      userId: req.user.userId,
      role: req.user.role,
      isCustomer: req.user.isCustomer,
      email: req.user.email
    });

    // Verify user is a customer
    if (req.user.role !== 'CUSTOMER') {
      logger.error(`[CUSTOMER TICKET] Access denied - User role is ${req.user.role}, not CUSTOMER`);
      res.status(403).json({ 
        success: false,
        error: `This endpoint is only for customers. Your role: ${req.user.role}` 
      });
      return;
    }

    const {
      tenantSubdomain, // The company subdomain the customer is contacting
      subject,
      description,
      priority,
      category,
    } = req.body;

    // Validate required fields
    if (!tenantSubdomain) {
      res.status(400).json({ 
        success: false,
        error: 'Company/organization is required' 
      });
      return;
    }

    if (!subject || !subject.trim()) {
      res.status(400).json({ 
        success: false,
        error: 'Subject is required' 
      });
      return;
    }

    if (!description || !description.trim()) {
      res.status(400).json({ 
        success: false,
        error: 'Description is required' 
      });
      return;
    }

    // Find the tenant (company) the customer is contacting
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: tenantSubdomain }
    });

    if (!tenant) {
      res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
      return;
    }

    // Check if the tenant is active
    if (!tenant.isActive) {
      res.status(400).json({ 
        success: false,
        error: 'This company is not accepting tickets at the moment' 
      });
      return;
    }

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!currentUser) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }

    // Find or create a Contact record for this customer in the target tenant
    let contact = await prisma.contact.findFirst({
      where: {
        tenantId: tenant.id,
        customerUserId: currentUser.id,
      }
    });

    if (!contact) {
      // Check if a contact with this email exists in the tenant
      contact = await prisma.contact.findFirst({
        where: {
          tenantId: tenant.id,
          email: currentUser.email,
        }
      });

      if (contact) {
        // Link the existing contact to the customer user
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: {
            customerUserId: currentUser.id,
            isRegistered: true,
          }
        });
      } else {
        // Create a new contact record for this customer in the tenant
        // Find a default owner (could be first admin user in tenant)
        const defaultOwner = await prisma.user.findFirst({
          where: {
            tenantId: tenant.id,
            role: { in: ['ADMIN', 'MANAGER'] },
            isActive: true,
          },
          orderBy: { createdAt: 'asc' }
        });

        if (!defaultOwner) {
          res.status(500).json({ 
            success: false,
            error: 'No available staff to handle your ticket. Please contact the company directly.' 
          });
          return;
        }

        contact = await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            email: currentUser.email,
            phone: null,
            isCustomer: true,
            customerUserId: currentUser.id,
            isRegistered: true,
            ownerId: defaultOwner.id,
          }
        });
      }
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        tenantId: tenant.id,
        contactId: contact.id,
        subject: subject.trim(),
        description: description.trim(),
        priority: priority || 'MEDIUM',
        category: category || 'General',
        source: 'APP', // Customer portal
        status: 'OPEN',
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          }
        }
      }
    });

    logger.info(`Customer ticket created: ${ticket.ticketNumber} by customer ${currentUser.email} for tenant ${tenant.name}`);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error: any) {
    logger.error('Error creating customer ticket:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create ticket' 
    });
  }
};

/**
 * Get all tickets for the logged-in customer
 * GET /api/customer/tickets
 */
export const getCustomerTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
      return;
    }

    // Verify user is a customer
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ 
        success: false,
        error: 'This endpoint is only for customers' 
      });
      return;
    }

    const { status, page = '1', limit = '20' } = req.query;

    // Find all Contact records linked to this customer
    const contacts = await prisma.contact.findMany({
      where: {
        customerUserId: req.user.userId,
      },
      select: {
        id: true,
      }
    });

    if (contacts.length === 0) {
      res.json({
        success: true,
        data: {
          tickets: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          }
        }
      });
      return;
    }

    const contactIds = contacts.map(c => c.id);

    // Build filter
    const where: any = {
      contactId: { in: contactIds }
    };

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.ticket.count({ where });

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get tickets
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logo: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error: any) {
    logger.error('Error fetching customer tickets:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tickets' 
    });
  }
};

/**
 * Get a single ticket for the logged-in customer
 * GET /api/customer/tickets/:id
 */
export const getCustomerTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
      return;
    }

    // Verify user is a customer
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ 
        success: false,
        error: 'This endpoint is only for customers' 
      });
      return;
    }

    const { id } = req.params;

    // Find all Contact records linked to this customer
    const contacts = await prisma.contact.findMany({
      where: {
        customerUserId: req.user.userId,
      },
      select: {
        id: true,
      }
    });

    const contactIds = contacts.map(c => c.id);

    // Get ticket and verify ownership
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        contactId: { in: contactIds }
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logo: true,
          }
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      res.status(404).json({ 
        success: false,
        error: 'Ticket not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error: any) {
    logger.error('Error fetching customer ticket:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ticket' 
    });
  }
};

/**
 * Get list of companies/tenants that the customer has tickets with
 * GET /api/customer/companies
 */
export const getCustomerCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
      return;
    }

    // Verify user is a customer
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ 
        success: false,
        error: 'This endpoint is only for customers' 
      });
      return;
    }

    // Find all Contact records linked to this customer
    const contacts = await prisma.contact.findMany({
      where: {
        customerUserId: req.user.userId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logo: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    // Get unique tenants
    const tenantMap = new Map();
    contacts.forEach(contact => {
      if (!tenantMap.has(contact.tenant.id)) {
        tenantMap.set(contact.tenant.id, contact.tenant);
      }
    });

    const companies = Array.from(tenantMap.values());

    res.json({
      success: true,
      data: companies
    });
  } catch (error: any) {
    logger.error('Error fetching customer companies:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch companies' 
    });
  }
};

/**
 * Get all available companies/organizations (for ticket creation)
 * GET /api/customer/available-companies
 */
export const getAvailableCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
      return;
    }

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logo: true,
        email: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: tenants
    });
  } catch (error: any) {
    logger.error('Error fetching available companies:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch companies' 
    });
  }
};
