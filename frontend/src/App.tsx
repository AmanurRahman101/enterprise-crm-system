import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CallManager } from './components/common/CallManager';
import { CallDiagnostics } from './components/common/CallDiagnostics';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import CustomerLayout from './components/layout/CustomerLayout';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading...</p>
    </div>
  </div>
);

// Lazy load pages (loaded on-demand)
const HomePage = lazy(() => import('./pages/home/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Customer Portal
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerTicketList = lazy(() => import('./pages/customer/CustomerTicketList'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));

// Contacts
const ContactListPage = lazy(() => import('./pages/contacts/ContactListPage'));
const ContactDetailPage = lazy(() => import('./pages/contacts/ContactDetailPage'));
const ContactFormPage = lazy(() => import('./pages/contacts/ContactFormPage'));

// Companies
const CompanyListPage = lazy(() => import('./pages/companies/CompanyListPage'));
const CompanyDetailPage = lazy(() => import('./pages/companies/CompanyDetailPage'));
const CompanyFormPage = lazy(() => import('./pages/companies/CompanyFormPage'));

// Deals
const DealListPage = lazy(() => import('./pages/deals/DealListPage'));
const DealDetailPage = lazy(() => import('./pages/deals/DealDetailPage'));
const DealFormPage = lazy(() => import('./pages/deals/DealFormPage'));
const DealKanbanPage = lazy(() => import('./pages/deals/DealKanbanPage'));

// Tickets
const TicketListPage = lazy(() => import('./pages/tickets/TicketListPage'));
const TicketDetailPage = lazy(() => import('./pages/tickets/TicketDetailPage'));
const TicketFormPage = lazy(() => import('./pages/tickets/TicketFormPage'));

// Tasks
const TaskListPage = lazy(() => import('./pages/tasks/TaskListPage'));
const TaskDetailPage = lazy(() => import('./pages/tasks/TaskDetailPage'));
const TaskFormPage = lazy(() => import('./pages/tasks/TaskFormPage'));

// Settings
const StageManagementPage = lazy(() => import('./pages/settings/StageManagementPage'));
const GeneralSettingsPage = lazy(() => import('./pages/settings/GeneralSettingsPage'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));

// Notes
const NoteListPage = lazy(() => import('./pages/notes/NoteListPage'));
const NoteFormPage = lazy(() => import('./pages/notes/NoteFormPage'));
const NoteDetailPage = lazy(() => import('./pages/notes/NoteDetailPage'));

// Activities
const ActivityListPage = lazy(() => import('./pages/activities/ActivityListPage'));
const ActivityFormPage = lazy(() => import('./pages/activities/ActivityFormPage'));
const ActivityDetailPage = lazy(() => import('./pages/activities/ActivityDetailPage'));

// Users
const UserListPage = lazy(() => import('./pages/users/UserListPage'));
const UserFormPage = lazy(() => import('./pages/users/UserFormPage'));
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'));

function App() {
  return (
    <AuthProvider>
      <CallManager />
      <CallDiagnostics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        
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
          
          {/* Note routes */}
          <Route path="notes" element={<NoteListPage />} />
          <Route path="notes/new" element={<NoteFormPage />} />
          <Route path="notes/:id" element={<NoteDetailPage />} />
          <Route path="notes/:id/edit" element={<NoteFormPage />} />
          
          {/* Activity routes */}
          <Route path="activities" element={<ActivityListPage />} />
          <Route path="activities/new" element={<ActivityFormPage />} />
          <Route path="activities/:id" element={<ActivityDetailPage />} />
          <Route path="activities/:id/edit" element={<ActivityFormPage />} />
          
          {/* User Management routes (Admin only) */}
          <Route
            path="users"
            element={
              <ProtectedRoute requireAdmin>
                <UserListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users/:id"
            element={
              <ProtectedRoute requireAdmin>
                <UserDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <ProtectedRoute requireAdmin>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          
          {/* Settings routes */}
          <Route path="settings" element={<GeneralSettingsPage />} />
          <Route path="settings/stages" element={<StageManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Customer Portal Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute requireCustomer>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="tickets" element={<CustomerTicketList />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        {/* Catch all - redirect to home page */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
