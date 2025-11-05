# Development Scripts Guide

## Common Development Tasks

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your database credentials
# (use your favorite text editor)

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Create and run migrations
npm run prisma:migrate
# Enter migration name: init

# 6. Start development server
npm run dev
```

### Daily Development

```bash
# Start development server with hot reload
npm run dev

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Database Operations

```bash
# Create a new migration after schema changes
npm run prisma:migrate
# Enter a descriptive migration name

# Regenerate Prisma Client after schema changes
npm run prisma:generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database (if seed file exists)
npx prisma db seed
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Run production build
npm start
```

### Testing API Endpoints

Use the examples in `docs/QUICKSTART.md` or use a tool like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- cURL (command line)

### Useful Prisma Commands

```bash
# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull database schema (if database already exists)
npx prisma db pull

# Push schema changes without migration (dev only)
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### VS Code Extensions (Recommended)

- Prisma (for schema.prisma syntax highlighting)
- ESLint
- Prettier
- REST Client or Thunder Client (for API testing)

### Troubleshooting

#### Port 3000 already in use
```bash
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or change PORT in .env file
```

#### Prisma Client errors
```bash
# Regenerate Prisma Client
npm run prisma:generate
```

#### Database connection errors
1. Ensure MySQL is running
2. Check DATABASE_URL in .env
3. Test connection: `npx prisma db pull`

#### TypeScript compilation errors
```bash
# Clean build
rm -rf dist
npm run build
```

### Git Workflow

```bash
# Current branch
git status

# Create feature branch
git checkout -b feature/deals-module

# Commit changes
git add .
git commit -m "Implement deals module with full CRUD"

# Push to remote
git push origin feature/deals-module
```

### Code Quality

```bash
# Run TypeScript compiler check (if configured)
npx tsc --noEmit

# Format code (if Prettier is set up)
npx prettier --write "src/**/*.ts"

# Lint code (if ESLint is set up)
npx eslint "src/**/*.ts"
```

## Quick Reference: File Locations

| What | Where |
|------|-------|
| Database schema | `prisma/schema.prisma` |
| Environment config | `.env` |
| App entry point | `src/index.ts` |
| Contacts module | `src/modules/contacts/` |
| Auth module | `src/modules/auth/` |
| Middleware | `src/middleware/` |
| Prisma client | `src/lib/prisma.ts` |

## Module Creation Checklist

When creating a new module (e.g., Deals):

- [ ] Create folder: `src/modules/deals/`
- [ ] Create service: `deal.service.ts`
  - [ ] Import Prisma client
  - [ ] Create DTOs (interfaces)
  - [ ] Implement CRUD methods
  - [ ] **ALWAYS filter by organizationId**
- [ ] Create controller: `deal.controller.ts`
  - [ ] Import service
  - [ ] Extract organizationId from req.user
  - [ ] Handle request/response
- [ ] Create routes: `deal.routes.ts`
  - [ ] Import controller
  - [ ] Apply auth middleware
  - [ ] Apply tenant middleware
  - [ ] Define endpoints
- [ ] Register in `src/index.ts`:
  ```typescript
  import dealRoutes from './modules/deals/deal.routes';
  app.use('/api/deals', dealRoutes);
  ```

## Testing Checklist

Before committing code:

- [ ] Code compiles without errors
- [ ] No linting errors
- [ ] All CRUD operations work
- [ ] Data is isolated by organizationId
- [ ] Error handling works
- [ ] API returns expected responses
- [ ] Authentication required for protected routes
- [ ] Input validation works

## Environment Variables Quick Reference

```env
# Required
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
JWT_SECRET=your-secret-key-make-it-long-and-random

# Optional (with defaults)
PORT=3000
NODE_ENV=development
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## API Testing Templates

### Register Organization
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "organizationName": "Test Company",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@test.com",
  "password": "password123"
}
```

### Login
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@test.com",
  "password": "password123"
}
```

### Create Contact (Protected)
```json
POST http://localhost:3000/api/contacts
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Example Corp",
  "status": "LEAD"
}
```
