import prisma from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

// Define ContactStatus enum locally (will be replaced by Prisma-generated type after running prisma generate)
export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LEAD = 'LEAD',
  CUSTOMER = 'CUSTOMER'
}

export interface CreateContactDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: ContactStatus;
  source?: string;
  notes?: string;
}

export interface UpdateContactDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: ContactStatus;
  source?: string;
  notes?: string;
}

export class ContactService {
  /**
   * Get all contacts for an organization with optional filtering and pagination
   */
  async getAllContacts(
    organizationId: string,
    filters?: {
      status?: ContactStatus;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: {
      organizationId: string;
      status?: ContactStatus;
      OR?: Array<{
        firstName?: { contains: string };
        lastName?: { contains: string };
        email?: { contains: string };
        company?: { contains: string };
      }>;
    } = {
      organizationId,
    };

    // Filter by status if provided
    if (filters?.status) {
      where.status = filters.status;
    }

    // Search by name, email, or company
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { company: { contains: filters.search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          position: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single contact by ID (tenant-aware)
   */
  async getContactById(id: string, organizationId: string) {
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId, // Ensure tenant isolation
      },
      include: {
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            createdAt: true,
          },
        },
        tickets: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            completed: true,
            dueDate: true,
          },
        },
      },
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    return contact;
  }

  /**
   * Create a new contact (tenant-aware)
   */
  async createContact(organizationId: string, data: CreateContactDTO) {
    // Check if contact with email already exists in this organization
    const existingContact = await prisma.contact.findFirst({
      where: {
        email: data.email,
        organizationId,
      },
    });

    if (existingContact) {
      throw new AppError('Contact with this email already exists', 400);
    }

    const contact = await prisma.contact.create({
      data: {
        ...data,
        organizationId, // Always set the organizationId
      },
    });

    return contact;
  }

  /**
   * Update a contact (tenant-aware)
   */
  async updateContact(
    id: string,
    organizationId: string,
    data: UpdateContactDTO
  ) {
    // First, verify the contact belongs to this organization
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingContact) {
      throw new AppError('Contact not found', 404);
    }

    // If email is being updated, check it's not already in use
    if (data.email && data.email !== existingContact.email) {
      const emailExists = await prisma.contact.findFirst({
        where: {
          email: data.email,
          organizationId,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new AppError('Contact with this email already exists', 400);
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data,
    });

    return contact;
  }

  /**
   * Delete a contact (tenant-aware)
   */
  async deleteContact(id: string, organizationId: string) {
    // First, verify the contact belongs to this organization
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingContact) {
      throw new AppError('Contact not found', 404);
    }

    await prisma.contact.delete({
      where: { id },
    });

    return { message: 'Contact deleted successfully' };
  }

  /**
   * Get contact statistics for an organization
   */
  async getContactStats(organizationId: string) {
    const [total, byStatus] = await Promise.all([
      prisma.contact.count({
        where: { organizationId },
      }),
      prisma.contact.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default new ContactService();
