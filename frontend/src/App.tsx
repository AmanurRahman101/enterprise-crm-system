import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          
          {/* Placeholder routes - will be implemented */}
          <Route path="contacts" element={<Box sx={{ p: 3 }}>Contacts (Coming Soon)</Box>} />
          <Route path="companies" element={<Box sx={{ p: 3 }}>Companies (Coming Soon)</Box>} />
          <Route path="deals" element={<Box sx={{ p: 3 }}>Deals (Coming Soon)</Box>} />
          <Route path="tasks" element={<Box sx={{ p: 3 }}>Tasks (Coming Soon)</Box>} />
          <Route path="tickets" element={<Box sx={{ p: 3 }}>Tickets (Coming Soon)</Box>} />
          <Route path="activities" element={<Box sx={{ p: 3 }}>Activities (Coming Soon)</Box>} />
          <Route path="notes" element={<Box sx={{ p: 3 }}>Notes (Coming Soon)</Box>} />
          
          {/* Admin routes */}
          <Route
            path="users"
            element={
              <ProtectedRoute requireAdmin>
                <Box sx={{ p: 3 }}>Users (Admin Only - Coming Soon)</Box>
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<Box sx={{ p: 3 }}>Settings (Coming Soon)</Box>} />
          <Route path="profile" element={<Box sx={{ p: 3 }}>Profile (Coming Soon)</Box>} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
