# Tawasol CRM - Backend Documentation

## Getting Started

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

4. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── constants.ts  # App constants and enums
│   ├── controllers/      # Route controllers (business logic)
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts      # Authentication & authorization
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── models/           # Database models (Prisma)
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   │   └── logger.ts    # Winston logger
│   ├── types/            # TypeScript type definitions
│   └── server.ts         # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── logs/                 # Application logs
├── uploads/              # File uploads
└── package.json
```

## Architecture

### Layer Structure

1. **Routes Layer** (`routes/`)
   - Define API endpoints
   - Apply middleware
   - Validate requests

2. **Controller Layer** (`controllers/`)
   - Handle HTTP requests/responses
   - Call service layer
   - Return formatted responses

3. **Service Layer** (`services/`)
   - Implement business logic
   - Interact with database (Prisma)
   - Handle external API calls

4. **Model Layer** (`prisma/schema.prisma`)
   - Define data structures
   - Database relationships
   - Validation rules

### Key Design Patterns

- **Dependency Injection**: Services are injected into controllers
- **Repository Pattern**: Data access through Prisma ORM
- **Middleware Chain**: Authentication, validation, rate limiting
- **Error Handling**: Centralized error middleware

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

### Common Response Format
```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "stack": "Stack trace (dev only)"
}
```

## Database Schema

### Core Entities

1. **User** - System users (employees & customers)
2. **Company** - Customer companies
3. **Contact** - Individual contacts
4. **Deal** - Sales opportunities
5. **Task** - Action items
6. **Ticket** - Support tickets
7. **Activity** - Interaction logs
8. **Note** - Internal notes

### Relationships

```
User (1) ----< (M) Contact (Owner)
Contact (M) ----< (1) Company
Contact (1) ----< (M) Deal
Contact (1) ----< (M) Ticket
Contact (1) ----< (M) Activity
Deal (1) ----< (M) Task
```

## Development Guide

### Adding a New Feature

1. **Define the model** in `prisma/schema.prisma`
2. **Run migration**: `npm run prisma:migrate`
3. **Create service** in `src/services/`
4. **Create controller** in `src/controllers/`
5. **Define routes** in `src/routes/`
6. **Add tests** (when implemented)

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use async/await (avoid callbacks)
- Always handle errors
- Log important actions

### Testing

```bash
npm test
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Ensure all required variables are set in production:
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_HOST`
- etc.

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

2. **Module not found errors**
   - Run `npm install`
   - Check tsconfig.json paths

3. **Port already in use**
   - Change PORT in .env
   - Kill process using the port

## Security Considerations

- Never commit .env files
- Use strong JWT secrets
- Enable rate limiting
- Validate all inputs
- Sanitize user data
- Use HTTPS in production
- Keep dependencies updated

## Performance Optimization

- Use Redis for caching
- Implement pagination
- Optimize database queries
- Use indexes appropriately
- Enable compression
- Monitor with logging

## Next Steps

1. Implement authentication endpoints
2. Build contact management APIs
3. Create sales pipeline endpoints
4. Develop task management system
5. Integrate external services
