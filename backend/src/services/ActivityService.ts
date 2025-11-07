import { PrismaClient, ActivityType } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreateActivityInput {
  type: ActivityType;
  subject: string;
  description?: string;
  duration?: number;
  outcome?: string;
  recordingUrl?: string;
  emailMessageId?: string;
  metadata?: any;
  contactId: string;
  dealId?: string;
  ticketId?: string;
  userId: string;
  occurredAt?: Date;
}

interface GetActivitiesFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: ActivityType;
  contactId?: string;
  dealId?: string;
  ticketId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetActivityFeedFilters {
  page?: number;
  limit?: number;
  entityType?: string; // 'contact' | 'deal' | 'ticket'
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export class ActivityService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new activity
   */
  async createActivity(tenantId: string, data: CreateActivityInput) {
    try {
      // Validate contact exists in tenant
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: data.contactId,
          tenantId,
        },
      });

      if (!contact) {
        throw new Error('Contact not found or does not belong to this tenant');
      }

      // Validate deal if provided
      if (data.dealId) {
        const deal = await this.prisma.deal.findFirst({
          where: {
            id: data.dealId,
            tenantId,
          },
        });

        if (!deal) {
          throw new Error('Deal not found or does not belong to this tenant');
        }
      }

      // Validate ticket if provided
      if (data.ticketId) {
        const ticket = await this.prisma.ticket.findFirst({
          where: {
            id: data.ticketId,
            tenantId,
          },
        });

        if (!ticket) {
          throw new Error('Ticket not found or does not belong to this tenant');
        }
      }

      // Validate user exists in tenant
      const user = await this.prisma.user.findFirst({
        where: {
          id: data.userId,
          tenantId,
        },
      });

      if (!user) {
        throw new Error('User not found or does not belong to this tenant');
      }

      const activity = await this.prisma.activity.create({
        data: {
          tenantId,
          type: data.type,
          subject: data.subject,
          description: data.description,
          duration: data.duration,
          outcome: data.outcome,
          recordingUrl: data.recordingUrl,
          emailMessageId: data.emailMessageId,
          metadata: data.metadata,
          contactId: data.contactId,
          dealId: data.dealId,
          ticketId: data.ticketId,
          userId: data.userId,
          occurredAt: data.occurredAt || new Date(),
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Activity created: ${activity.id} for tenant: ${tenantId}`);
      return activity;
    } catch (error: any) {
      logger.error(`Error creating activity for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get activity by ID
   */
  async getActivityById(tenantId: string, activityId: string) {
    try {
      const activity = await this.prisma.activity.findFirst({
        where: {
          id: activityId,
          tenantId,
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
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!activity) {
        return null;
      }

      return activity;
    } catch (error: any) {
      logger.error(`Error fetching activity ${activityId} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get all activities with filters and pagination
   */
  async getActivities(tenantId: string, filters: GetActivitiesFilters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        type,
        contactId,
        dealId,
        ticketId,
        userId,
        startDate,
        endDate,
        sortBy = 'occurredAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        tenantId,
      };

      // Search in subject and description
      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by type
      if (type) {
        where.type = type;
      }

      // Filter by contact
      if (contactId) {
        where.contactId = contactId;
      }

      // Filter by deal
      if (dealId) {
        where.dealId = dealId;
      }

      // Filter by ticket
      if (ticketId) {
        where.ticketId = ticketId;
      }

      // Filter by user
      if (userId) {
        where.userId = userId;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.occurredAt = {};
        if (startDate) {
          where.occurredAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.occurredAt.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await this.prisma.activity.count({ where });

      // Get activities
      const activities = await this.prisma.activity.findMany({
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
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        activities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error(`Error fetching activities for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get activity feed - unified timeline view
   * This provides a chronological feed of activities across entities
   */
  async getActivityFeed(tenantId: string, filters: GetActivityFeedFilters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        entityType,
        entityId,
        userId,
        startDate,
        endDate,
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        tenantId,
      };

      // Filter by entity
      if (entityType && entityId) {
        if (entityType === 'contact') {
          where.contactId = entityId;
        } else if (entityType === 'deal') {
          where.dealId = entityId;
        } else if (entityType === 'ticket') {
          where.ticketId = entityId;
        }
      }

      // Filter by user
      if (userId) {
        where.userId = userId;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.occurredAt = {};
        if (startDate) {
          where.occurredAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.occurredAt.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await this.prisma.activity.count({ where });

      // Get activities
      const activities = await this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
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
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              status: true,
              priority: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        activities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error(`Error fetching activity feed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Update activity
   */
  async updateActivity(
    tenantId: string,
    activityId: string,
    data: Partial<CreateActivityInput>
  ) {
    try {
      // Check if activity exists in tenant
      const existingActivity = await this.prisma.activity.findFirst({
        where: {
          id: activityId,
          tenantId,
        },
      });

      if (!existingActivity) {
        return null;
      }

      // Validate contact if provided
      if (data.contactId) {
        const contact = await this.prisma.contact.findFirst({
          where: {
            id: data.contactId,
            tenantId,
          },
        });

        if (!contact) {
          throw new Error('Contact not found or does not belong to this tenant');
        }
      }

      // Validate deal if provided
      if (data.dealId) {
        const deal = await this.prisma.deal.findFirst({
          where: {
            id: data.dealId,
            tenantId,
          },
        });

        if (!deal) {
          throw new Error('Deal not found or does not belong to this tenant');
        }
      }

      // Validate ticket if provided
      if (data.ticketId) {
        const ticket = await this.prisma.ticket.findFirst({
          where: {
            id: data.ticketId,
            tenantId,
          },
        });

        if (!ticket) {
          throw new Error('Ticket not found or does not belong to this tenant');
        }
      }

      // Validate user if provided
      if (data.userId) {
        const user = await this.prisma.user.findFirst({
          where: {
            id: data.userId,
            tenantId,
          },
        });

        if (!user) {
          throw new Error('User not found or does not belong to this tenant');
        }
      }

      const activity = await this.prisma.activity.update({
        where: { id: activityId },
        data: {
          type: data.type,
          subject: data.subject,
          description: data.description,
          duration: data.duration,
          outcome: data.outcome,
          recordingUrl: data.recordingUrl,
          emailMessageId: data.emailMessageId,
          metadata: data.metadata,
          contactId: data.contactId,
          dealId: data.dealId,
          ticketId: data.ticketId,
          userId: data.userId,
          occurredAt: data.occurredAt,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Activity updated: ${activityId} for tenant: ${tenantId}`);
      return activity;
    } catch (error: any) {
      logger.error(`Error updating activity ${activityId} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Delete activity
   */
  async deleteActivity(tenantId: string, activityId: string) {
    try {
      // Check if activity exists in tenant
      const activity = await this.prisma.activity.findFirst({
        where: {
          id: activityId,
          tenantId,
        },
      });

      if (!activity) {
        return null;
      }

      await this.prisma.activity.delete({
        where: { id: activityId },
      });

      logger.info(`Activity deleted: ${activityId} for tenant: ${tenantId}`);
      return activity;
    } catch (error: any) {
      logger.error(`Error deleting activity ${activityId} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    tenantId: string,
    filters: {
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const { userId, startDate, endDate } = filters;

      // Build base where clause
      const baseWhere: any = { tenantId };

      // Filter by user
      if (userId) {
        baseWhere.userId = userId;
      }

      // Filter by date range
      if (startDate || endDate) {
        baseWhere.occurredAt = {};
        if (startDate) {
          baseWhere.occurredAt.gte = new Date(startDate);
        }
        if (endDate) {
          baseWhere.occurredAt.lte = new Date(endDate);
        }
      }

      // Get total activities
      const total = await this.prisma.activity.count({
        where: baseWhere,
      });

      // Get activities by type
      const activitiesByType = await this.prisma.activity.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: { type: true },
      });

      const typeStats = activitiesByType.map((item: any) => ({
        type: item.type,
        count: item._count.type,
      }));

      // Get activities by user (only if not filtering by user)
      let userStats: any[] = [];
      if (!userId) {
        const activitiesByUser = await this.prisma.activity.groupBy({
          by: ['userId'],
          where: baseWhere,
          _count: { userId: true },
        });

        userStats = await Promise.all(
          activitiesByUser.map(async (item: any) => {
            const user = await this.prisma.user.findUnique({
              where: { id: item.userId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            });

            return {
              userId: item.userId,
              userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
              userEmail: user?.email,
              count: item._count.userId,
            };
          })
        );
      }

      // Get call statistics
      const callActivities = await this.prisma.activity.findMany({
        where: {
          ...baseWhere,
          type: 'CALL',
        },
        select: {
          duration: true,
          outcome: true,
        },
      });

      const totalCalls = callActivities.length;
      const totalCallDuration = callActivities.reduce(
        (sum: number, activity: any) => sum + (activity.duration || 0),
        0
      );
      const avgCallDuration = totalCalls > 0 ? Math.round(totalCallDuration / totalCalls) : 0;

      // Count call outcomes
      const callOutcomes: any = {};
      callActivities.forEach((activity: any) => {
        if (activity.outcome) {
          callOutcomes[activity.outcome] = (callOutcomes[activity.outcome] || 0) + 1;
        }
      });

      // Get email statistics
      const emailActivities = await this.prisma.activity.count({
        where: {
          ...baseWhere,
          type: 'EMAIL',
        },
      });

      // Get meeting statistics
      const meetingActivities = await this.prisma.activity.findMany({
        where: {
          ...baseWhere,
          type: 'MEETING',
        },
        select: {
          duration: true,
        },
      });

      const totalMeetings = meetingActivities.length;
      const totalMeetingDuration = meetingActivities.reduce(
        (sum: number, activity: any) => sum + (activity.duration || 0),
        0
      );
      const avgMeetingDuration =
        totalMeetings > 0 ? Math.round(totalMeetingDuration / totalMeetings) : 0;

      // Get recent activities
      const recentActivities = await this.prisma.activity.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { occurredAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        total,
        byType: typeStats,
        byUser: userStats,
        calls: {
          total: totalCalls,
          totalDuration: totalCallDuration,
          avgDuration: avgCallDuration,
          outcomes: callOutcomes,
        },
        emails: {
          total: emailActivities,
        },
        meetings: {
          total: totalMeetings,
          totalDuration: totalMeetingDuration,
          avgDuration: avgMeetingDuration,
        },
        recent: recentActivities,
      };
    } catch (error: any) {
      logger.error(`Error fetching activity stats for tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

export default new ActivityService();
