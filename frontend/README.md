# Tawasol CRM - Frontend

A modern, aesthetic React-based UI for the Tawasol CRM backend. Built with React 18, TypeScript, Tailwind CSS, and Vite.

## 🚀 Features

- **Authentication**: Secure login with JWT token management
- **Dashboard**: Overview of CRM metrics and quick actions
- **Contacts Management**: Full CRUD operations for customer contacts
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Multi-tenant**: Built-in organization isolation

## 🛠 Tech Stack

- **React 18.2** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Hook Form** - Form validation and management

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.tsx    # Main layout with sidebar
│   │   └── ProtectedRoute.tsx  # Route guard component
│   ├── contexts/         # React context providers
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── pages/            # Page components
│   │   ├── Login.tsx     # Login page
│   │   ├── Dashboard.tsx # Dashboard overview
│   │   └── Contacts.tsx  # Contacts management
│   ├── services/         # API services
│   │   └── api.ts        # Axios configuration and API methods
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles and Tailwind setup
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── postcss.config.js     # PostCSS configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend server running on `http://localhost:3000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🔑 Authentication

The application uses JWT-based authentication:

1. Login credentials are sent to `/api/auth/login`
2. JWT token is stored in `localStorage`
3. Token is automatically included in all API requests via Axios interceptor
4. On 401 errors, user is redirected to login page

### Testing the Application

1. **First-time Setup**: Register a new organization and admin user
   - Use the backend API directly or create a registration page
   - Example with curl:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "organizationName": "Test Company",
       "firstName": "John",
       "lastName": "Doe",
       "email": "admin@example.com",
       "password": "password123"
     }'
   ```

2. **Login**: Use the credentials from step 1 to login at `http://localhost:5173/login`

3. **Dashboard**: After login, you'll see the dashboard with stats and quick actions

4. **Contacts**: Navigate to Contacts to create, view, edit, and delete customer contacts

## 🎨 Styling

The application uses a custom Tailwind color palette:

- **Primary colors**: Blue shades (50-900) for main UI elements
- **Utility classes**: Custom classes defined in `index.css`:
  - `btn-primary`: Primary action buttons
  - `btn-secondary`: Secondary action buttons
  - `input-field`: Form input fields
  - `card`: Container cards with shadow

## 📡 API Integration

### Backend Proxy

Vite is configured to proxy `/api` requests to `http://localhost:3000`:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

### API Service

All API calls are centralized in `src/services/api.ts`:

- **authAPI**: Login and registration
- **contactsAPI**: Full CRUD operations for contacts

Example usage:
```typescript
import { contactsAPI } from '../services/api';

// Get all contacts
const response = await contactsAPI.getAll({ status: 'ACTIVE' });

// Create a contact
await contactsAPI.create({
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  status: 'LEAD'
});
```

## 🔐 Protected Routes

Routes are protected using the `ProtectedRoute` component:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  }
/>
```

Unauthenticated users are automatically redirected to `/login`.

## 🧩 Available Pages

### Login (`/login`)
- Email/password authentication
- Form validation with React Hook Form
- Error handling with user feedback

### Dashboard (`/dashboard`)
- Stats overview (Contacts, Deals, Tickets, Tasks)
- Quick action buttons
- Personalized greeting

### Contacts (`/contacts`)
- Searchable/filterable contact table
- Create new contact modal
- Edit existing contacts
- Delete contacts with confirmation
- Status badges (Lead, Active, Customer, Inactive)

## 🚧 Coming Soon

- Deals management
- Tickets support system
- Tasks and activities
- Advanced filtering and search
- Export functionality
- User settings and profile

## 📝 Environment Variables

No environment variables needed for development. The API base URL is hardcoded to `http://localhost:3000/api` for local development.

For production, update the `baseURL` in `src/services/api.ts`.

## 🐛 Troubleshooting

### Backend Connection Issues

If you see connection errors:
1. Ensure the backend is running on `http://localhost:3000`
2. Check CORS configuration in the backend
3. Verify the proxy configuration in `vite.config.ts`

### Authentication Issues

If login fails:
1. Check browser console for error messages
2. Verify credentials are correct
3. Ensure backend `/api/auth/login` endpoint is working
4. Check if JWT_SECRET is configured in backend `.env`

### Build Errors

If build fails:
1. Delete `node_modules` and run `npm install` again
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check TypeScript errors: `npm run build`

## 📄 License

This project is part of the Tawasol CRM system.
