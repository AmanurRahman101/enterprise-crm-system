import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

interface CreateDealInput {
  tenantId: string;
  title: string;
  value: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  source?: string;
  description?: string;
  expectedCloseDate?: string;
  contactId: string;
  companyId?: string;
  ownerId: string;
}

interface UpdateDealInput {
  title?: string;
  value?: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  source?: string;
  description?: string;
  expectedCloseDate?: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  lostReason?: string;
}

interface GetDealsFilters {
  stage?: DealStage;
  ownerId?: string;
  contactId?: string;
  companyId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  minValue?: number;
  maxValue?: number;
  expectedCloseDateFrom?: string;
  expectedCloseDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class DealService {
  /**
   * Create a new deal
   */
  async createDeal(data: CreateDealInput) {
    // Validate owner exists in the tenant
    const owner = await prisma.user.findFirst({
      where: {
        id: data.ownerId,
        tenantId: data.tenantId,
      },
    });

    if (!owner) {
      throw new Error('Owner not found in this tenant');
    }

    // Validate contact exists in the tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: data.contactId,
        tenantId: data.tenantId,
      },
    });

    if (!contact) {
      throw new Error('Contact not found in this tenant');
    }

    // If companyId is provided, validate it exists in the tenant
    if (data.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: data.companyId,
          tenantId: data.tenantId,
        },
      });

      if (!company) {
        throw new Error('Company not found in this tenant');
      }
    }

    // Check for duplicate deal title within tenant
    const existingDeal = await prisma.deal.findFirst({
      where: {
        tenantId: data.tenantId,
        title: data.title,
      },
    });

    if (existingDeal) {
      throw new Error('A deal with this title already exists in your tenant');
    }

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        value: data.value,
        currency: data.currency || 'USD',
        stage: data.stage || 'LEAD',
        probability: data.probability !== undefined ? data.probability : 10,
        priority: data.priority || 'MEDIUM',
        source: data.source,
        description: data.description,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        contactId: data.contactId,
        companyId: data.companyId,
        ownerId: data.ownerId,
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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return deal;
  }

  /**
   * Get deal by ID with full details
   */
  async getDealById(dealId: string, tenantId: string) {
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            jobTitle: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        notes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            activities: true,
            tasks: true,
            notes: true,
          },
        },
      },
    });

    if (!deal) {
      throw new Error('Deal not found');
    }

    return deal;
  }

  /**
   * Get deals with pagination, search, and filters
   */
  async getDeals(tenantId: string, filters: GetDealsFilters = {}) {
    const {
      stage,
      ownerId,
      contactId,
      companyId,
      priority,
      minValue,
      maxValue,
      expectedCloseDateFrom,
      expectedCloseDateTo,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId: tenantId,
    };

    // Stage filter
    if (stage) {
      where.stage = stage;
    }

    // Owner filter
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Company filter
    if (companyId) {
      where.companyId = companyId;
    }

    // Priority filter
    if (priority) {
      where.priority = priority;
    }

    // Value range filter
    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {};
      if (minValue !== undefined) {
        where.value.gte = minValue;
      }
      if (maxValue !== undefined) {
        where.value.lte = maxValue;
      }
    }

    // Expected close date range filter
    if (expectedCloseDateFrom || expectedCloseDateTo) {
      where.expectedCloseDate = {};
      if (expectedCloseDateFrom) {
        where.expectedCloseDate.gte = new Date(expectedCloseDateFrom);
      }
      if (expectedCloseDateTo) {
        where.expectedCloseDate.lte = new Date(expectedCloseDateTo);
      }
    }

    // Search filter - search in title, description, source
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.deal.count({ where });

    // Get deals
    const deals = await prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        _count: {
          select: {
            activities: true,
            tasks: true,
            notes: true,
          },
        },
      },
    });

    return {
      data: deals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update deal
   */
  async updateDeal(dealId: string, tenantId: string, data: UpdateDealInput) {
    // Verify deal exists and belongs to tenant
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        tenantId: tenantId,
      },
    });

    if (!existingDeal) {
      throw new Error('Deal not found');
    }

    // If updating ownerId, validate owner exists in tenant
    if (data.ownerId) {
      const owner = await prisma.user.findFirst({
        where: {
          id: data.ownerId,
          tenantId: tenantId,
        },
      });

      if (!owner) {
        throw new Error('Owner not found in this tenant');
      }
    }

    // If updating contactId, validate contact exists in tenant
    if (data.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: data.contactId,
          tenantId: tenantId,
        },
      });

      if (!contact) {
        throw new Error('Contact not found in this tenant');
      }
    }

    // If updating companyId, validate company exists in tenant
    if (data.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: data.companyId,
          tenantId: tenantId,
        },
      });

      if (!company) {
        throw new Error('Company not found in this tenant');
      }
    }

    // If updating title, check for duplicates
    if (data.title && data.title !== existingDeal.title) {
      const duplicate = await prisma.deal.findFirst({
        where: {
          tenantId: tenantId,
          title: data.title,
          id: { not: dealId },
        },
      });

      if (duplicate) {
        throw new Error('A deal with this title already exists');
      }
    }

    // Build update data
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.stage !== undefined) {
      updateData.stage = data.stage;
      // If deal is being closed, set closedAt
      if (data.stage === 'CLOSED_WON' || data.stage === 'CLOSED_LOST') {
        updateData.closedAt = new Date();
      }
    }
    if (data.probability !== undefined) updateData.probability = data.probability;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = data.expectedCloseDate ? new Date(data.expectedCloseDate) : null;
    }
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason;

    // Update deal
    const deal = await prisma.deal.update({
      where: { id: dealId },
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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return deal;
  }

  /**
   * Move deal to a new stage
   */
  async moveDealStage(
    dealId: string,
    tenantId: string,
    newStage: DealStage,
    lostReason?: string
  ) {
    // Verify deal exists and belongs to tenant
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        tenantId: tenantId,
      },
    });

    if (!existingDeal) {
      throw new Error('Deal not found');
    }

    const updateData: any = {
      stage: newStage,
    };

    // Update probability based on stage
    switch (newStage) {
      case 'LEAD':
        updateData.probability = 10;
        break;
      case 'QUALIFIED':
        updateData.probability = 25;
        break;
      case 'PROPOSAL':
        updateData.probability = 50;
        break;
      case 'NEGOTIATION':
        updateData.probability = 75;
        break;
      case 'CLOSED_WON':
        updateData.probability = 100;
        updateData.closedAt = new Date();
        break;
      case 'CLOSED_LOST':
        updateData.probability = 0;
        updateData.closedAt = new Date();
        if (lostReason) {
          updateData.lostReason = lostReason;
        }
        break;
    }

    // Update deal
    const deal = await prisma.deal.update({
      where: { id: dealId },
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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return deal;
  }

  /**
   * Delete deal
   */
  async deleteDeal(dealId: string, tenantId: string) {
    // Verify deal exists and belongs to tenant
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        tenantId: tenantId,
      },
    });

    if (!deal) {
      throw new Error('Deal not found');
    }

    // Delete deal
    await prisma.deal.delete({
      where: { id: dealId },
    });

    return { message: 'Deal deleted successfully' };
  }

  /**
   * Get deal statistics
   */
  async getDealStats(tenantId: string) {
    // Total deals
    const totalDeals = await prisma.deal.count({
      where: { tenantId },
    });

    // Deals by stage
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: { tenantId },
      _count: { stage: true },
      _sum: { value: true },
    });

    const stageStats = dealsByStage.map((item: any) => ({
      stage: item.stage,
      count: item._count.stage,
      totalValue: item._sum.value || 0,
    }));

    // Deals by owner
    const dealsByOwner = await prisma.deal.groupBy({
      by: ['ownerId'],
      where: { tenantId },
      _count: { ownerId: true },
      _sum: { value: true },
    });

    const ownerStats = await Promise.all(
      dealsByOwner.map(async (item: any) => {
        const owner = await prisma.user.findUnique({
          where: { id: item.ownerId },
          select: { firstName: true, lastName: true, email: true },
        });
        return {
          ownerId: item.ownerId,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
          count: item._count.ownerId,
          totalValue: item._sum.value || 0,
        };
      })
    );

    // Total value of all deals
    const totalValue = await prisma.deal.aggregate({
      where: { tenantId },
      _sum: { value: true },
    });

    // Total value by stage
    const wonDealsValue = await prisma.deal.aggregate({
      where: { tenantId, stage: 'CLOSED_WON' },
      _sum: { value: true },
    });

    const lostDealsValue = await prisma.deal.aggregate({
      where: { tenantId, stage: 'CLOSED_LOST' },
      _sum: { value: true },
    });

    const pipelineValue = await prisma.deal.aggregate({
      where: {
        tenantId,
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
      },
      _sum: { value: true },
    });

    // Count closed deals
    const closedWonCount = await prisma.deal.count({
      where: { tenantId, stage: 'CLOSED_WON' },
    });

    const closedLostCount = await prisma.deal.count({
      where: { tenantId, stage: 'CLOSED_LOST' },
    });

    const totalClosedDeals = closedWonCount + closedLostCount;

    // Calculate win rate
    const winRate = totalClosedDeals > 0 ? (closedWonCount / totalClosedDeals) * 100 : 0;

    // Average deal value
    const averageDealValue = totalDeals > 0 ? (totalValue._sum.value || 0) / totalDeals : 0;

    // Recently added deals (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyAdded = await prisma.deal.count({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Deals closing soon (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const closingSoon = await prisma.deal.count({
      where: {
        tenantId,
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
        expectedCloseDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
    });

    return {
      total: totalDeals,
      byStage: stageStats,
      byOwner: ownerStats,
      totalValue: totalValue._sum.value || 0,
      wonValue: wonDealsValue._sum.value || 0,
      lostValue: lostDealsValue._sum.value || 0,
      pipelineValue: pipelineValue._sum.value || 0,
      closedWonCount,
      closedLostCount,
      winRate: Math.round(winRate * 100) / 100,
      averageDealValue: Math.round(averageDealValue * 100) / 100,
      recentlyAdded,
      closingSoon,
    };
  }
}
