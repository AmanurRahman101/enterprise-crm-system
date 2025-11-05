# Tawasol CRM - Frontend

Modern React + TypeScript frontend for the Tawasol CRM system with multi-tenant support.

## 🎯 Features Implemented

### ✅ Core Infrastructure
- **React 18** with **TypeScript 5.3**
- **Material-UI (MUI)** for component library
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Axios** for API communication
- **Socket.IO** client for real-time features

### ✅ Authentication & Authorization
- Multi-tenant login (subdomain-based)
- JWT token management with auto-refresh
- Protected routes with role-based access
- Persistent authentication state
- Secure logout with cleanup

### ✅ UI Components
- **Main Layout** with responsive sidebar navigation
- **App Bar** with user profile menu
- **Protected Route** wrapper with loading states
- **Dashboard** with statistics cards for all modules
- Material-UI theming with custom brand colors

### ✅ Pages
- **Login Page** with tenant selection and demo credentials
- **Dashboard Page** with module statistics and quick actions
- Placeholder routes for all CRM modules

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   │   └── ProtectedRoute.tsx
│   └── layout/          # Layout components
│       └── MainLayout.tsx
├── pages/
│   ├── auth/            # Authentication pages
│   │   └── LoginPage.tsx
│   ├── dashboard/       # Dashboard
│   │   └── DashboardPage.tsx
│   ├── contacts/        # Contacts module
│   ├── companies/       # Companies module
│   ├── deals/           # Deals pipeline
│   ├── tasks/           # Task management
│   ├── tickets/         # Support tickets
│   ├── activities/      # Activity logging
│   ├── notes/           # Notes module
│   └── users/           # User management (admin)
├── services/
│   ├── api.ts           # API client with interceptors
│   └── authService.ts   # Authentication API calls
├── context/
│   └── AuthContext.tsx  # Authentication context & hooks
├── store/
│   └── index.ts         # Redux store configuration
├── types/
│   └── index.ts         # TypeScript type definitions
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
├── App.tsx              # Main app component
└── index.tsx            # React entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:5000`

### Installation

```bash
cd frontend
npm install --legacy-peer-deps
```

### Environment Variables

Create a `.env` file:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_NAME=Tawasol CRM
REACT_APP_VERSION=1.0.0
```

### Run Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🔐 Authentication Flow

1. **Login**: User enters email, password, and tenant subdomain
2. **Token Storage**: JWT tokens stored in localStorage
3. **Auto-Injection**: Axios interceptor adds token + tenant header to all requests
4. **Protected Routes**: Check authentication before rendering
5. **Auto-Logout**: 401 responses trigger logout and redirect

## 🏢 Multi-Tenancy

- Tenant identified by subdomain (e.g., `acme.tawasol.com`)
- Stored in localStorage for persistence
- Injected as `X-Tenant` header in all API requests
- Development default: `acme`

## 🎨 UI/UX

- **Material-UI** components with custom theme
- **Responsive design** (mobile, tablet, desktop)
- **Sidebar navigation** with module links
- **User menu** with profile and logout
- **Loading states** for async operations
- **Error handling** with user-friendly messages

## 📊 Dashboard

- **Statistics cards** for all modules:
  - Contacts (total + customers)
  - Companies
  - Deals (total + value)
  - Tasks (total + pending)
  - Tickets (total + open)
  - Activities (total + this week)
- **Quick actions** section
- **Welcoming user message**

## 🔒 Role-Based Access

- **Admin/Manager**: Access to User Management and Settings
- **All Users**: Access to CRM modules
- Route-level protection with `requireAdmin` prop

## 🧩 Module Routes

| Route | Description | Status |
|-------|-------------|---------|
| `/` | Dashboard | ✅ Implemented |
| `/login` | Login page | ✅ Implemented |
| `/contacts` | Contacts list | 🚧 Placeholder |
| `/companies` | Companies list | 🚧 Placeholder |
| `/deals` | Deals pipeline | 🚧 Placeholder |
| `/tasks` | Task management | 🚧 Placeholder |
| `/tickets` | Support tickets | 🚧 Placeholder |
| `/activities` | Activity timeline | 🚧 Placeholder |
| `/notes` | Notes | 🚧 Placeholder |
| `/users` | User management (admin) | 🚧 Placeholder |
| `/settings` | Settings | 🚧 Placeholder |
| `/profile` | User profile | 🚧 Placeholder |

## 🧪 Testing

```bash
npm test
```

## 🎯 Next Steps

1. **Contacts Module**
   - List view with search/filters
   - Detail view with tabs
   - Create/edit forms
   - Pagination

2. **Companies Module**
   - Company list
   - Company details with contacts
   - CRUD operations

3. **Deals Pipeline**
   - Kanban board by stage
   - Deal cards with progress
   - Drag-and-drop stage changes

4. **Tasks & Tickets**
   - List views with filters
   - Status management
   - Assignment features

5. **Activities & Notes**
   - Timeline views
   - Inline creation
   - Rich text support

6. **User Management**
   - User list (admin)
   - Role management
   - Activity tracking

## 🔧 Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📦 Dependencies

### Core
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.1
- typescript: ^5.3.3

### State Management
- @reduxjs/toolkit: ^2.0.1
- react-redux: ^9.0.4

### UI
- @mui/material: ^5.15.0
- @mui/icons-material: ^5.15.0
- @emotion/react: ^11.11.1
- @emotion/styled: ^11.11.0

### API & Real-time
- axios: ^1.6.2
- socket.io-client: ^4.6.2

### Testing
- @testing-library/react: ^14.1.2
- @testing-library/jest-dom: ^6.1.5
- @testing-library/user-event: ^14.5.1

## 🎨 Theme & Styling

Custom Material-UI theme with:
- Primary color: `#1976d2` (blue)
- Secondary color: `#dc004e` (pink)
- Custom typography
- Responsive breakpoints

## 📝 Demo Credentials

**Tenant:** acme  
**Email:** john@acme.com  
**Password:** password123

---

Built with ❤️ using React + TypeScript + Material-UI
