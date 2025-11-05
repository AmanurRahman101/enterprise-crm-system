import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (invalid/expired token)
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API Service methods
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post('/auth/register', data),
};

export const contactsAPI = {
  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/contacts', { params }),
  
  getById: (id: string) =>
    api.get(`/contacts/${id}`),
  
  create: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    status?: string;
  }) => api.post('/contacts', data),
  
  update: (id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    status?: string;
  }>) => api.put(`/contacts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
  
  getStats: () =>
    api.get('/contacts/stats'),
};

export default api;
