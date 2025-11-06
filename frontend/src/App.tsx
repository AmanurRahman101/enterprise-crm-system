import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ContactListPage from './pages/contacts/ContactListPage';
import ContactDetailPage from './pages/contacts/ContactDetailPage';
import ContactFormPage from './pages/contacts/ContactFormPage';
import CompanyListPage from './pages/companies/CompanyListPage';
import CompanyDetailPage from './pages/companies/CompanyDetailPage';
import CompanyFormPage from './pages/companies/CompanyFormPage';
import DealListPage from './pages/deals/DealListPage';
import DealDetailPage from './pages/deals/DealDetailPage';
import DealFormPage from './pages/deals/DealFormPage';
import DealKanbanPage from './pages/deals/DealKanbanPage';
import TicketListPage from './pages/tickets/TicketListPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import TicketFormPage from './pages/tickets/TicketFormPage';
import TaskListPage from './pages/tasks/TaskListPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import TaskFormPage from './pages/tasks/TaskFormPage';
import StageManagementPage from './pages/settings/StageManagementPage';

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
          
          {/* Contact routes */}
          <Route path="contacts" element={<ContactListPage />} />
          <Route path="contacts/new" element={<ContactFormPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="contacts/:id/edit" element={<ContactFormPage />} />
          
          {/* Company routes */}
          <Route path="companies" element={<CompanyListPage />} />
          <Route path="companies/new" element={<CompanyFormPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />
          <Route path="companies/:id/edit" element={<CompanyFormPage />} />
          
          {/* Deal routes */}
          <Route path="deals" element={<DealListPage />} />
          <Route path="deals/kanban" element={<DealKanbanPage />} />
          <Route path="deals/new" element={<DealFormPage />} />
          <Route path="deals/:id" element={<DealDetailPage />} />
          <Route path="deals/:id/edit" element={<DealFormPage />} />
          
          {/* Ticket routes */}
          <Route path="tickets" element={<TicketListPage />} />
          <Route path="tickets/new" element={<TicketFormPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="tickets/:id/edit" element={<TicketFormPage />} />
          
          {/* Task routes */}
          <Route path="tasks" element={<TaskListPage />} />
          <Route path="tasks/new" element={<TaskFormPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="tasks/:id/edit" element={<TaskFormPage />} />
          
          {/* Placeholder routes - will be implemented */}
          <Route path="activities" element={<div className="p-8 text-center text-secondary-600">Activities (Coming Soon)</div>} />
          <Route path="notes" element={<div className="p-8 text-center text-secondary-600">Notes (Coming Soon)</div>} />
          
          {/* Admin routes */}
          <Route
            path="users"
            element={
              <ProtectedRoute requireAdmin>
                <div className="p-8 text-center text-secondary-600">Users (Admin Only - Coming Soon)</div>
              </ProtectedRoute>
            }
          />
          
          {/* Settings routes */}
          <Route path="settings" element={<div className="p-8 text-center text-secondary-600">Settings (Coming Soon)</div>} />
          <Route path="settings/stages" element={<StageManagementPage />} />
          <Route path="profile" element={<div className="p-8 text-center text-secondary-600">Profile (Coming Soon)</div>} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
