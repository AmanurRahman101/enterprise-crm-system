# Tawasol CRM - Module Reference Guide

Complete guide to all implemented modules with examples and use cases.

---

## 📋 Table of Contents

1. [Contact Management](#1-contact-management)
2. [Company Management](#2-company-management)
3. [Deal Pipeline](#3-deal-pipeline)
4. [Task Management](#4-task-management)
5. [Ticket System](#5-ticket-system)
6. [Activity Logging](#6-activity-logging)

---

## 1. Contact Management

### Purpose
Manage individual people - customers, prospects, leads, and partners.

### Key Features
- ✅ Full CRUD operations
- ✅ Search by name, email, phone
- ✅ Filter by lead source, tags, lifecycle stage
- ✅ Link to companies (employment relationships)
- ✅ Track activities timeline
- ✅ Statistics and insights

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/contacts` | Create new contact |
| `GET` | `/api/contacts` | List contacts with filters |
| `GET` | `/api/contacts/:id` | Get single contact with full details |
| `PUT` | `/api/contacts/:id` | Update contact information |
| `DELETE` | `/api/contacts/:id` | Delete contact |
| `GET` | `/api/contacts/stats` | Get contact statistics |

### Example Usage

#### Create Contact
```http
POST /api/contacts
Authorization: Bearer <token>
X-Tenant: acme

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "jobTitle": "CTO",
  "leadSource": "REFERRAL",
  "lifecycleStage": "LEAD",
  "tags": ["enterprise", "hot-lead"]
}
```

#### Search Contacts
```http
GET /api/contacts?search=john&leadSource=REFERRAL&limit=20
```

#### Get Contact Statistics
```http
GET /api/contacts/stats?startDate=2025-01-01&endDate=2025-01-31
```

### Database Schema
```prisma
model Contact {
  id              String
  firstName       String
  lastName        String
  email           String
  phone           String?
  company         String?
  jobTitle        String?
  leadSource      LeadSource?
  lifecycleStage  LifecycleStage
  tags            String[]
  companyId       String?
  tenantId        String
  createdAt       DateTime
  updatedAt       DateTime
}
```

### Use Cases
1. **Sales**: Track prospects through the sales funnel
2. **Marketing**: Segment contacts for campaigns
3. **Support**: Quick access to customer information
4. **Reporting**: Analyze lead sources and conversion rates

---

## 2. Company Management

### Purpose
Manage business organizations - customers, prospects, partners, and vendors.

### Key Features
- ✅ Full CRUD operations
- ✅ Search by name, industry, website
- ✅ Filter by size, revenue, industry
- ✅ Link contacts as employees
- ✅ Track parent-subsidiary relationships
- ✅ Revenue and size analytics

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/companies` | Create new company |
| `GET` | `/api/companies` | List companies with filters |
| `GET` | `/api/companies/:id` | Get single company with contacts |
| `PUT` | `/api/companies/:id` | Update company information |
| `DELETE` | `/api/companies/:id` | Delete company |
| `GET` | `/api/companies/stats` | Get company statistics |

### Example Usage

#### Create Company
```http
POST /api/companies
Authorization: Bearer <token>
X-Tenant: acme

{
  "name": "TechCorp Solutions",
  "industry": "SOFTWARE",
  "size": "MEDIUM",
  "annualRevenue": 5000000,
  "website": "https://techcorp.com",
  "phone": "+1-555-9999",
  "address": "123 Tech Street",
  "city": "San Francisco",
  "country": "USA",
  "tags": ["saas", "b2b"]
}
```

#### Filter Companies
```http
GET /api/companies?industry=SOFTWARE&size=MEDIUM&sortBy=annualRevenue&sortOrder=desc
```

#### Get Statistics
```http
GET /api/companies/stats
```

### Use Cases
1. **B2B Sales**: Track organizational relationships
2. **Account Management**: Manage key accounts
3. **Partner Management**: Track partnership networks
4. **Market Analysis**: Analyze by industry and size

---

## 3. Deal Pipeline

### Purpose
Manage sales opportunities through customizable pipeline stages.

### Key Features
- ✅ Customizable pipeline stages
- ✅ Deal value and probability tracking
- ✅ Expected close dates
- ✅ Win/loss analysis
- ✅ Revenue forecasting
- ✅ Stage conversion metrics

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/deals` | Create new deal |
| `GET` | `/api/deals` | List deals with filters |
| `GET` | `/api/deals/:id` | Get single deal details |
| `PUT` | `/api/deals/:id` | Update deal |
| `PUT` | `/api/deals/:id/stage` | Move deal to different stage |
| `DELETE` | `/api/deals/:id` | Delete deal |
| `GET` | `/api/deals/stats` | Get pipeline statistics |

### Example Usage

#### Create Deal
```http
POST /api/deals
Authorization: Bearer <token>
X-Tenant: acme

{
  "title": "Enterprise CRM Implementation",
  "value": 50000,
  "probability": 75,
  "stage": "PROPOSAL",
  "expectedCloseDate": "2025-02-28",
  "contactId": "contact-123",
  "companyId": "company-456",
  "description": "Full CRM deployment for 100 users",
  "tags": ["enterprise", "high-value"]
}
```

#### Filter by Stage
```http
GET /api/deals?stage=PROPOSAL&probability=70,100&sortBy=value&sortOrder=desc
```

#### Get Pipeline Statistics
```http
GET /api/deals/stats?startDate=2025-01-01&endDate=2025-12-31
```

### Pipeline Stages
1. **LEAD** - Initial contact
2. **QUALIFIED** - Qualified opportunity
3. **PROPOSAL** - Proposal sent
4. **NEGOTIATION** - In negotiation
5. **CLOSED_WON** - Deal won! 🎉
6. **CLOSED_LOST** - Deal lost

### Use Cases
1. **Sales Forecasting**: Predict revenue based on pipeline
2. **Team Performance**: Track sales rep effectiveness
3. **Win/Loss Analysis**: Understand what works
4. **Reporting**: Executive dashboards and KPIs

---

## 4. Task Management

### Purpose
Manage work items, to-dos, and assignments for team members.

### Key Features
- ✅ Task assignment to users
- ✅ Due date tracking and reminders
- ✅ Priority levels (LOW, MEDIUM, HIGH, URGENT)
- ✅ Status workflow (TODO → IN_PROGRESS → COMPLETED)
- ✅ Link to contacts and deals
- ✅ Overdue detection
- ✅ Completion rate analytics

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks` | Create new task |
| `GET` | `/api/tasks` | List tasks with filters |
| `GET` | `/api/tasks/:id` | Get single task |
| `PUT` | `/api/tasks/:id` | Update task |
| `PUT` | `/api/tasks/:id/status` | Update task status |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/tasks/stats` | Get task statistics |

### Example Usage

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
X-Tenant: acme

{
  "title": "Follow up with John Smith",
  "description": "Send proposal and schedule demo",
  "priority": "HIGH",
  "dueDate": "2025-01-15T17:00:00Z",
  "assigneeId": "user-123",
  "contactId": "contact-456",
  "dealId": "deal-789",
  "tags": ["sales", "follow-up"]
}
```

#### Get My Tasks Due Today
```http
GET /api/tasks?assigneeId=me&dueDate=today&status=TODO,IN_PROGRESS
```

#### Get Overdue Tasks
```http
GET /api/tasks?overdue=true&sortBy=dueDate&sortOrder=asc
```

### Task Statuses
- **TODO** - Not started
- **IN_PROGRESS** - Currently working on it
- **COMPLETED** - Done ✓
- **CANCELLED** - No longer needed

### Use Cases
1. **Personal Productivity**: Individual to-do lists
2. **Team Coordination**: Assign work to team members
3. **Sales Follow-ups**: Track customer touchpoints
4. **Support Workflows**: Manage support tasks

---

## 5. Ticket System

### Purpose
Customer support helpdesk with SLA tracking and performance metrics.

### Key Features
- ✅ Auto-incrementing ticket numbers (#1, #2, #3...)
- ✅ 5-state workflow (OPEN → IN_PROGRESS → PENDING → RESOLVED → CLOSED)
- ✅ SLA deadline tracking
- ✅ Response time metrics
- ✅ Resolution time tracking
- ✅ Priority and category management
- ✅ Multi-channel support (email, phone, chat, portal)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets` | Create new ticket |
| `GET` | `/api/tickets` | List tickets with filters |
| `GET` | `/api/tickets/:id` | Get ticket details |
| `GET` | `/api/tickets/number/:number` | Get ticket by number (#123) |
| `PUT` | `/api/tickets/:id` | Update ticket |
| `PUT` | `/api/tickets/:id/status` | Update ticket status |
| `DELETE` | `/api/tickets/:id` | Delete ticket |
| `GET` | `/api/tickets/stats` | Get support metrics |

### Example Usage

#### Create Ticket
```http
POST /api/tickets
Authorization: Bearer <token>
X-Tenant: acme

{
  "subject": "Login Issue - Cannot Access Dashboard",
  "description": "Customer reports error 'Invalid credentials' when logging in",
  "contactId": "contact-123",
  "priority": "HIGH",
  "category": "TECHNICAL_SUPPORT",
  "source": "EMAIL",
  "slaDeadline": "2025-01-06T18:00:00Z",
  "tags": ["login", "urgent"]
}
```

#### Get My Assigned Tickets
```http
GET /api/tickets?assigneeId=me&status=OPEN,IN_PROGRESS
```

#### Get Past SLA Tickets
```http
GET /api/tickets?slaPast=true&sortBy=slaDeadline&sortOrder=asc
```

#### Get Support Metrics
```http
GET /api/tickets/stats?startDate=2025-01-01&endDate=2025-01-31
```

### Ticket Workflow
1. **OPEN** - New ticket submitted
2. **IN_PROGRESS** - Support rep working on it
3. **PENDING** - Waiting for customer response
4. **RESOLVED** - Issue fixed
5. **CLOSED** - Ticket completed

### Priority Levels
- **LOW** - General questions
- **MEDIUM** - Normal issues
- **HIGH** - Important problems
- **URGENT** - Critical issues affecting business

### Use Cases
1. **Customer Support**: Track and resolve issues
2. **SLA Management**: Meet service level agreements
3. **Team Performance**: Measure response and resolution times
4. **Knowledge Base**: Learn from common issues

---

## 6. Activity Logging

### Purpose
Unified timeline of all customer interactions across calls, emails, meetings, and notes.

### Key Features
- ✅ 5 activity types (CALL, EMAIL, MEETING, NOTE, TASK)
- ✅ Link to contacts, deals, and tickets
- ✅ Call duration and outcome tracking
- ✅ Email message ID integration
- ✅ Meeting duration analytics
- ✅ Flexible metadata storage (JSON)
- ✅ Activity feed/timeline view
- ✅ Performance metrics by user

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/activities` | Create new activity |
| `GET` | `/api/activities` | List activities with filters |
| `GET` | `/api/activities/:id` | Get activity details |
| `GET` | `/api/activities/feed` | Get activity timeline |
| `PUT` | `/api/activities/:id` | Update activity |
| `DELETE` | `/api/activities/:id` | Delete activity |
| `GET` | `/api/activities/stats` | Get activity statistics |

### Example Usage

#### Log Phone Call
```http
POST /api/activities
Authorization: Bearer <token>
X-Tenant: acme

{
  "type": "CALL",
  "subject": "Discovery Call",
  "description": "Discussed CRM requirements and timeline",
  "duration": 45,
  "outcome": "Connected",
  "contactId": "contact-123",
  "dealId": "deal-456",
  "occurredAt": "2025-01-05T10:30:00Z"
}
```

#### Log Email Sent
```http
POST /api/activities
Authorization: Bearer <token>
X-Tenant: acme

{
  "type": "EMAIL",
  "subject": "Proposal: CRM Implementation",
  "description": "Sent detailed proposal with pricing",
  "contactId": "contact-123",
  "dealId": "deal-456",
  "emailMessageId": "msg-12345",
  "metadata": {
    "to": "customer@example.com",
    "attachments": ["proposal.pdf"]
  },
  "occurredAt": "2025-01-05T14:00:00Z"
}
```

#### Get Contact Timeline
```http
GET /api/activities/feed?entityType=contact&entityId=contact-123
```

#### Get Deal Activity History
```http
GET /api/activities/feed?entityType=deal&entityId=deal-456&sortBy=occurredAt&sortOrder=asc
```

#### Get My Activities This Week
```http
GET /api/activities?userId=me&startDate=2025-01-01&endDate=2025-01-07
```

### Activity Types

#### CALL
```json
{
  "type": "CALL",
  "duration": 30,
  "outcome": "Connected | Left Voicemail | No Answer",
  "recordingUrl": "https://..."
}
```

#### EMAIL
```json
{
  "type": "EMAIL",
  "emailMessageId": "msg-12345",
  "metadata": {
    "to": "customer@example.com",
    "cc": ["manager@example.com"],
    "attachments": ["file.pdf"]
  }
}
```

#### MEETING
```json
{
  "type": "MEETING",
  "duration": 60,
  "metadata": {
    "meetingType": "Video",
    "platform": "Zoom",
    "attendees": ["John", "Sarah"]
  }
}
```

#### NOTE
```json
{
  "type": "NOTE",
  "subject": "Customer Feedback",
  "description": "Customer mentioned budget concerns..."
}
```

### Use Cases
1. **Customer Context**: See full interaction history
2. **Sales Tracking**: Monitor touchpoints in deal lifecycle
3. **Support History**: View all customer support interactions
4. **Performance Analysis**: Track calls, emails, meetings per rep
5. **Compliance**: Maintain audit trail of communications

---

## 🔗 Module Relationships

```
Contact ────────┐
                │
Company ────────┼──→ Deal ──→ Activity
                │       │
                │       └──→ Task
                │
                └──→ Ticket ──→ Activity
                        │
                        └──→ Task
```

### Key Relationships

1. **Contact** is the center - everything connects to contacts
2. **Company** groups contacts together
3. **Deal** tracks sales opportunities for contacts/companies
4. **Task** assigns work related to contacts/deals/tickets
5. **Ticket** manages support requests from contacts
6. **Activity** logs ALL interactions across entities

---

## 📊 Common Query Patterns

### Get Current User's Items
```http
GET /api/tasks?assigneeId=me
GET /api/tickets?assigneeId=me
GET /api/activities?userId=me
```

### Date Range Queries
```http
GET /api/deals/stats?startDate=2025-01-01&endDate=2025-12-31
GET /api/activities?startDate=2025-01-01&endDate=2025-01-07
```

### Pagination
```http
GET /api/contacts?page=1&limit=20
GET /api/companies?page=2&limit=50
```

### Search
```http
GET /api/contacts?search=john
GET /api/deals?search=crm
```

### Multiple Filters
```http
GET /api/tasks?status=TODO,IN_PROGRESS&priority=HIGH,URGENT&assigneeId=me
GET /api/tickets?status=OPEN&slaPast=true&priority=URGENT
```

### Sorting
```http
GET /api/deals?sortBy=value&sortOrder=desc
GET /api/tasks?sortBy=dueDate&sortOrder=asc
```

---

## 🎯 Best Practices

### 1. Always Use Tenant Isolation
```typescript
// ✅ CORRECT
const contacts = await prisma.contact.findMany({
  where: { tenantId: req.tenant.id }
});

// ❌ WRONG - Missing tenant filter!
const contacts = await prisma.contact.findMany();
```

### 2. Validate Entity Ownership
```typescript
// ✅ CORRECT - Verify contact belongs to tenant
const contact = await prisma.contact.findFirst({
  where: { id: contactId, tenantId }
});
if (!contact) throw new Error('Not found');
```

### 3. Use Consistent Error Handling
```typescript
// ✅ CORRECT
if (!contact) {
  return res.status(404).json({ error: 'Contact not found' });
}
```

### 4. Include Pagination for Lists
```typescript
// ✅ CORRECT
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;
```

### 5. Log Important Actions
```typescript
// ✅ CORRECT
logger.info(`Contact created: ${contact.id} for tenant: ${tenantId}`);
logger.error(`Error creating contact for tenant ${tenantId}:`, error);
```

---

## 🧪 Testing

Each module has a corresponding `.http` test file:

- `api-tests-contacts.http` - 22 scenarios
- `api-tests-companies.http` - 27 scenarios
- `api-tests-deals.http` - 40 scenarios
- `api-tests-tasks.http` - 45 scenarios
- `api-tests-tickets.http` - 85 scenarios
- `api-tests-activities.http` - 70 scenarios

### Running Tests

Use VS Code REST Client extension:
1. Open any `.http` file
2. Click "Send Request" above each test
3. View response inline

---

## 📚 Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DATABASE.md](./DATABASE.md) - Database schema details
- [BACKEND.md](./BACKEND.md) - Backend setup guide
- [API Documentation](#) - Coming soon

---

**Need Help?** Check the [README.md](../README.md) or raise an issue!
