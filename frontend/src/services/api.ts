import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Get tenant subdomain from localStorage or URL
const getTenantSubdomain = (): string | null => {
  // First check localStorage
  const storedTenant = localStorage.getItem('tenantSubdomain');
  if (storedTenant) return storedTenant;
  
  // For development, use a default tenant
  if (process.env.NODE_ENV === 'development') {
    return 'acme'; // Default dev tenant
  }
  
  // In production, extract from subdomain
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0]; // e.g., 'acme' from 'acme.tawasol.com'
  }
  
  return null;
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: any) => {
    // Add authentication token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant header
    const tenant = getTenantSubdomain();
    if (tenant) {
      config.headers['X-Tenant-Subdomain'] = tenant;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to set tenant
export const setTenant = (subdomain: string) => {
  localStorage.setItem('tenantSubdomain', subdomain);
};

// Helper function to get tenant
export const getTenant = () => {
  return getTenantSubdomain();
};

export default apiClient;
