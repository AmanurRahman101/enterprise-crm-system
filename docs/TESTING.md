# Tawasol CRM - Testing Guide

## 🧪 Current Setup Testing

This guide will help you verify that all components are working correctly.

---

## ✅ 1. Database Testing with Prisma Studio

**Prisma Studio** is a visual database browser that lets you view and edit your data.

### Start Prisma Studio:
```powershell
cd backend
npm run prisma:studio
```

**Access**: http://localhost:5555

### What to Check:
1. **Users Table** - Should have 6 users
   - Admin, Manager, Sales reps, Support agents
   - All passwords are hashed

2. **Companies Table** - Should have 3 companies
   - Acme Corporation
   - TechStart Inc
   - Global Solutions Ltd

3. **Contacts Table** - Should have 5 contacts
   - Each linked to a company
   - Each assigned to a user (owner)

4. **Deals Table** - Should have 3 deals
   - Different stages (NEGOTIATION, PROPOSAL, QUALIFIED)
   - Linked to contacts and companies

5. **Tasks Table** - Should have 3 tasks
   - Different statuses (TODO, IN_PROGRESS)
   - Assigned to users

6. **Tickets Table** - Should have 3 tickets
   - Different priorities and statuses
   - Assigned to support agents

7. **Activities Table** - Should have 3 activities
   - CALL, EMAIL, MEETING types
   - Linked to contacts and deals

8. **Notes Table** - Should have 3 notes
   - Internal notes on contacts, deals, tickets

### Try These Actions in Prisma Studio:
- ✅ View all records
- ✅ Filter by fields
- ✅ Edit a record (try updating a contact's email)
- ✅ Add a new contact
- ✅ View relationships (click on linked IDs)

---

## ✅ 2. Backend API Testing

### Check Server Status:

**Option A: Browser**
Open in your browser:
- Health Check: http://localhost:5000/health
- API Root: http://localhost:5000/api/v1

**Option B: PowerShell**
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:5000/health" | Select-Object -ExpandProperty Content

# API root
Invoke-WebRequest -Uri "http://localhost:5000/api/v1" | Select-Object -ExpandProperty Content
```

**Expected Response (Health Check):**
```json
{
  "status": "success",
  "message": "Tawasol CRM API is running",
  "timestamp": "2025-11-04T...",
  "environment": "development"
}
```

**Expected Response (API Root):**
```json
{
  "message": "Welcome to Tawasol CRM API",
  "version": "v1",
  "documentation": "/api/docs"
}
```

---

## ✅ 3. Database Connection Testing

### Test Database Connectivity:
```powershell
cd backend
npm run db:test
```

**Expected Output:**
```
✅ Database connection successful
```

### Get Database Statistics:
Create a test file to check database stats:

```powershell
# Create test script
cd backend
```

Create `test-db.ts`:
```typescript
import { getDatabaseStats } from './src/utils/database';
import { prisma } from './src/config/database';

async function test() {
  const stats = await getDatabaseStats();
  console.log('📊 Database Statistics:');
  console.log(JSON.stringify(stats, null, 2));
  await prisma.$disconnect();
}

test();
```

Run it:
```powershell
npx ts-node test-db.ts
```

---

## ✅ 4. Manual Database Queries

### Using psql (if installed):
```powershell
psql -U postgres -d tawasol_db
```

Then run SQL queries:
```sql
-- Count all users
SELECT COUNT(*) FROM users;

-- View all users with their roles
SELECT email, "firstName", "lastName", role FROM users;

-- View deals with contact info
SELECT 
  d.title, 
  d.value, 
  d.stage,
  c."firstName" || ' ' || c."lastName" as contact_name
FROM deals d
JOIN contacts c ON d."contactId" = c.id;

-- Exit
\q
```

---

## ✅ 5. Environment Variables Check

Verify your `.env` file has correct values:

```powershell
cd backend
cat .env
```

**Check These Settings:**
- ✅ `DATABASE_URL` - Correct PostgreSQL connection string
- ✅ `PORT=5000` - Server port
- ✅ `NODE_ENV=development`
- ✅ `JWT_SECRET` - Set (we'll use this in Prompt 3)

---

## ✅ 6. Test Seed Data Integrity

### Verify Relationships:

**Test 1: Check Contact-Company Relationships**
- Open Prisma Studio
- Go to Contacts table
- Click on any `companyId` link
- Should navigate to the linked company

**Test 2: Check Deal-Contact Relationships**
- Go to Deals table
- Click on `contactId`
- Should show the contact details

**Test 3: Check Task-User Assignments**
- Go to Tasks table
- Check `assigneeId` and `creatorId`
- Both should link to valid users

**Test 4: Check Activity Logs**
- Go to Activities table
- Verify `contactId`, `dealId`, `userId` all have valid links

---

## ✅ 7. Server Logs Testing

Your server should be logging requests. Test this:

1. **Start backend** (if not running):
```powershell
cd backend
npm run dev
```

2. **Make a request** in browser or PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health"
```

3. **Check terminal output** - You should see:
```
[info]: GET /health
```

---

## ✅ 8. Error Handling Test

Test that error handling works:

### Test 404 Error:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/nonexistent"
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Route not found"
}
```

---

## 🎯 Quick Test Checklist

Run through this checklist:

### Backend:
- [ ] Server starts without errors: `npm run dev`
- [ ] Health endpoint works: http://localhost:5000/health
- [ ] API root works: http://localhost:5000/api/v1
- [ ] Logs show in terminal

### Database:
- [ ] Prisma Studio opens: `npm run prisma:studio`
- [ ] All 8 tables visible
- [ ] Users table has 6 records
- [ ] Companies table has 3 records
- [ ] Contacts table has 5 records
- [ ] Can edit a record successfully
- [ ] Relationships work (clicking IDs navigates)

### Data Integrity:
- [ ] All contacts have valid owners (users)
- [ ] All deals have valid contacts
- [ ] All tasks have valid assignees
- [ ] All tickets have valid contacts
- [ ] No orphaned records

---

## 🔧 Troubleshooting

### Issue: Prisma Studio won't open
**Solution:**
```powershell
# Kill any existing process
taskkill /F /IM node.exe
# Restart
npm run prisma:studio
```

### Issue: Server won't start
**Solution:**
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000
# If found, kill the process
taskkill /F /PID <process_id>
# Restart server
npm run dev
```

### Issue: Database connection fails
**Solution:**
1. Check PostgreSQL is running
2. Verify `.env` DATABASE_URL
3. Test connection:
```powershell
psql -U postgres -d tawasol_db
```

### Issue: No seed data
**Solution:**
```powershell
npm run prisma:seed
```

---

## 📸 Screenshots to Take (for your records)

1. **Prisma Studio** - Users table showing all 6 users
2. **Prisma Studio** - Deals table with 3 deals
3. **Browser** - http://localhost:5000/health showing success
4. **Terminal** - Backend server running with logs

---

## ✅ Success Criteria

Your setup is working correctly if:

✅ Backend server starts and stays running  
✅ Health check returns success response  
✅ Prisma Studio shows all tables with data  
✅ All 26 records are present (6+3+5+3+3+3+3)  
✅ Relationships between tables work  
✅ Can edit records in Prisma Studio  
✅ Logs appear in terminal when making requests  
✅ Error handling works (404 for invalid routes)  

---

## 🎯 Next Steps

Once all tests pass, you're ready for **Prompt 3: Authentication System**!

The authentication system will add:
- Login endpoints
- JWT token generation
- Password verification
- Protected routes
- User registration

**Say "Start Prompt 3" when ready!** 🚀
