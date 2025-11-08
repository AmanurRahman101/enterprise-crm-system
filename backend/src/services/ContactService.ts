import { prisma } from '../config/database';

/**
 * ContactService - Business logic for contact management
 * Handles CRUD operations with tenant isolation
 */
export class ContactService {
  /**
   * Create a new contact
   */
  async createContact(data: {
    tenantId: string;
    companyId?: string;
    ownerId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    website?: string;
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
    tags?: string[];
  }): Promise<any> {
    // Validate that owner exists in the same tenant
    const owner = await prisma.user.findFirst({
      where: {
        id: data.ownerId,
        tenantId: data.tenantId,
      },
    });

    if (!owner) {
      throw new Error('Owner not found or does not belong to this tenant');
    }

    // If companyId provided, validate it belongs to the same tenant
    // Handle empty string as undefined
    if (data.companyId && data.companyId.trim() !== '') {
      const company = await prisma.company.findFirst({
        where: {
          id: data.companyId,
          tenantId: data.tenantId,
        },
      });

      if (!company) {
        throw new Error('Company not found or does not belong to this tenant');
      }
    } else {
      // Convert empty string to undefined (will be null in DB)
      data.companyId = undefined;
    }

    // Check for duplicate email within tenant
    if (data.email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          tenantId: data.tenantId,
          email: data.email,
        },
      });

      if (existingContact) {
        throw new Error('A contact with this email already exists in this organization');
      }
    }

    return await prisma.contact.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId || undefined, // Set to undefined if not provided or empty
        ownerId: data.ownerId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.position,
        department: data.department,
        address: data.address,
        city: data.city,
        country: data.country,
        linkedinUrl: data.linkedIn,
        twitterUrl: data.twitter,
        tags: data.tags || [],
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get contact by ID (with tenant isolation)
   */
  async getContactById(tenantId: string, contactId: string): Promise<any | null> {
    return await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: tenantId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true,
          },
        },
        tickets: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            subject: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  /**
   * Get all contacts with pagination, search, and filters
   */
  async getContacts(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
    ownerId?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    contacts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    // Build where clause
    const where: any = {
      tenantId: params.tenantId,
    };

    // Search by name or email
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filter by company
    if (params.companyId) {
      where.companyId = params.companyId;
    }

    // Filter by owner
    if (params.ownerId) {
      where.ownerId = params.ownerId;
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      where.tags = {
        hasSome: params.tags,
      };
    }

    // Get total count
    const total = await prisma.contact.count({ where });

    // Get contacts
    const contacts = await prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            deals: true,
            tickets: true,
            activities: true,
          },
        },
      },
    });

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update contact
   */
  async updateContact(
    tenantId: string,
    contactId: string,
    data: Partial<{
      companyId: string | null;
      ownerId: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      position: string | null;
      department: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      postalCode: string | null;
      website: string | null;
      linkedIn: string | null;
      twitter: string | null;
      facebook: string | null;
      tags: string[];
    }>
  ): Promise<any> {
    // Verify contact exists and belongs to tenant
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: tenantId,
      },
    });

    if (!existingContact) {
      throw new Error('Contact not found or does not belong to this tenant');
    }

    // If updating email, check for duplicates
    if (data.email && data.email !== existingContact.email) {
      const duplicate = await prisma.contact.findFirst({
        where: {
          tenantId: tenantId,
          email: data.email,
          id: { not: contactId },
        },
      });

      if (duplicate) {
        throw new Error('A contact with this email already exists in this organization');
      }
    }

    // If updating owner, validate they exist in tenant
    if (data.ownerId) {
      const owner = await prisma.user.findFirst({
        where: {
          id: data.ownerId,
          tenantId: tenantId,
        },
      });

      if (!owner) {
        throw new Error('Owner not found or does not belong to this tenant');
      }
    }

    // If updating company, validate it exists in tenant
    if (data.companyId !== undefined) {
      if (data.companyId) {
        const company = await prisma.company.findFirst({
          where: {
            id: data.companyId,
            tenantId: tenantId,
          },
        });

        if (!company) {
          throw new Error('Company not found or does not belong to this tenant');
        }
      }
    }

    return await prisma.contact.update({
      where: { id: contactId },
      data: data as any,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete contact
   */
  async deleteContact(tenantId: string, contactId: string): Promise<void> {
    // Verify contact exists and belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: tenantId,
      },
    });

    if (!contact) {
      throw new Error('Contact not found or does not belong to this tenant');
    }

    // Delete contact (cascade will handle related records)
    await prisma.contact.delete({
      where: { id: contactId },
    });
  }

  /**
   * Get contact statistics for a tenant
   */
  async getContactStats(tenantId: string): Promise<{
    total: number;
    withCompany: number;
    withoutCompany: number;
    byOwner: { ownerId: string; ownerName: string; count: number }[];
    recentlyAdded: number;
  }> {
    const total = await prisma.contact.count({
      where: { tenantId },
    });

    const withCompany = await prisma.contact.count({
      where: {
        tenantId,
        companyId: { not: null },
      },
    });

    const withoutCompany = total - withCompany;

    // Recently added (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyAdded = await prisma.contact.count({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Contacts by owner
    const contactsByOwner = await prisma.contact.groupBy({
      by: ['ownerId'],
      where: { tenantId },
      _count: true,
    });

    const byOwner = await Promise.all(
      contactsByOwner.map(async (item: any) => {
        const owner = await prisma.user.findUnique({
          where: { id: item.ownerId },
          select: { firstName: true, lastName: true },
        });
        return {
          ownerId: item.ownerId,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
          count: item._count,
        };
      })
    );

    return {
      total,
      withCompany,
      withoutCompany,
      byOwner,
      recentlyAdded,
    };
  }

  /**
   * Link a contact to a customer user account
   */
  async linkContactToUser(
    tenantId: string,
    contactId: string,
    userId: string
  ): Promise<any> {
    // Verify contact exists and belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Link the contact to the user
    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        customerUserId: userId,
        isRegistered: true,
      },
    });
  }

  /**
   * Auto-link contact by email when user registers
   */
  async autoLinkContactByEmail(email: string, userId: string): Promise<number> {
    // Find all contacts with this email across tenants
    const contacts = await prisma.contact.findMany({
      where: {
        email: email.toLowerCase(),
        isRegistered: false, // Only link unlinked contacts
      },
    });

    if (contacts.length === 0) {
      return 0;
    }

    // Link all matching contacts to this user
    await prisma.contact.updateMany({
      where: {
        email: email.toLowerCase(),
        isRegistered: false,
      },
      data: {
        customerUserId: userId,
        isRegistered: true,
      },
    });

    return contacts.length;
  }

  /**
   * Check if a contact is registered and get their user ID
   */
  async getContactUserInfo(
    tenantId: string,
    contactId: string
  ): Promise<{ isRegistered: boolean; userId: string | null; isOnline?: boolean }> {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
      select: {
        isRegistered: true,
        customerUserId: true,
      },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return {
      isRegistered: contact.isRegistered,
      userId: contact.customerUserId,
    };
  }

  /**
   * Unlink a contact from user account
   */
  async unlinkContactFromUser(tenantId: string, contactId: string): Promise<any> {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        customerUserId: null,
        isRegistered: false,
      },
    });
  }
}

