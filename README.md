# Tawasol CRM

A modern, API-first, multi-tenant Customer Relationship Management (CRM) system built with a Node.js backend and React frontend.

## 🚀 Overview

Tawasol CRM is a full-stack application designed to help businesses manage customer relationships, deals, support tickets, and tasks. It features:

- **Multi-tenant architecture**: Isolated data for each organization
- **Role-based access control**: Admin, Manager, and Employee roles
- **RESTful API**: Clean API-first backend design
- **Modern UI**: Beautiful, responsive React interface
- **Type-safe**: Built with TypeScript end-to-end

## 🏗 Architecture

### Backend
- **Node.js + Express.js**: RESTful API server
- **TypeScript**: Type safety and better developer experience
- **Prisma ORM**: Type-safe database access
- **MySQL**: Relational database
- **JWT Authentication**: Secure token-based auth
- **3-Layer Pattern**: Routes → Controllers → Services

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe component development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors
- **React Hook Form**: Form validation

## 📁 Project Structure

```
tawasol-crm/
├── backend/              # Node.js/Express API
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── middleware/  # Auth, error, tenant middlewares
│   │   ├── modules/     # Feature modules (auth, contacts, etc.)
│   │   └── lib/         # Shared utilities
│   ├── .env             # Environment variables
│   └── package.json
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth, etc.)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   └── App.tsx
│   └── package.json
│
└── docs/                # Documentation
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT.md
    └── PRD.md
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **MySQL** 5.7+ or 8.0+
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tawasol-crm
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL="mysql://root:password@localhost:3306/tawasol_crm"
# JWT_SECRET="your-secret-key"
# PORT=3000

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start the backend server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Create Your First User

Register an organization and admin user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Your Company",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@yourcompany.com",
    "password": "securepassword"
  }'
```

### 5. Login

1. Open `http://localhost:5173` in your browser
2. Login with the credentials you just created
3. Start managing your contacts!

## 🔑 Features

### ✅ Implemented

- [x] Multi-tenant organization management
- [x] User authentication (JWT)
- [x] Role-based access control
- [x] Contacts management (CRUD)
- [x] Dashboard with stats
- [x] Responsive UI design
- [x] Protected routes
- [x] API error handling

### 🚧 In Progress / Planned

- [ ] Deals pipeline management
- [ ] Support tickets system
- [ ] Task management
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] File attachments
- [ ] Activity logs
- [ ] Reporting and analytics

## 🗄 Database Schema

### Core Models

- **Organization**: Tenant entity
- **User**: Employees with roles (Admin/Manager/Employee)
- **Contact**: Customers and leads
- **Deal**: Sales opportunities with pipeline stages
- **Ticket**: Support tickets with priority levels
- **Task**: Activities and reminders

All models include `organizationId` for tenant isolation.

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register organization + admin
- `POST /api/auth/login` - Login and get JWT token

### Contacts
- `GET /api/contacts` - List contacts (paginated, filtered)
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/stats` - Get contact statistics

All endpoints require authentication via `Authorization: Bearer <token>` header.

## 🎨 UI Preview

### Login Page
- Clean, centered login form
- Email/password validation
- Error feedback

### Dashboard
- Stats cards (Contacts, Deals, Tickets, Tasks)
- Quick action buttons
- Personalized welcome message

### Contacts Page
- Searchable table
- Status badges
- Create/Edit modal with form validation
- Delete confirmation

## 🛠 Development

### Backend Development

```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm run build        # Compile TypeScript
npm start            # Run compiled code
npx prisma studio    # Open database GUI
```

### Frontend Development

```bash
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## 🧪 Testing

Currently, the application can be tested manually:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Register a user via API or create one directly in database
4. Login and test CRUD operations on contacts

## 📝 Environment Variables

### Backend (.env)

```env
DATABASE_URL="mysql://username:password@localhost:3306/tawasol_crm"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### Frontend

No environment variables needed for development. API calls are proxied through Vite.

## 🚀 Deployment

### Backend

1. Build: `npm run build`
2. Set environment variables on your server
3. Run migrations: `npx prisma migrate deploy`
4. Start: `npm start`

### Frontend

1. Build: `npm run build`
2. Serve the `dist/` folder with any static hosting (Nginx, Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for modern CRM needs**
