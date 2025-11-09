import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { socketService } from '../services/socketService';
import { AuthUser, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, tenantSubdomain?: string) => Promise<void>;
  register: (data: RegisterData, tenantSubdomain?: string, newTenant?: { name: string; subdomain: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initialize = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const token = localStorage.getItem('accessToken');
        
        if (storedUser && token) {
          // Trust stored user data initially for faster load
          setUser(storedUser);
          setLoading(false);

          // Connect to Socket.IO for real-time features
          socketService.connect(token);
          
          // Verify token in background (optional, non-blocking)
          authService.getMe()
            .then(currentUser => {
              setUser(currentUser);
              localStorage.setItem('user', JSON.stringify(currentUser));
            })
            .catch(error => {
              // If verification fails, clear stored data
              console.error('Background user verification failed:', error);
              authService.logout();
              setUser(null);
              socketService.disconnect();
            });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (credentials: LoginCredentials, tenantSubdomain?: string) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials, tenantSubdomain);
      setUser(response.data.user);
      
      // Connect to Socket.IO - use the correct key 'accessToken'
      const token = localStorage.getItem('accessToken');
      console.log('🔵 [AUTH CONTEXT] Token retrieved:', token ? 'Yes' : 'No');
      if (token) {
        console.log('🔵 [AUTH CONTEXT] Calling socketService.connect()');
        socketService.connect(token);
        console.log('✅ [AUTH CONTEXT] socketService.connect() called');
      } else {
        console.error('❌ [AUTH CONTEXT] No token found, cannot connect socket');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData, tenantSubdomain?: string, newTenant?: { name: string; subdomain: string }) => {
    setLoading(true);
    try {
      const response = await authService.register(data, tenantSubdomain, newTenant);
      setUser(response.data.user);
      
      // Connect to Socket.IO - use the correct key 'accessToken'
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketService.connect(token);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      socketService.disconnect();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (data: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
