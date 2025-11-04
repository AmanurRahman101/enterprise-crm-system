# Database Setup Guide

## Quick Setup

### Step 1: Install PostgreSQL

Download and install PostgreSQL from: https://www.postgresql.org/download/

### Step 2: Create Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE tawasol_db;
```

### Step 3: Configure Environment

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/tawasol_db?schema=public"
```

Replace `your_password` with your PostgreSQL password.

### Step 4: Install Dependencies

```powershell
cd backend
npm install
```

### Step 5: Generate Prisma Client

```powershell
npm run prisma:generate
```

### Step 6: Run Migrations

```powershell
npm run prisma:migrate
```

When prompted for migration name, use: `init`

### Step 7: Seed Database (Optional)

```powershell
npm run prisma:seed
```

This creates sample data for testing.

## Database Schema Overview

### Core Tables

1. **users** - System users (employees & customers)
   - Roles: ADMIN, MANAGER, SALES, SUPPORT, CUSTOMER
   - Authentication: Email + hashed password

2. **companies** - Customer organizations
   - Company details, contact info
   - Links to multiple contacts

3. **contacts** - Individual people
   - Personal info, job details
   - Belongs to company (optional)
   - Owned by user (sales rep)

4. **deals** - Sales opportunities
   - Pipeline stages: LEAD → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED
   - Value, probability, expected close date
   - Linked to contact & company

5. **tasks** - Action items
   - Status: TODO, IN_PROGRESS, COMPLETED, CANCELLED
   - Assignee, due date, priority
   - Can link to contact or deal

6. **tickets** - Support requests
   - Status: OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED
   - Priority: LOW, MEDIUM, HIGH, URGENT
   - Auto-incrementing ticket numbers
   - Multi-channel support (Email, Phone, Telegram, App)

7. **activities** - Interaction logs
   - Types: CALL, EMAIL, MEETING, NOTE, TASK
   - Automatic logging of all interactions
   - Links to contacts, deals, or tickets

8. **notes** - Internal notes
   - Rich text content
   - Can attach to any entity

## Enhanced Schema Features

### New Fields Added in Prompt 2:

**Company:**
- Phone, email, address fields
- City, country for location tracking
- Logo URL for branding
- Enhanced indexing

**Contact:**
- Mobile number (separate from phone)
- Department tracking
- Social media (Twitter)
- Address, city, country
- Timezone and language preferences
- Avatar image URL
- Tags array for categorization
- Custom fields (JSON) for flexibility
- Last contacted timestamp

**Deal:**
- Currency field (multi-currency support)
- Priority level
- Source tracking (where deal came from)
- Lost reason (for closed-lost deals)
- Better indexing on close dates

**Ticket:**
- Auto-incrementing ticket number
- Category field
- Tags array
- SLA deadline tracking
- First response timestamp
- Closed timestamp (separate from resolved)

**Activity:**
- Outcome field (call result)
- Recording URL (for call recordings)
- Email message ID (Gmail integration)
- Metadata JSON (flexible data)
- Type indexing for filtering

## Relationships Diagram

```
User
 ├─> Contact (owner)
 ├─> Deal (owner)
 ├─> Task (assignee & creator)
 ├─> Ticket (assignee)
 ├─> Activity (user)
 └─> Note (author)

Company
 ├─> Contact (many)
 └─> Deal (many)

Contact
 ├─> Deal (many)
 ├─> Ticket (many)
 ├─> Activity (many)
 ├─> Task (many)
 └─> Note (many)

Deal
 ├─> Task (many)
 ├─> Activity (many)
 └─> Note (many)

Ticket
 ├─> Activity (many)
 └─> Note (many)
```

## Indexes

Performance optimizations through strategic indexing:

- **Email addresses** - Fast user/contact lookup
- **Owner/Assignee IDs** - Quick filtering by user
- **Status/Stage fields** - Pipeline and queue views
- **Date fields** - Time-based queries
- **Ticket numbers** - Quick ticket lookup
- **Names** - Search functionality

## Useful Commands

### View Database in Browser
```powershell
npm run prisma:studio
```

### Create New Migration
```powershell
npm run prisma:migrate
```

### Reset Database (⚠️ Deletes all data)
```powershell
npm run prisma:reset
```

### Push Schema Without Migration
```powershell
npm run db:push
```

### Test Database Connection
```powershell
npm run db:test
```

### View Migration Status
```powershell
npx prisma migrate status
```

## Seeded Test Data

After running `npm run prisma:seed`, you'll have:

### Users (6)
- **admin@tawasol.com** - Admin role
- **manager@tawasol.com** - Manager role
- **john.sales@tawasol.com** - Sales rep
- **emma.sales@tawasol.com** - Sales rep
- **mike.support@tawasol.com** - Support agent
- **lisa.support@tawasol.com** - Support agent

**All passwords:** `Password123!`

### Sample Data
- 3 Companies (Acme Corp, TechStart, Global Solutions)
- 5 Contacts
- 3 Deals (various stages)
- 3 Tasks
- 3 Support Tickets
- 3 Activities
- 3 Notes

## Troubleshooting

### Issue: "relation does not exist"
**Solution:** Run migrations
```powershell
npm run prisma:migrate
```

### Issue: "Can't reach database server"
**Solution:** 
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env
3. Verify firewall settings

### Issue: "Unique constraint violation"
**Solution:** Database already has data. Either:
- Reset: `npm run prisma:reset`
- Or manually clean tables

### Issue: Prisma Client not found
**Solution:** Generate client
```powershell
npm run prisma:generate
```

## Production Considerations

1. **Backups**: Set up automated PostgreSQL backups
2. **Indexing**: Monitor query performance, add indexes as needed
3. **Migrations**: Always test migrations in staging first
4. **Connection Pooling**: Use PgBouncer for high traffic
5. **Monitoring**: Track database performance metrics

## Next Steps

Once database is set up:
1. ✅ Schema created
2. ✅ Migrations run
3. ✅ Seed data loaded
4. → Proceed to Prompt 3: Authentication System
