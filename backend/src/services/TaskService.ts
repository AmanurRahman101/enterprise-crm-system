import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface CreateTaskInput {
  tenantId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assigneeId: string;
  creatorId: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assigneeId?: string;
}

interface GetTasksFilters {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  creatorId?: string;
  contactId?: string;
  dealId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(data: CreateTaskInput) {
    // Validate assignee exists in the tenant
    const assignee = await prisma.user.findFirst({
      where: {
        id: data.assigneeId,
        tenantId: data.tenantId,
      },
    });

    if (!assignee) {
      throw new Error('Assignee not found in this tenant');
    }

    // Validate creator exists in the tenant
    const creator = await prisma.user.findFirst({
      where: {
        id: data.creatorId,
        tenantId: data.tenantId,
      },
    });

    if (!creator) {
      throw new Error('Creator not found in this tenant');
    }

    // If contactId is provided, validate it exists in the tenant
    if (data.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: data.contactId,
          tenantId: data.tenantId,
        },
      });

      if (!contact) {
        throw new Error('Contact not found in this tenant');
      }
    }

    // If dealId is provided, validate it exists in the tenant
    if (data.dealId) {
      const deal = await prisma.deal.findFirst({
        where: {
          id: data.dealId,
          tenantId: data.tenantId,
        },
      });

      if (!deal) {
        throw new Error('Deal not found in this tenant');
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        contactId: data.contactId,
        dealId: data.dealId,
        assigneeId: data.assigneeId,
        creatorId: data.creatorId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * Get task by ID with full details
   */
  async getTaskById(taskId: string, tenantId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: tenantId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        creator: {
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            currency: true,
            stage: true,
            expectedCloseDate: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  /**
   * Get tasks with pagination, search, and filters
   */
  async getTasks(tenantId: string, filters: GetTasksFilters = {}) {
    const {
      status,
      priority,
      assigneeId,
      creatorId,
      contactId,
      dealId,
      dueDateFrom,
      dueDateTo,
      overdue,
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

    // Assignee filter
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Creator filter
    if (creatorId) {
      where.creatorId = creatorId;
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Deal filter
    if (dealId) {
      where.dealId = dealId;
    }

    // Due date range filter
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    // Overdue filter
    if (overdue === true) {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = {
        notIn: ['COMPLETED', 'CANCELLED'],
      };
    }

    // Search filter - search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    return {
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, tenantId: string, data: UpdateTaskInput) {
    // Verify task exists and belongs to tenant
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: tenantId,
      },
    });

    if (!existingTask) {
      throw new Error('Task not found');
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

    // If updating dealId, validate deal exists in tenant
    if (data.dealId) {
      const deal = await prisma.deal.findFirst({
        where: {
          id: data.dealId,
          tenantId: tenantId,
        },
      });

      if (!deal) {
        throw new Error('Deal not found in this tenant');
      }
    }

    // Build update data
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      // If task is being completed, set completedAt
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.dealId !== undefined) updateData.dealId = data.dealId;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, tenantId: string, newStatus: TaskStatus) {
    // Verify task exists and belongs to tenant
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: tenantId,
      },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    const updateData: any = {
      status: newStatus,
    };

    // If task is being completed, set completedAt
    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, tenantId: string) {
    // Verify task exists and belongs to tenant
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: tenantId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Get task statistics
   */
  async getTaskStats(tenantId: string, userId?: string) {
    // Base where clause
    const baseWhere: any = { tenantId };
    
    // If userId provided, filter by tasks assigned to that user
    const userWhere = userId ? { ...baseWhere, assigneeId: userId } : baseWhere;

    // Total tasks
    const totalTasks = await prisma.task.count({
      where: userWhere,
    });

    // Tasks by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: userWhere,
      _count: { status: true },
    });

    const statusStats = tasksByStatus.map((item: any) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: userWhere,
      _count: { priority: true },
    });

    const priorityStats = tasksByPriority.map((item: any) => ({
      priority: item.priority,
      count: item._count.priority,
    }));

    // Tasks by assignee (only if not filtering by user)
    let assigneeStats: any[] = [];
    if (!userId) {
      const tasksByAssignee = await prisma.task.groupBy({
        by: ['assigneeId'],
        where: baseWhere,
        _count: { assigneeId: true },
      });

      assigneeStats = await Promise.all(
        tasksByAssignee.map(async (item: any) => {
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

    // Overdue tasks (not completed/cancelled and due date in the past)
    const now = new Date();
    const overdueTasks = await prisma.task.count({
      where: {
        ...userWhere,
        dueDate: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    // Due today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dueToday = await prisma.task.count({
      where: {
        ...userWhere,
        dueDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    // Due this week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const dueThisWeek = await prisma.task.count({
      where: {
        ...userWhere,
        dueDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    // Completed tasks
    const completedTasks = await prisma.task.count({
      where: {
        ...userWhere,
        status: 'COMPLETED',
      },
    });

    // Tasks created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyAdded = await prisma.task.count({
      where: {
        ...userWhere,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      total: totalTasks,
      byStatus: statusStats,
      byPriority: priorityStats,
      byAssignee: assigneeStats,
      overdue: overdueTasks,
      dueToday,
      dueThisWeek,
      completed: completedTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      recentlyAdded,
    };
  }
}
