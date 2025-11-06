import apiClient from './api';
import { Contact, ContactFormData, ContactListResponse, ContactFilters } from '../types/contact';

export const contactService = {
  /**
   * Get all contacts with pagination and filters
   */
  async getContacts(
    page: number = 1,
    limit: number = 10,
    filters?: ContactFilters
  ): Promise<ContactListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.isCustomer !== undefined) params.append('isCustomer', filters.isCustomer.toString());
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }

    const response = await apiClient.get(`/contacts?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<Contact> {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data.data;
  },

  /**
   * Create a new contact
   */
  async createContact(data: ContactFormData): Promise<Contact> {
    const response = await apiClient.post('/contacts', data);
    return response.data.data;
  },

  /**
   * Update an existing contact
   */
  async updateContact(id: string, data: Partial<ContactFormData>): Promise<Contact> {
    const response = await apiClient.put(`/contacts/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/contacts/${id}`);
  },

  /**
   * Search contacts
   */
  async searchContacts(query: string): Promise<Contact[]> {
    const response = await apiClient.get(`/contacts/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  /**
   * Get contact statistics
   */
  async getStats(): Promise<any> {
    const response = await apiClient.get('/contacts/stats');
    return response.data.data;
  },
};
