# Tawasol CRM Backend

A modern, API-first, multi-tenant CRM backend built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL (PostgreSQL compatible)
- **ORM**: Prisma
- **Authentication**: JWT

## 📁 Project Structure

```
src/
├── lib/                    # Core libraries
│   └── prisma.ts          # Prisma client instance
├── middleware/            # Express middleware
│   ├── auth.middleware.ts # JWT authentication
│   ├── error.middleware.ts # Error handling
│   └── tenant.middleware.ts # Multi-tenancy isolation
├── modules/               # Feature modules
│   ├── auth/             # Authentication module
│   │   └── auth.routes.ts
│   ├── contacts/         # Contacts module
│   │   ├── contact.controller.ts
│   │   ├── contact.routes.ts
│   │   └── contact.service.ts
│   ├── deals/            # Deals module (placeholder)
│   ├── tickets/          # Tickets module (placeholder)
│   └── tasks/            # Tasks module (placeholder)
└── index.ts              # Application entry point
```

## 🗄️ Database Schema

The database schema includes the following models:

- **Organization**: The tenant (multi-tenancy)
- **User**: Employees belonging to an organization
- **Contact**: Customers with deals and tickets
- **Deal**: Sales opportunities
- **Ticket**: Support tickets
- **Task**: Activities linked to contacts, deals, or tickets

All models implement multi-tenancy through `organizationId` foreign keys.

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your MySQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Frontend URL for CORS

### 3. Setup Database

Generate Prisma client:
```bash
npm run prisma:generate
```

Run database migrations:
```bash
npm run prisma:migrate
```

### 4. Run the Application

Development mode (with hot reload):
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new organization and admin user
- `POST /api/auth/login` - Login user

### Contacts (Protected Routes)

All contact routes require JWT authentication and are tenant-isolated:

- `GET /api/contacts` - Get all contacts (with filtering and pagination)
- `GET /api/contacts/stats` - Get contact statistics
- `GET /api/contacts/:id` - Get single contact by ID
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

#### Query Parameters for GET /api/contacts:
- `status`: Filter by contact status (ACTIVE, INACTIVE, LEAD, CUSTOMER)
- `search`: Search by name, email, or company
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

## 🔐 Authentication Flow

1. **Register**: Create a new organization and admin user
   ```json
   POST /api/auth/register
   {
     "organizationName": "Acme Corp",
     "firstName": "John",
     "lastName": "Doe",
     "email": "john@acme.com",
     "password": "securepassword"
   }
   ```

2. **Login**: Get JWT token
   ```json
   POST /api/auth/login
   {
     "email": "john@acme.com",
     "password": "securepassword"
   }
   ```

3. **Use Token**: Include in Authorization header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## 🏢 Multi-Tenancy

All data is isolated by `organizationId`. The authentication middleware extracts the user's organization from the JWT token, and all database queries automatically filter by this organization ID to ensure data isolation between tenants.

## 🔧 Key Features

### Contacts Module (Full Implementation)

The Contacts module demonstrates the complete CRUD pattern:

1. **Service Layer** (`contact.service.ts`):
   - Tenant-aware queries (all queries include `organizationId`)
   - Full CRUD operations
   - Business logic and validation
   - Error handling

2. **Controller Layer** (`contact.controller.ts`):
   - Request/response handling
   - Input validation
   - Delegates to service layer

3. **Routes Layer** (`contact.routes.ts`):
   - Route definitions
   - Middleware application (auth, tenant isolation)
   - Route documentation

### Middleware

- **Authentication**: JWT-based authentication
- **Tenant Isolation**: Ensures data isolation between organizations
- **Error Handling**: Centralized error handling with custom error types

## 📝 Development Guidelines

### Adding New Modules

Follow the established pattern in the Contacts module:

1. Create a new folder in `src/modules/`
2. Implement `service.ts` with tenant-aware queries
3. Implement `controller.ts` for request handling
4. Implement `routes.ts` with authentication and tenant middleware
5. Register routes in `src/index.ts`

### Tenant-Aware Queries

Always include `organizationId` in queries:

```typescript
const items = await prisma.model.findMany({
  where: {
    organizationId, // Always required!
    // ... other filters
  },
});
```

## 🚧 Next Steps

The following modules are placeholders and need implementation following the Contacts module pattern:

- [ ] Deals module
- [ ] Tickets module
- [ ] Tasks module
- [ ] Users management
- [ ] Organization settings
- [ ] Input validation with express-validator
- [ ] API documentation with Swagger/OpenAPI
- [ ] Unit and integration tests
- [ ] Rate limiting
- [ ] Logging

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [JWT.io](https://jwt.io/)

## 📄 License

ISC
