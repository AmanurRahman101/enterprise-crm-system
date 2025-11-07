import apiClient from './api';
import { Company, CompanyFormData, CompanyFilters, CompanyListResponse } from '../types/company';

export const companyService = {
  // Get paginated list of companies with optional filters
  async getCompanies(
    page: number = 1,
    limit: number = 10,
    filters?: CompanyFilters
  ): Promise<CompanyListResponse> {
    const params: any = { page, limit };
    
    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.industry) {
      params.industry = filters.industry;
    }
    if (filters?.size) {
      params.size = filters.size;
    }

    const response = await apiClient.get('/companies', { params });
    return response.data;
  },

  // Get a single company by ID
  async getCompany(id: string): Promise<Company> {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data.data || response.data;
  },

  // Create a new company
  async createCompany(data: CompanyFormData): Promise<Company> {
    const response = await apiClient.post('/companies', data);
    return response.data.data || response.data;
  },

  // Update an existing company
  async updateCompany(id: string, data: CompanyFormData): Promise<Company> {
    const response = await apiClient.put(`/companies/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete a company
  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  },

  // Search companies by query
  async searchCompanies(query: string): Promise<Company[]> {
    const response = await apiClient.get('/companies/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Get company statistics for dashboard
  async getStats(): Promise<{ total: number }> {
    const response = await apiClient.get('/companies/stats');
    return response.data.data || response.data;
  },
};

export default companyService;
