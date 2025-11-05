# Tawasol CRM - Architecture Overview

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Multi-Tenancy](#multi-tenancy)
6. [Authentication Flow](#authentication-flow)
7. [Module Structure](#module-structure)
8. [Database Design](#database-design)
9. [API Patterns](#api-patterns)

---

## System Overview

**Tawasol CRM** is a multi-tenant Customer Relationship Management system designed to help businesses manage:
- 👥 **Contacts & Companies**: Customer and prospect information
- 💰 **Deals**: Sales pipeline and opportunity tracking
- 📋 **Tasks**: Work management and to-do lists
- 🎫 **Tickets**: Customer support and helpdesk
- 📊 **Activities**: Timeline of all customer interactions (calls, emails, meetings)

### Key Features
- ✅ **Multi-tenant architecture** - Complete data isolation per organization
- ✅ **Subdomain-based routing** - Each tenant has their own subdomain (acme.tawasol.com)
- ✅ **Role-based access control** - Admin, Manager, Sales, Support roles
- ✅ **Real-time updates** - Socket.IO for live notifications
- ✅ **RESTful API** - Clean, predictable API design
- ✅ **Type-safe** - Full TypeScript implementation

---

## Architecture Pattern

We follow a **3-Layer Architecture** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  (React Frontend, Mobile App, External Integrations)        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS Requests
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                          │
│  - Request validation                                        │
│  - Authentication/Authorization checks                       │
│  - Input sanitization                                        │
│  - Response formatting                                       │
└────────────────────┬────────────────────────────────────────┘
                     │ Function Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  - Business logic                                            │
│  - Data validation                                           │
│  - Tenant isolation enforcement                              │
│  - Complex queries and calculations                          │
└────────────────────┬────────────────────────────────────────┘
                     │ Prisma ORM Queries
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│              PostgreSQL with Prisma ORM                      │
└─────────────────────────────────────────────────────────────┘
```

### Why This Pattern?

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Testability**: Easy to test each layer independently
3. **Maintainability**: Changes in one layer don't affect others
4. **Scalability**: Can optimize or replace layers without full rewrite

---

## Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Language**: TypeScript 5.3.3
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.22.0
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Validation**: Custom middleware + Prisma validation

### Frontend (Coming Soon)
- **Framework**: React 18+
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **API Client**: Axios

### Mobile (Coming Soon)
- **Framework**: React Native
- **Navigation**: React Navigation

---

## Project Structure

```
tawasol/
├── backend/
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoint definitions
│   │   ├── middleware/      # Auth, tenant, error handling
│   │   ├── utils/           # Helper functions (logger, etc.)
│   │   ├── types/           # TypeScript type definitions
│   │   └── server.ts        # Application entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── api-tests-*.http     # API test files (REST Client)
│   └── package.json
├── frontend/                # React web application (coming soon)
├── mobile/                  # React Native app (coming soon)
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # This file
│   ├── BACKEND.md           # Backend setup guide
│   ├── DATABASE.md          # Database schema docs
│   └── API.md               # API documentation (coming soon)
├── README.md               # Project overview
└── SETUP.md                # Quick setup guide
```

---

## Multi-Tenancy

### What is Multi-Tenancy?

Multi-tenancy means **one application serves multiple customers (tenants)**, with complete data isolation between them.

### How It Works in Tawasol

#### 1. Subdomain-Based Identification
```
acme.tawasol.com      → Tenant: "acme"
techstart.tawasol.com → Tenant: "techstart"
```

#### 2. Database-Level Isolation
Every table has a `tenantId` column:
```sql
SELECT * FROM contacts WHERE tenantId = 'acme-tenant-id';
```

#### 3. Middleware Enforcement
```typescript
// Every request automatically includes tenant context
app.use(tenantMiddleware);  // Extracts tenant from subdomain
app.use(authenticate);       // Verifies user belongs to tenant
app.use(requireTenant);      // Ensures tenant exists
```

#### 4. Service-Level Validation
```typescript
// Services ALWAYS filter by tenantId
async getContacts(tenantId: string) {
  return prisma.contact.findMany({
    where: { tenantId }  // ✅ Automatic isolation
  });
}
```

### Benefits
- ✅ **Cost-effective**: Single database for all tenants
- ✅ **Secure**: Impossible to access another tenant's data
- ✅ **Scalable**: Add new tenants without infrastructure changes
- ✅ **Maintainable**: One codebase for all customers

---

## Authentication Flow

### 1. User Login
```
User → POST /api/auth/login
     → Headers: X-Tenant: acme
     → Body: { email, password }
```

### 2. Token Generation
```typescript
// Server creates JWT with tenant info
const token = jwt.sign({
  userId: user.id,
  tenantId: user.tenantId,
  email: user.email,
  role: user.role
}, JWT_SECRET);
```

### 3. Authenticated Requests
```
Client → GET /api/contacts
      → Headers: 
          Authorization: Bearer <token>
          X-Tenant: acme
```

### 4. Middleware Validation
```typescript
// 1. Extract subdomain → tenant lookup
// 2. Verify JWT token
// 3. Check user belongs to tenant
// 4. Attach tenant & user to request
req.tenant = { id: '...', subdomain: 'acme' }
req.user = { userId: '...', role: 'SALES' }
```

---

## Module Structure

Each module follows the **same consistent pattern**:

### Example: Contact Module

#### 1. Service (`ContactService.ts`)
```typescript
class ContactService {
  async createContact(tenantId: string, data: ContactInput) {
    // ✅ Business logic
    // ✅ Validation
    // ✅ Database operations
    return prisma.contact.create({
      data: { ...data, tenantId }
    });
  }
  
  async getContacts(tenantId: string, filters: Filters) {
    // ✅ Build complex queries
    // ✅ Pagination
    // ✅ Filtering & sorting
  }
}
```

#### 2. Controller (`contactController.ts`)
```typescript
export const createContact = async (req: Request, res: Response) => {
  // ✅ Extract data from request
  const { firstName, lastName, email } = req.body;
  
  // ✅ Validate required fields
  if (!firstName || !email) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  // ✅ Call service
  const contact = await ContactService.createContact(
    req.tenant.id,
    { firstName, lastName, email }
  );
  
  // ✅ Return response
  res.status(201).json(contact);
};
```

#### 3. Routes (`contactRoutes.ts`)
```typescript
const router = Router();

// ✅ Apply middleware
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// ✅ Define endpoints
router.post('/', createContact);
router.get('/', getContacts);
router.get('/:id', getContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);
```

#### 4. Registration (`server.ts`)
```typescript
import contactRoutes from './routes/contactRoutes';

app.use('/api/contacts', contactRoutes);
```

### Why This Pattern?

1. **Consistency**: Every module works the same way
2. **Predictability**: Easy to find where functionality lives
3. **Onboarding**: New developers can understand quickly
4. **Maintenance**: Changes follow predictable patterns

---

## Database Design

### Core Principles

1. **Every table has `tenantId`** - Ensures data isolation
2. **UUID primary keys** - Better for distributed systems
3. **Timestamps on everything** - `createdAt`, `updatedAt`
4. **Soft deletes where needed** - Can be recovered
5. **Indexes on foreign keys** - Fast queries

### Entity Relationships

```
Tenant
  ├── Users (admins, sales reps, support)
  ├── Contacts (customers, prospects)
  ├── Companies (organizations)
  │    └── Contacts (employees at companies)
  ├── Deals (sales opportunities)
  │    ├── Contact (primary contact)
  │    ├── Company (optional)
  │    └── PipelineStage
  ├── Tasks
  │    ├── Assignee (User)
  │    ├── Contact (optional)
  │    └── Deal (optional)
  ├── Tickets
  │    ├── Contact (who reported)
  │    └── Assignee (support rep)
  ├── Activities (timeline)
  │    ├── Contact (required)
  │    ├── Deal (optional)
  │    ├── Ticket (optional)
  │    └── User (who performed)
  └── Notes (internal notes)
       ├── Contact (optional)
       ├── Deal (optional)
       └── Ticket (optional)
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `tenants` | Organizations using the system | `subdomain`, `name` |
| `users` | People using the system | `email`, `role`, `tenantId` |
| `contacts` | Customers and prospects | `firstName`, `lastName`, `email` |
| `companies` | Business organizations | `name`, `industry`, `size` |
| `deals` | Sales opportunities | `title`, `value`, `stage`, `probability` |
| `tasks` | Work items | `title`, `status`, `dueDate`, `priority` |
| `tickets` | Support requests | `ticketNumber`, `subject`, `status`, `priority` |
| `activities` | Interaction timeline | `type`, `subject`, `occurredAt` |

---

## API Patterns

### Standard Endpoints

Every resource follows REST conventions:

| Method | Path | Purpose | Example |
|--------|------|---------|---------|
| `POST` | `/api/resource` | Create new item | `POST /api/contacts` |
| `GET` | `/api/resource` | List all items | `GET /api/contacts?page=1&limit=20` |
| `GET` | `/api/resource/:id` | Get single item | `GET /api/contacts/abc-123` |
| `PUT` | `/api/resource/:id` | Update item | `PUT /api/contacts/abc-123` |
| `DELETE` | `/api/resource/:id` | Delete item | `DELETE /api/contacts/abc-123` |
| `GET` | `/api/resource/stats` | Get statistics | `GET /api/contacts/stats` |

### Common Query Parameters

```javascript
// Pagination
?page=1&limit=20

// Search
?search=john

// Filtering
?status=OPEN&priority=HIGH

// Sorting
?sortBy=createdAt&sortOrder=desc

// Date ranges
?startDate=2025-01-01&endDate=2025-01-31

// Current user shortcut
?assigneeId=me  // Automatically uses logged-in user
```

### Standard Response Format

```json
{
  "items": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Error Response Format

```json
{
  "error": "Contact not found",
  "code": "RESOURCE_NOT_FOUND",
  "statusCode": 404
}
```

---

## Quick Reference

### Adding a New Module

1. **Create Service** (`src/services/MyService.ts`)
   - Business logic and database operations
   
2. **Create Controller** (`src/controllers/myController.ts`)
   - HTTP request handlers
   
3. **Create Routes** (`src/routes/myRoutes.ts`)
   - Endpoint definitions with middleware
   
4. **Register in Server** (`src/server.ts`)
   - Add route to Express app
   
5. **Create Tests** (`api-tests-my-module.http`)
   - Comprehensive test scenarios

### Common Patterns

```typescript
// Getting current user's items
if (userId === 'me' || userId === 'current') {
  userId = req.user.userId;
}

// Validating entity belongs to tenant
const contact = await prisma.contact.findFirst({
  where: { id: contactId, tenantId }
});
if (!contact) throw new Error('Not found');

// Building dynamic filters
const where: any = { tenantId };
if (search) {
  where.OR = [
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName: { contains: search, mode: 'insensitive' } }
  ];
}
```

---

## Next Steps

- 📖 Read [DATABASE.md](./DATABASE.md) for schema details
- 🚀 See [BACKEND.md](./BACKEND.md) for setup instructions
- 🧪 Check `api-tests-*.http` files for API examples
- 📝 Review individual module documentation (coming soon)

---

**Questions?** Check the main [README.md](../README.md) or raise an issue!
