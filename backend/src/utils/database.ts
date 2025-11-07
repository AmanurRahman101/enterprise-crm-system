import { prisma } from '../config/database';
import logger from './logger';

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

/**
 * Check if database is healthy
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      isHealthy: true,
      latency,
    };
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [
      userCount,
      companyCount,
      contactCount,
      dealCount,
      taskCount,
      ticketCount,
      activityCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.task.count(),
      prisma.ticket.count(),
      prisma.activity.count(),
    ]);

    return {
      users: userCount,
      companies: companyCount,
      contacts: contactCount,
      deals: dealCount,
      tasks: taskCount,
      tickets: ticketCount,
      activities: activityCount,
      totalRecords: userCount + companyCount + contactCount + dealCount + taskCount + ticketCount + activityCount,
    };
  } catch (error) {
    logger.error('Error fetching database stats:', error);
    throw error;
  }
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function calculatePagination(page: number = 1, limit: number = 20, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
}

export function getPaginationParams(page?: number, limit?: number) {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(100, Math.max(1, limit || 20));
  const skip = (normalizedPage - 1) * normalizedLimit;

  return {
    skip,
    take: normalizedLimit,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}
