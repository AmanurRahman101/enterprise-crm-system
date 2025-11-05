# Tawasol CRM - Visual Reference

Quick visual guides to understand the system architecture and data flow.

---

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Mobile App  │  │  External    │              │
│  │   (React)    │  │   (RN)       │  │  API Clients │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          │  HTTPS Requests (JSON)              │
          │  Headers: Authorization, X-Tenant   │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │      MIDDLEWARE LAYER                │
          │  ┌────────────────────────────────┐  │
          │  │  1. Tenant Identification      │  │
          │  │     Extract subdomain          │  │
          │  │     acme.tawasol.com → acme    │  │
          │  └────────────────────────────────┘  │
          │  ┌────────────────────────────────┐  │
          │  │  2. Authentication             │  │
          │  │     Verify JWT token           │  │
          │  │     Extract user info          │  │
          │  └────────────────────────────────┘  │
          │  ┌────────────────────────────────┐  │
          │  │  3. Authorization              │  │
          │  │     Check user belongs to      │  │
          │  │     tenant, verify role        │  │
          │  └────────────────────────────────┘  │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │      ROUTING LAYER                   │
          │  /api/contacts    → contactRoutes   │
          │  /api/companies   → companyRoutes   │
          │  /api/deals       → dealRoutes      │
          │  /api/tasks       → taskRoutes      │
          │  /api/tickets     → ticketRoutes    │
          │  /api/activities  → activityRoutes  │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │    CONTROLLER LAYER                  │
          │  - Parse request body/params/query   │
          │  - Validate required fields          │
          │  - Call service methods              │
          │  - Format response                   │
          │  - Handle errors                     │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │     SERVICE LAYER                    │
          │  - Business logic                    │
          │  - Complex queries                   │
          │  - Data transformations              │
          │  - Calculations & aggregations       │
          │  - Tenant isolation enforcement      │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │    DATABASE LAYER (Prisma ORM)       │
          │  - SQL query generation              │
          │  - Connection pooling                │
          │  - Type safety                       │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │       PostgreSQL Database            │
          │  - tenants                           │
          │  - users                             │
          │  - contacts                          │
          │  - companies                         │
          │  - deals                             │
          │  - tasks                             │
          │  - tickets                           │
          │  - activities                        │
          │  - notes                             │
          └──────────────────────────────────────┘
```

---

## 🔄 Request Flow Example

### Scenario: Create a Contact

```
1. CLIENT REQUEST
   ┌──────────────────────────────────────────┐
   │ POST /api/contacts                       │
   │ Authorization: Bearer eyJhbGc...         │
   │ X-Tenant: acme                           │
   │ Content-Type: application/json           │
   │                                          │
   │ {                                        │
   │   "firstName": "John",                   │
   │   "lastName": "Smith",                   │
   │   "email": "john@example.com"            │
   │ }                                        │
   └──────────────────────────────────────────┘
                     │
                     ▼
2. TENANT MIDDLEWARE
   ┌──────────────────────────────────────────┐
   │ Extract "acme" from subdomain            │
   │ Query database for tenant                │
   │ Attach to request: req.tenant = {...}    │
   └──────────────────────────────────────────┘
                     │
                     ▼
3. AUTHENTICATION MIDDLEWARE
   ┌──────────────────────────────────────────┐
   │ Verify JWT token                         │
   │ Extract user ID, tenant ID, role         │
   │ Attach to request: req.user = {...}      │
   └──────────────────────────────────────────┘
                     │
                     ▼
4. AUTHORIZATION MIDDLEWARE
   ┌──────────────────────────────────────────┐
   │ Verify user.tenantId === tenant.id       │
   │ Check user has permission                │
   └──────────────────────────────────────────┘
                     │
                     ▼
5. ROUTER
   ┌──────────────────────────────────────────┐
   │ Match route: POST /api/contacts          │
   │ Call handler: createContact()            │
   └──────────────────────────────────────────┘
                     │
                     ▼
6. CONTROLLER (contactController.ts)
   ┌──────────────────────────────────────────┐
   │ Extract: firstName, lastName, email      │
   │ Validate: required fields present        │
   │ Call: ContactService.createContact()     │
   └──────────────────────────────────────────┘
                     │
                     ▼
7. SERVICE (ContactService.ts)
   ┌──────────────────────────────────────────┐
   │ Build data object                        │
   │ Add tenantId: req.tenant.id              │
   │ Call: prisma.contact.create()            │
   └──────────────────────────────────────────┘
                     │
                     ▼
8. DATABASE (Prisma + PostgreSQL)
   ┌──────────────────────────────────────────┐
   │ INSERT INTO contacts                     │
   │ VALUES ('uuid', 'John', 'Smith',         │
   │         'john@example.com', 'tenant-id') │
   └──────────────────────────────────────────┘
                     │
                     ▼
9. RESPONSE FLOW (back up the chain)
   ┌──────────────────────────────────────────┐
   │ Service: Return created contact object   │
   │ Controller: Format JSON response         │
   │ Express: Send HTTP response              │
   │                                          │
   │ HTTP 201 Created                         │
   │ {                                        │
   │   "id": "abc-123",                       │
   │   "firstName": "John",                   │
   │   "lastName": "Smith",                   │
   │   "email": "john@example.com",           │
   │   "tenantId": "tenant-id",               │
   │   "createdAt": "2025-01-05T10:30:00Z"    │
   │ }                                        │
   └──────────────────────────────────────────┘
```

---

## 🗄️ Database Relationships

```
┌─────────────┐
│   Tenant    │ (Organization)
│ subdomain   │
│ name        │
└──────┬──────┘
       │
       │ Has Many
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│    User     │                    │   Contact   │
│ email       │                    │ firstName   │
│ role        │                    │ lastName    │
│ firstName   │                    │ email       │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ Assigned To                      │ Primary Contact
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│    Task     │                    │    Deal     │
│ title       │◄───────┐           │ title       │
│ status      │        │           │ value       │
│ dueDate     │        │           │ stage       │
└──────┬──────┘        │           └──────┬──────┘
       │               │                  │
       │ Related To    │                  │ Related To
       │               │                  │
       ▼               │                  │
┌─────────────┐        │                  │
│   Ticket    │        │                  │
│ ticketNum   │────────┘                  │
│ subject     │                           │
│ status      │                           │
└──────┬──────┘                           │
       │                                  │
       │ Logged For                       │ Logged For
       │                                  │
       └──────────────┬───────────────────┘
                      │
                      ▼
              ┌─────────────┐
              │  Activity   │ (Timeline)
              │ type        │
              │ subject     │
              │ occurredAt  │
              └─────────────┘
```

### Relationship Types

- **Tenant → Everything**: One-to-Many (1:N)
  - One tenant has many users, contacts, deals, etc.

- **Contact → Company**: Many-to-One (N:1)
  - Many contacts work at one company

- **Deal → Contact**: Many-to-One (N:1)
  - Many deals can have the same primary contact

- **Task → User (Assignee)**: Many-to-One (N:1)
  - Many tasks assigned to one user

- **Activity → Contact**: Many-to-One (N:1)
  - Many activities for one contact

- **Activity → Deal/Ticket**: Many-to-One (N:1) - Optional
  - Activities can be linked to deals or tickets

---

## 🔐 Multi-Tenancy Isolation

```
┌───────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │            CONTACTS TABLE                    │ │
│  ├──────────┬─────────────┬───────────┬────────┤ │
│  │ id       │ firstName   │ email     │ tenantId│ │
│  ├──────────┼─────────────┼───────────┼────────┤ │
│  │ abc-1    │ John Smith  │ john@... │ ACME   │ │ ◄─── Acme Tenant
│  │ abc-2    │ Sarah Lee   │ sarah@.. │ ACME   │ │
│  │ xyz-1    │ Bob Wilson  │ bob@...  │ TECH   │ │ ◄─── TechStart Tenant
│  │ xyz-2    │ Alice Green │ alice@.. │ TECH   │ │
│  └──────────┴─────────────┴───────────┴────────┘ │
└───────────────────────────────────────────────────┘

REQUEST FROM ACME:
┌──────────────────────────────────────────────────┐
│ GET /api/contacts                                │
│ X-Tenant: acme                                   │
│ Authorization: Bearer <acme-user-token>          │
└──────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│ SERVICE LAYER - ContactService.getContacts()     │
│                                                  │
│ WHERE tenantId = 'acme-tenant-id'  ◄─── FILTER  │
│                                                  │
│ RETURNS:                                         │
│  ✅ abc-1 (John Smith)                           │
│  ✅ abc-2 (Sarah Lee)                            │
│  ❌ xyz-1 (Bob Wilson)    ◄─── BLOCKED          │
│  ❌ xyz-2 (Alice Green)   ◄─── BLOCKED          │
└──────────────────────────────────────────────────┘

KEY PRINCIPLE:
Every query MUST include: WHERE tenantId = <current-tenant>
This ensures complete data isolation between tenants!
```

---

## 📊 Module Data Flow

### Deal Pipeline Flow

```
1. CREATE CONTACT
   ┌──────────────┐
   │   Contact    │ ← Customer/Prospect
   │  John Smith  │
   └──────┬───────┘
          │
2. CREATE DEAL
          │
          ▼
   ┌──────────────┐
   │     Deal     │ ← Sales Opportunity
   │  CRM Sale    │
   │  $50,000     │
   └──────┬───────┘
          │
3. ADD ACTIVITIES
          │
          ├──→ Call: Discovery Call (45 min)
          ├──→ Email: Proposal Sent
          ├──→ Meeting: Product Demo
          └──→ Note: Budget approved!
          │
4. ADD TASKS
          │
          ├──→ Task: Follow up with decision maker
          ├──→ Task: Prepare contract
          └──→ Task: Schedule onboarding
          │
5. MOVE THROUGH STAGES
          │
          ▼
   LEAD → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON
          │
6. ANALYZE
          │
          ▼
   ┌──────────────┐
   │  Statistics  │
   │ Win Rate: 65%│
   │ Avg Deal: $X │
   │ Time: 30 days│
   └──────────────┘
```

### Support Ticket Flow

```
1. CUSTOMER SUBMITS TICKET
   ┌──────────────┐
   │   Contact    │
   │  Jane Doe    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Ticket #1  │ ← AUTO-ASSIGNED NUMBER
   │  Login Issue │
   │  Priority: H │
   │  Status: OPEN│
   └──────┬───────┘
          │
2. ASSIGN TO SUPPORT REP
          │
          ▼
   ┌──────────────┐
   │     User     │ ← Support Rep
   │  Mike (SUPPORT)
   └──────┬───────┘
          │
3. LOG ACTIVITIES
          │
          ├──→ Call: Troubleshooting (15 min)
          ├──→ Note: Password reset required
          └──→ Call: Verification (5 min)
          │
4. UPDATE STATUS
          │
   OPEN → IN_PROGRESS → PENDING → RESOLVED → CLOSED
          │
5. TRACK METRICS
          │
          ▼
   ┌──────────────────┐
   │   SLA Tracking   │
   │ Response: 10 min │
   │ Resolution: 2 hrs│
   │ Status: Met ✓    │
   └──────────────────┘
```

---

## 🎯 API Response Patterns

### Single Resource Response
```json
{
  "id": "abc-123",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "tenantId": "tenant-id",
  "createdAt": "2025-01-05T10:30:00Z",
  "updatedAt": "2025-01-05T10:30:00Z"
}
```

### List Response with Pagination
```json
{
  "contacts": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Statistics Response
```json
{
  "total": 450,
  "byStatus": [
    { "status": "OPEN", "count": 120 },
    { "status": "IN_PROGRESS", "count": 80 }
  ],
  "byPriority": [...],
  "avgResponseTime": 15,
  "resolutionRate": 92.5
}
```

### Error Response
```json
{
  "error": "Contact not found",
  "code": "RESOURCE_NOT_FOUND",
  "statusCode": 404
}
```

---

## 🔑 JWT Token Structure

```
HEADER
{
  "alg": "HS256",
  "typ": "JWT"
}

PAYLOAD
{
  "userId": "user-abc-123",
  "tenantId": "tenant-xyz-789",
  "email": "john@acme.com",
  "role": "SALES",
  "iat": 1704456000,
  "exp": 1704542400
}

SIGNATURE
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY
)

RESULTING TOKEN:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOiJ1c2VyLWFiYy0xMjMiLCJ0ZW5hbnRJZCI6InRlbmFudC14eXotNzg5IiwiZW1haWwiOiJqb2huQGFjbWUuY29tIiwicm9sZSI6IlNBTEVTIiwiaWF0IjoxNzA0NDU2MDAwLCJleHAiOjE3MDQ1NDI0MDB9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## 📈 Performance Optimization

### Database Indexes
```sql
-- Every table has indexes on:
CREATE INDEX idx_contacts_tenant ON contacts(tenantId);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created ON contacts(createdAt);

-- Foreign keys are indexed:
CREATE INDEX idx_deals_contact ON deals(contactId);
CREATE INDEX idx_deals_company ON deals(companyId);

-- Search fields:
CREATE INDEX idx_contacts_name ON contacts USING GIN (
  to_tsvector('english', firstName || ' ' || lastName)
);
```

### Query Patterns
```typescript
// ✅ GOOD - Efficient query with specific fields
const contacts = await prisma.contact.findMany({
  where: { tenantId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true
  },
  take: 20
});

// ❌ BAD - Returns all fields, no limit
const contacts = await prisma.contact.findMany({
  where: { tenantId }
});
```

---

## 🧪 Testing Strategy

```
┌─────────────────────────────────────────────┐
│           TESTING PYRAMID                   │
│                                             │
│              /\                             │
│             /  \  E2E Tests                 │
│            /────\  (5%)                     │
│           /      \                          │
│          /        \ Integration Tests       │
│         /──────────\ (15%)                  │
│        /            \                       │
│       /   Unit Tests \ (80%)                │
│      /────────────────\                     │
│                                             │
└─────────────────────────────────────────────┘

CURRENT: API Tests (Integration Level)
- Test actual HTTP endpoints
- Verify database operations
- Check tenant isolation
- Validate error handling

NEXT: Unit Tests (Service Layer)
- Test business logic
- Mock database calls
- Fast execution
- High coverage

FUTURE: E2E Tests
- Full user workflows
- Browser automation
- Critical paths only
```

---

## 📚 Code Organization

```
src/
├── controllers/          # Thin layer - request/response
│   ├── contactController.ts
│   ├── dealController.ts
│   └── ...
│
├── services/            # Thick layer - business logic
│   ├── ContactService.ts
│   ├── DealService.ts
│   └── ...
│
├── routes/              # Route definitions
│   ├── contactRoutes.ts
│   ├── dealRoutes.ts
│   └── ...
│
├── middleware/          # Cross-cutting concerns
│   ├── auth.ts         # Authentication
│   ├── tenant.ts       # Multi-tenancy
│   └── errorHandler.ts # Error handling
│
├── utils/               # Helper functions
│   ├── logger.ts       # Winston logger
│   └── validation.ts   # Common validators
│
└── types/               # TypeScript definitions
    └── express.d.ts    # Extended Request types
```

---

## 🚀 Deployment Flow (Future)

```
┌──────────────┐
│ Git Push     │
│ to main      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ GitHub       │
│ Actions      │
│ - Run tests  │
│ - Build      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Docker       │
│ Container    │
│ Build        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deploy to    │
│ Production   │
│ (AWS/Azure)  │
└──────────────┘
```

---

**More Questions?** 
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed explanations
- See [MODULE_GUIDE.md](./MODULE_GUIDE.md) for specific module details
- Review code examples in `api-tests-*.http` files
