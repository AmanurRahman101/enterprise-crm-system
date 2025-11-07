import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateStageDTO {
  name: string;
  color?: string;
  probability?: number;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

export interface UpdateStageDTO {
  name?: string;
  color?: string;
  probability?: number;
  isActive?: boolean;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

class DealStageService {
  /**
   * Get all stages for a tenant
   */
  async getStages(tenantId: string) {
    return prisma.dealStage.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get a single stage by ID
   */
  async getStageById(stageId: string, tenantId: string) {
    const stage = await prisma.dealStage.findFirst({
      where: { id: stageId, tenantId },
    });

    if (!stage) {
      throw new Error('Stage not found');
    }

    return stage;
  }

  /**
   * Create a new stage
   */
  async createStage(tenantId: string, data: CreateStageDTO) {
    // Get the highest order number
    const lastStage = await prisma.dealStage.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { order: 'desc' },
    });

    const order = lastStage ? lastStage.order + 1 : 0;

    // If this stage is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.dealStage.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.dealStage.create({
      data: {
        tenantId,
        name: data.name,
        order,
        color: data.color || '#gray',
        probability: data.probability !== undefined ? data.probability : undefined,
        isDefault: data.isDefault || false,
        isWon: data.isWon || false,
        isLost: data.isLost || false,
        isActive: true,
      },
    });
  }

  /**
   * Update a stage
   */
  async updateStage(stageId: string, tenantId: string, data: UpdateStageDTO) {
    // Verify stage exists and belongs to tenant
    const existingStage = await prisma.dealStage.findFirst({
      where: { id: stageId, tenantId },
    });

    if (!existingStage) {
      throw new Error('Stage not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.dealStage.updateMany({
        where: { tenantId, isDefault: true, id: { not: stageId } },
        data: { isDefault: false },
      });
    }

    return prisma.dealStage.update({
      where: { id: stageId },
      data: {
        name: data.name,
        color: data.color,
        probability: data.probability,
        isActive: data.isActive,
        isDefault: data.isDefault,
        isWon: data.isWon,
        isLost: data.isLost,
      },
    });
  }

  /**
   * Reorder stages
   */
  async reorderStages(tenantId: string, stageIds: string[]) {
    // Verify all stages belong to tenant
    const stages = await prisma.dealStage.findMany({
      where: { id: { in: stageIds }, tenantId },
    });

    if (stages.length !== stageIds.length) {
      throw new Error('Some stages not found');
    }

    // Update order for each stage
    const updates = stageIds.map((stageId, index) =>
      prisma.dealStage.update({
        where: { id: stageId },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    return this.getStages(tenantId);
  }

  /**
   * Delete a stage (soft delete)
   */
  async deleteStage(stageId: string, tenantId: string, migrateToStageId?: string) {
    // Verify stage exists and belongs to tenant
    const existingStage = await prisma.dealStage.findFirst({
      where: { id: stageId, tenantId },
    });

    if (!existingStage) {
      throw new Error('Stage not found');
    }

    // Check if there are deals in this stage
    const dealCount = await prisma.deal.count({
      where: { stageId, tenantId },
    });

    if (dealCount > 0) {
      if (!migrateToStageId) {
        throw new Error(`Cannot delete stage: it has ${dealCount} deals. Provide a migrateToStageId to move them.`);
      }

      // Verify migration target exists
      const targetStage = await prisma.dealStage.findFirst({
        where: { id: migrateToStageId, tenantId, isActive: true },
      });

      if (!targetStage) {
        throw new Error('Migration target stage not found');
      }

      // Move all deals to the target stage
      await prisma.deal.updateMany({
        where: { stageId, tenantId },
        data: { stageId: migrateToStageId },
      });
    }

    // Soft delete the stage
    await prisma.dealStage.update({
      where: { id: stageId },
      data: { isActive: false },
    });

    return { message: 'Stage deleted successfully' };
  }

  /**
   * Get stage statistics
   */
  async getStageStats(tenantId: string) {
    const stages = await prisma.dealStage.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });

    const stageStats = await Promise.all(
      stages.map(async (stage) => {
        const dealCount = await prisma.deal.count({
          where: { stageId: stage.id, tenantId },
        });

        const totalValue = await prisma.deal.aggregate({
          where: { stageId: stage.id, tenantId },
          _sum: { value: true },
        });

        return {
          ...stage,
          dealCount,
          totalValue: totalValue._sum.value || 0,
        };
      })
    );

    return stageStats;
  }
}

export default new DealStageService();
