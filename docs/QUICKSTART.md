# Quick Start Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database credentials.

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```
   When prompted for migration name, use: `init`

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Testing the API

### 1. Register a New Organization

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Acme Corporation",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@acme.com",
    "password": "password123"
  }'
```

Save the returned token!

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acme.com",
    "password": "password123"
  }'
```

### 3. Create a Contact

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": "Example Inc",
    "position": "CEO",
    "status": "LEAD"
  }'
```

### 4. Get All Contacts

```bash
curl http://localhost:3000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Get Contact by ID

```bash
curl http://localhost:3000/api/contacts/CONTACT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Update Contact

```bash
curl -X PUT http://localhost:3000/api/contacts/CONTACT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "CUSTOMER"
  }'
```

### 7. Delete Contact

```bash
curl -X DELETE http://localhost:3000/api/contacts/CONTACT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Useful Commands

### Prisma Commands

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database
npx prisma studio
```

### Development Commands

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/dbname` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## Common Issues

### Database Connection Errors

If you get database connection errors:
1. Ensure MySQL is running
2. Check your `DATABASE_URL` in `.env`
3. Verify database credentials

### Prisma Client Not Found

If you see "Cannot find module '@prisma/client'":
```bash
npm run prisma:generate
```

### Port Already in Use

If port 3000 is in use, change `PORT` in `.env`:
```
PORT=3001
```

## Project Structure Overview

```
src/
├── index.ts                      # App entry point
├── lib/
│   └── prisma.ts                # Prisma client
├── middleware/
│   ├── auth.middleware.ts       # JWT authentication
│   ├── error.middleware.ts      # Error handling
│   └── tenant.middleware.ts     # Multi-tenancy
└── modules/
    ├── auth/
    │   └── auth.routes.ts       # Auth endpoints
    └── contacts/
        ├── contact.controller.ts # Request handlers
        ├── contact.routes.ts     # Route definitions
        └── contact.service.ts    # Business logic
```

## Next Steps

1. ✅ Set up the project (completed)
2. ✅ Create database schema (completed)
3. ✅ Implement Contacts module (completed)
4. 🔲 Implement Deals module (following same pattern)
5. 🔲 Implement Tickets module
6. 🔲 Implement Tasks module
7. 🔲 Add input validation
8. 🔲 Add API documentation
9. 🔲 Add tests
