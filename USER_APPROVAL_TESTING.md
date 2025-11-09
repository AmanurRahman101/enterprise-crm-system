# User Approval System - Testing Guide

## Overview
The user approval system has been successfully implemented. This guide will help you test the complete workflow.

## What Was Implemented

### Backend Changes
1. **Database Schema** (`backend/prisma/schema.prisma`)
   - Added `UserStatus` enum with three states: `PENDING`, `APPROVED`, `REJECTED`
   - Added `status` field to User model (defaults to `PENDING`)
   - Migration applied using `npx prisma db push`

2. **User Service** (`backend/src/services/UserService.ts`)
   - Registration logic: Organization creators get `ADMIN` role + `APPROVED` status
   - Regular business users joining existing orgs: `USER` role + `PENDING` status
   - Customer registration: Auto-approved with `APPROVED` status
   - Login enforcement: Blocks `PENDING` and `REJECTED` users with clear error messages

3. **API Endpoints** (`backend/src/controllers/userController.ts`)
   - `POST /api/users/:id/approve` - Approve a pending user (ADMIN only)
   - `POST /api/users/:id/reject` - Reject a pending user (ADMIN only)

4. **Data Migration**
   - Created and ran `update-user-status.ts` to set all 10 existing users to `APPROVED` status

### Frontend Changes
1. **User Service** (`frontend/src/services/userService.ts`)
   - `approveUser(userId)` - Calls the approve endpoint
   - `rejectUser(userId)` - Calls the reject endpoint

2. **User List Page** (`frontend/src/pages/users/UserListPage.tsx`)
   - Added status badges showing approval state (Pending Approval, Approved, Rejected)
   - Added approve/reject buttons for pending users (green check, red X)
   - Status column now shows both approval status and active/inactive status

3. **Type Definitions** (`frontend/src/types/index.ts`)
   - Updated User interface with `status` field

## How to Test

### Test 1: Register a New Business User (Should be PENDING)

1. **Start the application** (if not already running):
   ```powershell
   cd c:\Projects\tawasol-crm
   .\start.bat
   ```

2. **Register a new user** joining an existing organization:
   - Go to the registration page
   - Select "Business" signup
   - Choose "Join existing organization" (NOT create new)
   - Select an existing tenant (e.g., "Acme Corporation" or "toto")
   - Fill in user details
   - Submit registration
   
3. **Expected Result**:
   - Registration success message: "Registration successful! Your account is pending approval by an administrator."
   - User is created with `PENDING` status

4. **Try to login** with the new user:
   - Use the email and password you just registered
   - **Expected**: Login should fail with error message: "Your account is pending approval by an administrator"

### Test 2: Admin Approves the User

1. **Login as admin** (use an existing admin account):
   - Email: An admin user from your database
   - Password: The admin's password

2. **Navigate to Users page** (`/users`)

3. **Find the pending user**:
   - Look for the user you just created
   - Status badge should show "Pending Approval" in yellow

4. **Approve the user**:
   - Click the green checkmark icon (✓) in the Actions column
   - Confirm the approval in the dialog
   - **Expected**: User list refreshes, status changes to "Approved" in green

5. **Logout from admin account**

### Test 3: Approved User Can Login

1. **Login with the previously pending user**:
   - Use the same credentials from Test 1
   - **Expected**: Login should succeed, user is redirected to dashboard

### Test 4: Admin Rejects a User

1. **Register another new business user** (same as Test 1)

2. **Login as admin**

3. **Navigate to Users page**

4. **Find the new pending user**

5. **Reject the user**:
   - Click the red X icon in the Actions column
   - Confirm the rejection in the dialog
   - **Expected**: User list refreshes, status changes to "Rejected" in red

6. **Try to login** with the rejected user:
   - **Expected**: Login should fail with error: "Your account has been rejected"

### Test 5: Organization Creator (Auto-Approved)

1. **Register a NEW organization**:
   - Go to registration page
   - Select "Business" signup
   - Choose "Create new organization"
   - Fill in organization and user details
   - Submit registration

2. **Expected Result**:
   - User is created as `ADMIN` with `APPROVED` status
   - Can login immediately without approval

3. **Login with the new organization creator**:
   - **Expected**: Login succeeds immediately

### Test 6: Customer Registration (Auto-Approved)

1. **Register as a customer**:
   - Go to customer registration page
   - Fill in customer details
   - Submit registration

2. **Expected Result**:
   - Customer is created with `APPROVED` status
   - Can login immediately without approval

## User Status Badge Colors

- **Pending Approval**: Yellow badge with clock icon
- **Approved**: Green badge with checkmark icon  
- **Rejected**: Red badge with X icon

## API Endpoints

### Approve User
```
POST /api/users/:userId/approve
Authorization: Bearer <admin-token>
```

### Reject User
```
POST /api/users/:userId/reject
Authorization: Bearer <admin-token>
```

## Database Check

To verify user status in the database:

```powershell
cd c:\Projects\tawasol-crm\backend
npx prisma studio
```

Navigate to the User table and check the `status` field.

## Troubleshooting

### Backend not recognizing status field
- Make sure you ran: `npx prisma db push`
- Regenerate Prisma client: `npx prisma generate`
- Restart the backend server

### Frontend not showing approval UI
- Make sure you rebuilt the frontend: `npm run build` from the frontend directory
- Clear browser cache and refresh

### TypeScript errors about status field
- Restart the backend server to reload types
- Restart VS Code to reload TypeScript language server

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Send emails when users are approved/rejected
2. **Pending Users Badge**: Show count of pending users in navigation
3. **Status Filter**: Add dropdown to filter users by PENDING/APPROVED/REJECTED
4. **Bulk Approval**: Select multiple pending users and approve/reject in bulk
5. **Approval Reason**: Allow admin to provide a reason for rejection

## Summary

✅ Backend approval system fully implemented
✅ Database schema updated with UserStatus enum
✅ Login enforcement checks approval status
✅ Admin-only approve/reject endpoints secured
✅ Frontend UI with status badges and action buttons
✅ All existing users migrated to APPROVED status
✅ Build successful (127.94 kB main bundle)

The approval workflow is complete and ready for testing!
