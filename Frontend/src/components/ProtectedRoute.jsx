import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import ApiService from '../services/api';

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = ApiService.getToken();
      const user = ApiService.getUser();

      if (!token || !user) {
        // No token or user - redirect to signin
        navigate('/auth/signin', { 
          state: { from: location.pathname },
          replace: true 
        });
        return;
      }

      // Verify token is still valid (only on initial load, skip check to speed up)
      // Token validation will happen on first API call
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate, location.pathname]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render outlet (child routes) if authenticated
  return <Outlet />;
};

export default ProtectedRoute;

