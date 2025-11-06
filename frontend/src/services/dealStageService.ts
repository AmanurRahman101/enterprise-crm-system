import apiClient from './api';

export interface DealStage {
  id: string;
  tenantId: string;
  name: string;
  order: number;
  color: string;
  probability?: number;
  isDefault: boolean;
  isWon: boolean;
  isLost: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStageData {
  name: string;
  color?: string;
  probability?: number;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

export interface UpdateStageData {
  name?: string;
  color?: string;
  probability?: number;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  isActive?: boolean;
}

export interface StageStats extends DealStage {
  dealCount: number;
  totalValue: number;
}

export const dealStageService = {
  // Get all stages
  async getStages(): Promise<{ success: boolean; data: DealStage[] }> {
    const response = await apiClient.get('/deal-stages');
    return response.data;
  },

  // Get stage statistics
  async getStageStats(): Promise<{ success: boolean; data: StageStats[] }> {
    const response = await apiClient.get('/deal-stages/stats');
    return response.data;
  },

  // Get a single stage
  async getStage(id: string): Promise<{ success: boolean; data: DealStage }> {
    const response = await apiClient.get(`/deal-stages/${id}`);
    return response.data;
  },

  // Create a new stage
  async createStage(data: CreateStageData): Promise<{ success: boolean; data: DealStage }> {
    const response = await apiClient.post('/deal-stages', data);
    return response.data;
  },

  // Update a stage
  async updateStage(id: string, data: UpdateStageData): Promise<{ success: boolean; data: DealStage }> {
    const response = await apiClient.put(`/deal-stages/${id}`, data);
    return response.data;
  },

  // Reorder stages
  async reorderStages(stageIds: string[]): Promise<{ success: boolean; data: DealStage[] }> {
    const response = await apiClient.put('/deal-stages/reorder', { stageIds });
    return response.data;
  },

  // Delete a stage
  async deleteStage(id: string, migrateToStageId?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/deal-stages/${id}`, {
      data: { migrateToStageId },
    });
    return response.data;
  },
};
