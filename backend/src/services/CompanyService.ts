import { prisma } from '../config/database';

/**
 * CompanyService - Business logic for company management
 * Handles CRUD operations with tenant isolation
 */
export class CompanyService {
  /**
   * Create a new company
   */
  async createCompany(data: {
    tenantId: string;
    ownerId: string;
    name: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    employeeCount?: number;
    annualRevenue?: number;
    description?: string;
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

    // Check for duplicate company name within tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        tenantId: data.tenantId,
        name: data.name,
      },
    });

    if (existingCompany) {
      throw new Error('A company with this name already exists in this organization');
    }

    return await prisma.company.create({
      data: {
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        name: data.name,
        industry: data.industry,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        employeeCount: data.employeeCount,
        annualRevenue: data.annualRevenue,
        description: data.description,
        linkedinUrl: data.linkedIn,
        twitterUrl: data.twitter,
        facebookUrl: data.facebook,
        tags: data.tags || [],
      },
      include: {
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
   * Get company by ID (with tenant isolation)
   */
  async getCompanyById(tenantId: string, companyId: string): Promise<any | null> {
    return await prisma.company.findFirst({
      where: {
        id: companyId,
        tenantId: tenantId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
          take: 10,
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true,
          },
          take: 10,
        },
        _count: {
          select: {
            contacts: true,
            deals: true,
            activities: true,
          },
        },
      },
    });
  }

  /**
   * Get all companies with pagination, search, and filters
   */
  async getCompanies(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    ownerId?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    companies: any[];
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

    // Search by name, email, or website
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { website: { contains: params.search, mode: 'insensitive' } },
        { industry: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filter by industry
    if (params.industry) {
      where.industry = { contains: params.industry, mode: 'insensitive' };
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
    const total = await prisma.company.count({ where });

    // Get companies
    const companies = await prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
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
            contacts: true,
            deals: true,
            activities: true,
          },
        },
      },
    });

    return {
      companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update company
   */
  async updateCompany(
    tenantId: string,
    companyId: string,
    data: Partial<{
      ownerId: string;
      name: string;
      industry: string;
      website: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      employeeCount: number;
      annualRevenue: number;
      description: string;
      linkedIn: string;
      twitter: string;
      facebook: string;
      tags: string[];
    }>
  ): Promise<any> {
    // Verify company exists and belongs to tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
        tenantId: tenantId,
      },
    });

    if (!existingCompany) {
      throw new Error('Company not found or does not belong to this tenant');
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== existingCompany.name) {
      const duplicate = await prisma.company.findFirst({
        where: {
          tenantId: tenantId,
          name: data.name,
          id: { not: companyId },
        },
      });

      if (duplicate) {
        throw new Error('A company with this name already exists in this organization');
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

    // Map fields for update
    const updateData: any = {};
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.employeeCount !== undefined) updateData.employeeCount = data.employeeCount;
    if (data.annualRevenue !== undefined) updateData.annualRevenue = data.annualRevenue;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.linkedIn !== undefined) updateData.linkedinUrl = data.linkedIn;
    if (data.twitter !== undefined) updateData.twitterUrl = data.twitter;
    if (data.facebook !== undefined) updateData.facebookUrl = data.facebook;
    if (data.tags !== undefined) updateData.tags = data.tags;

    return await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
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
   * Delete company
   */
  async deleteCompany(tenantId: string, companyId: string): Promise<void> {
    // Verify company exists and belongs to tenant
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        tenantId: tenantId,
      },
    });

    if (!company) {
      throw new Error('Company not found or does not belong to this tenant');
    }

    // Delete company (cascade will handle related records)
    await prisma.company.delete({
      where: { id: companyId },
    });
  }

  /**
   * Get company statistics for a tenant
   */
  async getCompanyStats(tenantId: string): Promise<{
    total: number;
    byIndustry: { industry: string; count: number }[];
    byOwner: { ownerId: string; ownerName: string; count: number }[];
    recentlyAdded: number;
    totalRevenue: number;
  }> {
    const total = await prisma.company.count({
      where: { tenantId },
    });

    // Recently added (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyAdded = await prisma.company.count({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Total annual revenue
    const revenueResult = await prisma.company.aggregate({
      where: { tenantId },
      _sum: {
        annualRevenue: true,
      },
    });

    const totalRevenue = revenueResult._sum.annualRevenue || 0;

    // Companies by industry
    const companiesByIndustry = await prisma.company.groupBy({
      by: ['industry'],
      where: { 
        tenantId,
        industry: { not: null },
      },
      _count: true,
    });

    const byIndustry = companiesByIndustry.map((item: any) => ({
      industry: item.industry || 'Unknown',
      count: item._count,
    }));

    // Companies by owner
    const companiesByOwner = await prisma.company.groupBy({
      by: ['ownerId'],
      where: { tenantId },
      _count: true,
    });

    const byOwner = await Promise.all(
      companiesByOwner.map(async (item: any) => {
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
      byIndustry,
      byOwner,
      recentlyAdded,
      totalRevenue,
    };
  }
}
