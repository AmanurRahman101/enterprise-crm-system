import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CallLogData {
  contactId: string;
  userId: string;
  tenantId: string;
  duration: number; // in seconds
  callType: 'AUDIO' | 'VIDEO';
  status: 'COMPLETED' | 'MISSED' | 'FAILED';
  direction: 'INBOUND' | 'OUTBOUND';
  roomName?: string;
  notes?: string;
}

export class CallService {
  /**
   * Create a call log
   */
  async createCallLog(data: CallLogData) {
    const callLog = await prisma.activity.create({
      data: {
        type: 'CALL',
        subject: `${data.callType} Call`,
        contactId: data.contactId,
        userId: data.userId,
        tenantId: data.tenantId,
        description: `${data.callType} call - ${data.status} (${Math.floor(data.duration / 60)}m ${data.duration % 60}s)`,
        metadata: {
          duration: data.duration,
          callType: data.callType,
          status: data.status,
          direction: data.direction,
          roomName: data.roomName,
          notes: data.notes,
        },
      },
      include: {
        contact: true,
        user: true,
      },
    });

    return callLog;
  }

  /**
   * Get call history for a contact
   */
  async getCallHistoryForContact(contactId: string, tenantId: string, limit = 50) {
    const calls = await prisma.activity.findMany({
      where: {
        type: 'CALL',
        contactId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return calls;
  }

  /**
   * Get call statistics for tenant
   */
  async getCallStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      type: 'CALL',
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalCalls] = await Promise.all([
      prisma.activity.count({ where }),
    ]);

    // Get calls with metadata to calculate total duration
    const calls = await prisma.activity.findMany({
      where,
      select: {
        metadata: true,
      },
    });

    const totalMinutes = calls.reduce((sum, call: any) => {
      const duration = call.metadata?.duration || 0;
      return sum + duration;
    }, 0);

    return {
      totalCalls,
      totalMinutes: Math.floor(totalMinutes / 60),
      totalHours: Math.floor(totalMinutes / 3600),
    };
  }

  /**
   * Get recent calls for user
   */
  async getRecentCallsForUser(userId: string, tenantId: string, limit = 10) {
    const calls = await prisma.activity.findMany({
      where: {
        type: 'CALL',
        userId,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return calls;
  }
}

export default new CallService();
