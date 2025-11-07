import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
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
import GeneralSettingsPage from './pages/settings/GeneralSettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import NoteListPage from './pages/notes/NoteListPage';
import NoteFormPage from './pages/notes/NoteFormPage';
import NoteDetailPage from './pages/notes/NoteDetailPage';
import ActivityListPage from './pages/activities/ActivityListPage';
import ActivityFormPage from './pages/activities/ActivityFormPage';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import UserListPage from './pages/users/UserListPage';
import UserFormPage from './pages/users/UserFormPage';
import UserDetailPage from './pages/users/UserDetailPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
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

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
