import apiClient from './api';

export interface CustomerTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    logo?: string;
  };
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  email: string;
  phone?: string;
}

export interface CreateCustomerTicketData {
  tenantSubdomain: string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
}

export const customerTicketService = {
  /**
   * Create a new ticket as a customer
   */
  async createTicket(data: CreateCustomerTicketData) {
    const response = await apiClient.post('/customer/tickets', data);
    return response.data;
  },

  /**
   * Get all tickets for the current customer
   */
  async getMyTickets(filters?: { status?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/customer/tickets?${queryString}` : '/customer/tickets';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get a specific ticket by ID
   */
  async getTicket(ticketId: string) {
    const response = await apiClient.get(`/customer/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Get list of companies the customer has interacted with
   */
  async getMyCompanies() {
    const response = await apiClient.get('/customer/companies');
    return response.data;
  },

  /**
   * Get all available companies for creating tickets
   */
  async getAvailableCompanies() {
    const response = await apiClient.get('/customer/available-companies');
    return response.data;
  },
};
