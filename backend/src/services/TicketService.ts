import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface CreateTicketInput {
  tenantId: string;
  subject: string;
  description: string;
  status?: TicketStatus;
  priority?: Priority;
  category?: string;
  source?: string;
  tags?: string[];
  slaDeadline?: string;
  contactId: string;
  assigneeId?: string;
}

interface UpdateTicketInput {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: Priority;
  category?: string;
  source?: string;
  tags?: string[];
  slaDeadline?: string;
  contactId?: string;
  assigneeId?: string;
}

interface GetTicketsFilters {
  status?: TicketStatus;
  priority?: Priority;
  category?: string;
  source?: string;
  assigneeId?: string;
  contactId?: string;
  tags?: string;
  slaPast?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TicketService {
  /**
   * Create a new ticket
   */
  async createTicket(data: CreateTicketInput) {
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

    // If assigneeId is provided, validate assignee exists in the tenant
    if (data.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: data.assigneeId,
          tenantId: data.tenantId,
        },
      });

      if (!assignee) {
        throw new Error('Assignee not found in this tenant');
      }
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        tenantId: data.tenantId,
        subject: data.subject,
        description: data.description,
        status: data.status || 'OPEN',
        priority: data.priority || 'MEDIUM',
        category: data.category,
        source: data.source || 'EMAIL',
        tags: data.tags || [],
        slaDeadline: data.slaDeadline ? new Date(data.slaDeadline) : undefined,
        contactId: data.contactId,
        assigneeId: data.assigneeId,
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
      },
    });

    return ticket;
  }

  /**
   * Get ticket by ID with full details
   */
  async getTicketById(ticketId: string, tenantId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenantId,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
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
        notes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          // include: {
          //   user: {
          //     select: {
          //       id: true,
          //       firstName: true,
          //       lastName: true,
          //     },
          //   },
          // },
        },
        _count: {
          select: {
            activities: true,
            notes: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber: number, tenantId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: ticketNumber,
        tenantId: tenantId,
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
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  /**
   * Get tickets with pagination, search, and filters
   */
  async getTickets(tenantId: string, filters: GetTicketsFilters = {}) {
    const {
      status,
      priority,
      category,
      source,
      assigneeId,
      contactId,
      tags,
      slaPast,
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

    // Status filter
    if (status) {
      where.status = status;
    }

    // Priority filter
    if (priority) {
      where.priority = priority;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Source filter
    if (source) {
      where.source = source;
    }

    // Assignee filter
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Tags filter
    if (tags) {
      where.tags = {
        has: tags,
      };
    }

    // SLA past deadline filter
    if (slaPast === true) {
      where.slaDeadline = {
        lt: new Date(),
      };
      where.status = {
        notIn: ['RESOLVED', 'CLOSED'],
      };
    }

    // Search filter - search in subject, description, ticketNumber
    if (search) {
      const searchNumber = parseInt(search);
      if (!isNaN(searchNumber)) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { ticketNumber: searchNumber },
        ];
      } else {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    // Get total count
    const total = await prisma.ticket.count({ where });

    // Get tickets
    const tickets = await prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
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
        _count: {
          select: {
            activities: true,
            notes: true,
          },
        },
      },
    });

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: string, tenantId: string, data: UpdateTicketInput) {
    // Verify ticket exists and belongs to tenant
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenantId,
      },
    });

    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // If updating assigneeId, validate assignee exists in tenant
    if (data.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: data.assigneeId,
          tenantId: tenantId,
        },
      });

      if (!assignee) {
        throw new Error('Assignee not found in this tenant');
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

    // Build update data
    const updateData: any = {};

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      // If ticket is being resolved, set resolvedAt
      if (data.status === 'RESOLVED' && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      // If ticket is being closed, set closedAt
      if (data.status === 'CLOSED' && !existingTicket.closedAt) {
        updateData.closedAt = new Date();
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.slaDeadline !== undefined) {
      updateData.slaDeadline = data.slaDeadline ? new Date(data.slaDeadline) : null;
    }
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

    // Set firstResponseAt if not set and assignee is being assigned
    if (data.assigneeId && !existingTicket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    // Update ticket
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
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
      },
    });

    return ticket;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, tenantId: string, newStatus: TicketStatus) {
    // Verify ticket exists and belongs to tenant
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenantId,
      },
    });

    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    const updateData: any = {
      status: newStatus,
    };

    // If ticket is being resolved, set resolvedAt
    if (newStatus === 'RESOLVED' && !existingTicket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    // If ticket is being closed, set closedAt
    if (newStatus === 'CLOSED' && !existingTicket.closedAt) {
      updateData.closedAt = new Date();
    }

    // Update ticket
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
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
      },
    });

    return ticket;
  }

  /**
   * Delete ticket
   */
  async deleteTicket(ticketId: string, tenantId: string) {
    // Verify ticket exists and belongs to tenant
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenantId,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Delete ticket
    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    return { message: 'Ticket deleted successfully' };
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(tenantId: string, userId?: string) {
    // Base where clause
    const baseWhere: any = { tenantId };
    
    // If userId provided, filter by tickets assigned to that user
    const userWhere = userId ? { ...baseWhere, assigneeId: userId } : baseWhere;

    // Total tickets
    const totalTickets = await prisma.ticket.count({
      where: userWhere,
    });

    // Tickets by status
    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ['status'],
      where: userWhere,
      _count: { status: true },
    });

    const statusStats = ticketsByStatus.map((item: any) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Tickets by priority
    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      where: userWhere,
      _count: { priority: true },
    });

    const priorityStats = ticketsByPriority.map((item: any) => ({
      priority: item.priority,
      count: item._count.priority,
    }));

    // Tickets by category
    const ticketsByCategory = await prisma.ticket.groupBy({
      by: ['category'],
      where: userWhere,
      _count: { category: true },
    });

    const categoryStats = ticketsByCategory.map((item: any) => ({
      category: item.category || 'Uncategorized',
      count: item._count.category,
    }));

    // Tickets by source
    const ticketsBySource = await prisma.ticket.groupBy({
      by: ['source'],
      where: userWhere,
      _count: { source: true },
    });

    const sourceStats = ticketsBySource.map((item: any) => ({
      source: item.source,
      count: item._count.source,
    }));

    // Tickets by assignee (only if not filtering by user)
    let assigneeStats: any[] = [];
    if (!userId) {
      const ticketsByAssignee = await prisma.ticket.groupBy({
        by: ['assigneeId'],
        where: baseWhere,
        _count: { assigneeId: true },
      });

      assigneeStats = await Promise.all(
        ticketsByAssignee.map(async (item: any) => {
          if (!item.assigneeId) {
            return {
              assigneeId: null,
              assigneeName: 'Unassigned',
              count: item._count.assigneeId,
            };
          }
          const assignee = await prisma.user.findUnique({
            where: { id: item.assigneeId },
            select: { firstName: true, lastName: true, email: true },
          });
          return {
            assigneeId: item.assigneeId,
            assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unknown',
            count: item._count.assigneeId,
          };
        })
      );
    }

    // Open tickets
    const openTickets = await prisma.ticket.count({
      where: {
        ...userWhere,
        status: 'OPEN',
      },
    });

    // In progress tickets
    const inProgressTickets = await prisma.ticket.count({
      where: {
        ...userWhere,
        status: 'IN_PROGRESS',
      },
    });

    // Pending tickets
    const pendingTickets = await prisma.ticket.count({
      where: {
        ...userWhere,
        status: 'PENDING',
      },
    });

    // Resolved tickets
    const resolvedTickets = await prisma.ticket.count({
      where: {
        ...userWhere,
        status: 'RESOLVED',
      },
    });

    // Closed tickets
    const closedTickets = await prisma.ticket.count({
      where: {
        ...userWhere,
        status: 'CLOSED',
      },
    });

    // Tickets past SLA deadline
    const now = new Date();
    const pastSlaTickets = await prisma.ticket.count({
      where: {
        ...userWhere,
        slaDeadline: { lt: now },
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });

    // Unassigned tickets
    const unassignedTickets = await prisma.ticket.count({
      where: {
        ...baseWhere,
        assigneeId: null,
      },
    });

    // Tickets created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyAdded = await prisma.ticket.count({
      where: {
        ...userWhere,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Average response time (time to first response)
    const ticketsWithResponse = await prisma.ticket.findMany({
      where: {
        ...userWhere,
        firstResponseAt: { not: null },
      },
      select: {
        createdAt: true,
        firstResponseAt: true,
      },
    });

    let avgResponseTime = 0;
    if (ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum: number, ticket: any) => {
        const responseTime = ticket.firstResponseAt!.getTime() - ticket.createdAt.getTime();
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / ticketsWithResponse.length / (1000 * 60)); // in minutes
    }

    // Average resolution time
    const resolvedTicketsWithTime = await prisma.ticket.findMany({
      where: {
        ...userWhere,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalResolutionTime = resolvedTicketsWithTime.reduce((sum: number, ticket: any) => {
        const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
        return sum + resolutionTime;
      }, 0);
      avgResolutionTime = Math.round(totalResolutionTime / resolvedTicketsWithTime.length / (1000 * 60)); // in minutes
    }

    // Resolution rate
    const resolutionRate = totalTickets > 0 ? ((resolvedTickets + closedTickets) / totalTickets) * 100 : 0;

    return {
      total: totalTickets,
      byStatus: statusStats,
      byPriority: priorityStats,
      byCategory: categoryStats,
      bySource: sourceStats,
      byAssignee: assigneeStats,
      open: openTickets,
      inProgress: inProgressTickets,
      pending: pendingTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      pastSla: pastSlaTickets,
      unassigned: unassignedTickets,
      recentlyAdded,
      avgResponseTime, // in minutes
      avgResolutionTime, // in minutes
      resolutionRate: Math.round(resolutionRate * 100) / 100,
    };
  }
}
