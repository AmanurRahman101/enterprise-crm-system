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

// Dynamically determine the backend URL
const getBackendURL = (): string => {
  // If explicitly set in .env, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Otherwise, use the same host as the frontend but port 5000
  const protocol = window.location.protocol; // http: or https:
  const hostname = window.location.hostname; // localhost or 192.168.1.7
  return `${protocol}//${hostname}:5000/api`;
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBackendURL(),
  timeout: 10000, // Reduced from 30s to 10s - faster failure detection
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: any) => {
    console.log('🔵 [API] Making request:', config.method?.toUpperCase(), config.url);
    console.log('🔵 [API] Base URL:', config.baseURL);
    console.log('🔵 [API] Full URL:', config.baseURL + config.url);
    
    // Add authentication token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔵 [API] Added Authorization header');
    }
    
    // Add tenant header
    const tenant = getTenantSubdomain();
    if (tenant) {
      config.headers['X-Tenant-Subdomain'] = tenant;
      console.log('🔵 [API] Added X-Tenant-Subdomain:', tenant);
    }
    
    console.log('🔵 [API] Request headers:', JSON.stringify(config.headers, null, 2));
    
    return config;
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ [API] Response received:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ [API] Response error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('❌ [API] Unauthorized - clearing auth data');
      // Handle unauthorized - clear auth and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        console.log('❌ [API] Redirecting to login page');
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
