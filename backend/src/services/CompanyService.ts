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
    name: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    size?: string;
    description?: string;
    logo?: string;
  }): Promise<any> {
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
        name: data.name,
        industry: data.industry,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        size: data.size,
        description: data.description,
        logo: data.logo,
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
    size?: string;
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

    // Filter by size
    if (params.size) {
      where.size = params.size;
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
        _count: {
          select: {
            contacts: true,
            deals: true,
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
      name: string;
      industry: string;
      website: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      country: string;
      size: string;
      description: string;
      logo: string;
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

    // Map fields for update
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logo !== undefined) updateData.logo = data.logo;

    return await prisma.company.update({
      where: { id: companyId },
      data: updateData,
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
    recentlyAdded: number;
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

    return {
      total,
      byIndustry,
      recentlyAdded,
    };
  }
}
