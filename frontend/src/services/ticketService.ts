import apiClient from './api';
import { Ticket, TicketFormData, TicketFilters, TicketListResponse } from '../types/ticket';

export const ticketService = {
  // Get paginated list of tickets with optional filters
  async getTickets(
    page: number = 1,
    limit: number = 10,
    filters?: TicketFilters
  ): Promise<TicketListResponse> {
    const params: any = { page, limit };
    
    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.priority) {
      params.priority = filters.priority;
    }
    if (filters?.category) {
      params.category = filters.category;
    }
    if (filters?.assigneeId) {
      params.assigneeId = filters.assigneeId;
    }
    if (filters?.contactId) {
      params.contactId = filters.contactId;
    }

    const response = await apiClient.get('/tickets', { params });
    return response.data;
  },

  // Get a single ticket by ID
  async getTicket(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  // Create a new ticket
  async createTicket(data: TicketFormData): Promise<Ticket> {
    const response = await apiClient.post('/tickets', data);
    return response.data;
  },

  // Update an existing ticket
  async updateTicket(id: string, data: Partial<TicketFormData>): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${id}`, data);
    return response.data;
  },

  // Delete a ticket
  async deleteTicket(id: string): Promise<void> {
    await apiClient.delete(`/tickets/${id}`);
  },

  // Update ticket status
  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    const response = await apiClient.patch(`/tickets/${id}/status`, { status });
    return response.data;
  },

  // Assign ticket to user
  async assignTicket(id: string, assigneeId: string): Promise<Ticket> {
    const response = await apiClient.patch(`/tickets/${id}/assign`, { assigneeId });
    return response.data;
  },

  // Get ticket statistics for dashboard
  async getStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    byPriority: { priority: string; count: number }[];
    avgResolutionTime: number;
  }> {
    const response = await apiClient.get('/tickets/stats');
    return response.data;
  },
};

export default ticketService;
