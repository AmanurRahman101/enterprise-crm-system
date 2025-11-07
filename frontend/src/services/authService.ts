import apiClient, { setTenant } from './api';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  AuthUser,
} from '../types';

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials, tenantSubdomain?: string): Promise<AuthResponse> {
    // Only set tenant for business mode
    if (!credentials.isCustomer && tenantSubdomain) {
      setTenant(tenantSubdomain);
    }
    
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      // Store tokens and user
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Store tenant for business mode
      if (!credentials.isCustomer && tenantSubdomain) {
        localStorage.setItem('tenantSubdomain', tenantSubdomain);
      }
    }
    
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterData, tenantSubdomain?: string): Promise<AuthResponse> {
    // Only set tenant for business mode
    if (!data.isCustomer && tenantSubdomain) {
      setTenant(tenantSubdomain);
    }
    
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      // Store tokens and user
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Store tenant for business mode
      if (!data.isCustomer && tenantSubdomain) {
        localStorage.setItem('tenantSubdomain', tenantSubdomain);
      }
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantSubdomain');
    }
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    const response = await apiClient.put('/auth/me', data);
    
    // Update stored user
    if (response.data.success && response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data.data;
  },

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    
    if (response.data.success && response.data.data) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    
    return response.data.data;
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
