import { prisma } from '../config/database';

export interface CreateTenantDTO {
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  timezone?: string;
  adminUser: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * TenantService - Business logic for tenant management
 */
export class TenantService {
  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        domain: true,
        email: true,
        phone: true,
        logo: true,
        timezone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new Error('Tenant is not active');
    }

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        domain: true,
        email: true,
        phone: true,
        logo: true,
        timezone: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  /**
   * List all tenants (admin only)
   */
  async listTenants(filters?: {
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { subdomain: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      select: {
        id: true,
        name: true,
        subdomain: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            companies: true,
            contacts: true,
            deals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants;
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    logo?: string;
    timezone?: string;
    settings?: any;
  }) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        subdomain: true,
        email: true,
        phone: true,
        logo: true,
        timezone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return tenant;
  }

  /**
   * Deactivate tenant
   */
  async deactivateTenant(tenantId: string) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return tenant;
  }

  /**
   * Activate tenant
   */
  async activateTenant(tenantId: string) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return tenant;
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string) {
    const [
      usersCount,
      companiesCount,
      contactsCount,
      dealsCount,
      ticketsCount,
      tasksCount,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.company.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId } }),
      prisma.ticket.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
    ]);

    return {
      users: usersCount,
      companies: companiesCount,
      contacts: contactsCount,
      deals: dealsCount,
      tickets: ticketsCount,
      tasks: tasksCount,
    };
  }
}
