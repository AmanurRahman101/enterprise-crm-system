import apiClient from './api';
import { Deal, DealFormData, DealFilters, DealListResponse } from '../types/deal';

export const dealService = {
  // Get paginated list of deals with optional filters
  async getDeals(
    page: number = 1,
    limit: number = 10,
    filters?: DealFilters
  ): Promise<DealListResponse> {
    const params: any = { page, limit };
    
    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.stageId) {
      params.stageId = filters.stageId;
    }
    if (filters?.priority) {
      params.priority = filters.priority;
    }
    if (filters?.minValue !== undefined) {
      params.minValue = filters.minValue;
    }
    if (filters?.maxValue !== undefined) {
      params.maxValue = filters.maxValue;
    }
    if (filters?.ownerId) {
      params.ownerId = filters.ownerId;
    }

    const response = await apiClient.get('/deals', { params });
    return response.data;
  },

  // Get a single deal by ID
  async getDeal(id: string): Promise<Deal> {
    const response = await apiClient.get(`/deals/${id}`);
    return response.data;
  },

  // Create a new deal
  async createDeal(data: DealFormData): Promise<Deal> {
    const response = await apiClient.post('/deals', data);
    return response.data;
  },

  // Update an existing deal
  async updateDeal(id: string, data: Partial<DealFormData>): Promise<Deal> {
    const response = await apiClient.put(`/deals/${id}`, data);
    return response.data;
  },

  // Delete a deal
  async deleteDeal(id: string): Promise<void> {
    await apiClient.delete(`/deals/${id}`);
  },

  // Update deal stage
  async updateDealStage(id: string, stage: string): Promise<Deal> {
    const response = await apiClient.put(`/deals/${id}/stage`, { stage });
    // Backend returns the deal directly, not wrapped in data
    return response.data.data || response.data;
  },

  // Get deal statistics for dashboard
  async getStats(): Promise<{
    total: number;
    totalValue: number;
    byStage: { stage: string; count: number; value: number }[];
    wonDeals: number;
    lostDeals: number;
  }> {
    const response = await apiClient.get('/deals/stats');
    return response.data;
  },

  // Get deals by stage (for Kanban view)
  async getDealsByStage(): Promise<{ [key: string]: Deal[] }> {
    const response = await apiClient.get('/deals/by-stage');
    return response.data;
  },
};

export default dealService;
