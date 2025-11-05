# Tawasol CRM Backend - Architecture & Implementation Summary

## Overview

This is a modern, API-first, multi-tenant CRM backend built with:
- **Node.js + Express.js** for the server
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **MySQL** as the database
- **JWT** for authentication

## Multi-Tenancy Architecture

### How It Works

1. **Organization as Tenant**: Each organization is a separate tenant with isolated data
2. **User Belongs to Organization**: Every user belongs to exactly one organization
3. **Data Isolation**: All primary entities (Contacts, Deals, Tickets) have an `organizationId` foreign key
4. **Automatic Filtering**: The authentication middleware extracts the user's `organizationId` from the JWT token
5. **Service Layer Enforcement**: All queries in services MUST include the `organizationId` filter

### Implementation Pattern

```typescript
// In service layer - ALWAYS filter by organizationId
const contacts = await prisma.contact.findMany({
  where: {
    organizationId, // ← CRITICAL for multi-tenancy
    // ... other filters
  },
});
```

## Database Schema

### Core Models

1. **Organization**
   - The tenant entity
   - Has many: Users, Contacts, Deals, Tickets
   - Fields: id, name, slug, domain

2. **User**
   - Represents employees
   - Belongs to: Organization
   - Has many: Deals (as owner), Tickets (as assignee), Tasks
   - Fields: email, password (hashed), firstName, lastName, role, organizationId

3. **Contact**
   - Represents customers
   - Belongs to: Organization
   - Has many: Deals, Tickets, Tasks
   - Fields: firstName, lastName, email, phone, company, position, status, organizationId

4. **Deal**
   - Represents sales opportunities
   - Belongs to: Organization, Contact, User (owner)
   - Fields: title, value, stage, probability, organizationId, contactId, ownerId

5. **Ticket**
   - Represents support tickets
   - Belongs to: Organization, Contact, User (assignee)
   - Fields: subject, description, status, priority, organizationId, contactId, assigneeId

6. **Task**
   - Represents activities
   - Belongs to: User
   - Can link to: Contact, Deal, or Ticket (optional)
   - Fields: title, description, dueDate, completed, userId, contactId?, dealId?, ticketId?

### Relationships Summary

```
Organization (1) ──< (N) User
Organization (1) ──< (N) Contact
Organization (1) ──< (N) Deal
Organization (1) ──< (N) Ticket

Contact (1) ──< (N) Deal
Contact (1) ──< (N) Ticket
Contact (1) ──< (N) Task

User (1) ──< (N) Deal (as owner)
User (1) ──< (N) Ticket (as assignee)
User (1) ──< (N) Task

Deal (1) ──< (N) Task
Ticket (1) ──< (N) Task
```

## Module Architecture (3-Layer Pattern)

Each feature module follows a consistent 3-layer architecture:

### 1. Routes Layer (`*.routes.ts`)
- Defines HTTP endpoints
- Applies middleware (auth, validation)
- Delegates to controller

```typescript
router.get('/', authenticate, tenantIsolation, (req, res, next) => {
  controller.getAll(req, res).catch(next);
});
```

### 2. Controller Layer (`*.controller.ts`)
- Handles HTTP request/response
- Extracts data from req (params, query, body)
- Calls service layer
- Sends response

```typescript
async getAll(req: AuthRequest, res: Response) {
  const organizationId = req.user!.organizationId;
  const filters = { /* extract from req.query */ };
  const result = await service.getAll(organizationId, filters);
  res.json(result);
}
```

### 3. Service Layer (`*.service.ts`)
- Contains business logic
- Performs database operations (with Prisma)
- Handles validation and errors
- **ALWAYS includes organizationId in queries**

```typescript
async getAll(organizationId: string, filters: any) {
  return await prisma.model.findMany({
    where: { organizationId, ...filters },
  });
}
```

## Authentication Flow

### Registration
1. User submits: organizationName, firstName, lastName, email, password
2. Backend creates Organization and User in a transaction
3. Password is hashed with bcrypt
4. JWT token is generated with user info + organizationId
5. Token returned to client

### Login
1. User submits: email, password
2. Backend finds user, verifies password
3. Checks if user is active
4. Generates JWT with user info + organizationId
5. Token returned to client

### Protected Routes
1. Client sends token in `Authorization: Bearer <token>` header
2. `authenticate` middleware verifies and decodes JWT
3. User info (including organizationId) attached to `req.user`
4. `tenantIsolation` middleware ensures organizationId exists
5. Controller/Service use organizationId for data filtering

## Middleware Pipeline

```
Request
  ↓
CORS
  ↓
Body Parser (JSON)
  ↓
Route Matching
  ↓
authenticate (JWT verification)
  ↓
tenantIsolation (ensure org context)
  ↓
Controller
  ↓
Service (with organizationId filtering)
  ↓
Response
```

## Implemented Features

### ✅ Contacts Module (Full CRUD)

**Endpoints:**
- `GET /api/contacts` - List with filtering, search, pagination
- `GET /api/contacts/stats` - Statistics by status
- `GET /api/contacts/:id` - Get single contact with related data
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

**Features:**
- Tenant-aware queries
- Duplicate email prevention (per organization)
- Search by name, email, company
- Filter by status
- Pagination support
- Related data loading (deals, tickets, tasks)

### ✅ Authentication Module

**Endpoints:**
- `POST /api/auth/register` - Register organization + admin user
- `POST /api/auth/login` - Login and get JWT token

**Features:**
- Organization creation with first admin user
- Password hashing with bcrypt
- JWT token generation
- Email uniqueness validation

### ✅ Core Infrastructure

**Implemented:**
- Prisma client setup
- JWT authentication middleware
- Tenant isolation middleware
- Error handling middleware
- TypeScript configuration
- Development environment setup

## File Structure

```
tawasol-crm/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── lib/
│   │   └── prisma.ts         # Prisma client instance
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT auth
│   │   ├── error.middleware.ts     # Error handling
│   │   └── tenant.middleware.ts    # Tenant isolation
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.routes.ts
│   │   ├── contacts/
│   │   │   ├── contact.controller.ts
│   │   │   ├── contact.routes.ts
│   │   │   └── contact.service.ts
│   │   ├── deals/
│   │   │   └── deal.routes.ts     # Placeholder
│   │   ├── tickets/
│   │   │   └── ticket.routes.ts   # Placeholder
│   │   └── tasks/
│   │       └── task.routes.ts     # Placeholder
│   └── index.ts                   # App entry point
├── docs/
│   ├── PRD.md                     # Product requirements
│   └── QUICKSTART.md              # Quick start guide
├── .env.example                   # Environment template
├── .gitignore
├── nodemon.json                   # Dev server config
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps for Development

### Immediate (Extend Core Functionality)

1. **Deals Module**
   - Copy Contacts pattern
   - Implement deal pipeline stages
   - Link to contacts and users

2. **Tickets Module**
   - Support ticket management
   - Priority and status tracking
   - Assignment to users

3. **Tasks Module**
   - Task creation and management
   - Link to contacts, deals, or tickets
   - Due date tracking

4. **Users Module**
   - User management within organization
   - Role-based access control
   - User profile updates

### Enhanced Features

5. **Input Validation**
   - Use express-validator
   - Validate all inputs
   - Sanitize data

6. **API Documentation**
   - Swagger/OpenAPI
   - Interactive API docs
   - Request/response examples

7. **Advanced Filtering**
   - Date range filters
   - Advanced search
   - Sorting options

8. **Pagination Improvements**
   - Cursor-based pagination
   - Better performance for large datasets

### Production Readiness

9. **Security Enhancements**
   - Rate limiting
   - Request size limits
   - SQL injection prevention (Prisma helps here)
   - XSS protection

10. **Logging & Monitoring**
    - Structured logging (Winston)
    - Request logging
    - Error tracking (Sentry)
    - Performance monitoring

11. **Testing**
    - Unit tests (Jest)
    - Integration tests
    - API tests (Supertest)
    - Test coverage

12. **Database**
    - Database indexing optimization
    - Query performance monitoring
    - Backup strategy
    - Migration strategy

## Key Design Decisions

### Why Multi-Tenancy at Data Level?
- Complete data isolation
- Simpler than separate databases per tenant
- Easier to maintain and scale initially
- Can migrate to separate databases later if needed

### Why 3-Layer Architecture?
- Separation of concerns
- Easier to test each layer
- Flexibility to change implementations
- Clear data flow

### Why Prisma?
- Type-safe database access
- Excellent TypeScript integration
- Automatic migrations
- Great developer experience
- Protection against SQL injection

### Why JWT?
- Stateless authentication
- Works well with mobile apps
- Contains organization context
- Industry standard

## Common Patterns to Follow

### Creating New Endpoints

1. Define route in `*.routes.ts`
2. Add controller method in `*.controller.ts`
3. Implement business logic in `*.service.ts`
4. **ALWAYS** filter by organizationId in service
5. Handle errors with AppError
6. Return consistent response format

### Error Handling

```typescript
// In service
if (!resource) {
  throw new AppError('Resource not found', 404);
}

// Automatically caught by error middleware
```

### Adding Relationships

1. Update `schema.prisma`
2. Run `npm run prisma:migrate`
3. Use Prisma's include/select for loading related data
4. Be mindful of N+1 query problems

## Environment Configuration

Development vs Production:
- Development: Detailed logging, Prisma query logging
- Production: Error logging only, security headers, rate limiting

## Deployment Considerations

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure database connection pooling
4. Enable HTTPS
5. Set up proper CORS
6. Configure reverse proxy (nginx)
7. Use process manager (PM2)
8. Set up monitoring and alerts

---

**This architecture provides a solid foundation for a scalable, maintainable, multi-tenant CRM system while remaining simple enough to understand and extend.**
