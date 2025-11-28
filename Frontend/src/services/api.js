// API Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Get current user data
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Get current organization
  getCurrentOrganization() {
    const orgData = localStorage.getItem('currentOrganization');
    return orgData ? JSON.parse(orgData) : null;
  }

  // Set auth token and user data
  setAuth(token, user, currentOrganization, organizations) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('currentOrganization', JSON.stringify(currentOrganization));
    localStorage.setItem('organizations', JSON.stringify(organizations));
  }

  // Clear auth data
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentOrganization');
    localStorage.removeItem('organizations');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || `API request failed: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        if (typeof data === 'object') {
          error.errors = data.errors;
          error.response = data;
        }
        throw error;
      }

      return data;
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error:', error);
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints (userType removed - all users are unified)
  async signup(email, password, fullName, phone) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: { email, password, fullName, phone },
    });
  }

  async signin(email, password) {
    const response = await this.request('/api/auth/signin', {
      method: 'POST',
      body: { email, password },
    });

    if (response.success && response.token) {
      this.setAuth(
        response.token,
        response.user,
        response.currentOrganization,
        response.organizations
      );
    }

    return response;
  }

  async switchOrganization(organizationId) {
    const response = await this.request('/api/auth/switch-organization', {
      method: 'POST',
      body: { organizationId },
    });

    if (response.success && response.token) {
      const currentOrg = response.currentOrganization;
      const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
      const updatedOrgs = organizations.map(org =>
        org.id === currentOrg.id ? { ...org, ...currentOrg } : org
      );

      localStorage.setItem('token', response.token);
      localStorage.setItem('currentOrganization', JSON.stringify(currentOrg));
      localStorage.setItem('organizations', JSON.stringify(updatedOrgs));
    }

    return response;
  }

  // Organization endpoints
  async getOrganizations() {
    return this.request('/api/organizations');
  }

  async createOrganization(name, email, phone, address) {
    const response = await this.request('/api/organizations', {
      method: 'POST',
      body: { name, email, phone, address },
    });

    // If new token is returned (after creating organization), update it
    if (response.success && response.token) {
      const user = this.getUser();
      const organizations = response.organizations || [response.currentOrganization];
      
      this.setAuth(
        response.token,
        user,
        response.currentOrganization,
        organizations
      );
    }

    return response;
  }

  async getOrganization(id) {
    return this.request(`/api/organizations/${id}`);
  }

  async getOrganizationMembers(organizationId) {
    return this.request(`/api/organizations/${organizationId}/members`);
  }

  async addMemberToOrganization(organizationId, email, role = 'agent') {
    return this.request(`/api/organizations/${organizationId}/members`, {
      method: 'POST',
      body: { email, role },
    });
  }

  async updateMemberRole(organizationId, userId, role) {
    return this.request(`/api/organizations/${organizationId}/members/${userId}`, {
      method: 'PUT',
      body: { role },
    });
  }

  async removeMemberFromOrganization(organizationId, userId) {
    return this.request(`/api/organizations/${organizationId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Contact endpoints
  async getAvailableUsers(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/api/contacts/available/users${query}`);
  }

  async getAvailableOrganizations(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/api/contacts/available/organizations${query}`);
  }

  // Telegram linking endpoints
  async getTelegramLinkStatus() {
    return this.request('/api/telegram/link');
  }

  async generateTelegramLinkCode() {
    return this.request('/api/telegram/link', {
      method: 'POST'
    });
  }

  async unlinkTelegram() {
    return this.request('/api/telegram/link', {
      method: 'DELETE'
    });
  }
}

export default new ApiService();

