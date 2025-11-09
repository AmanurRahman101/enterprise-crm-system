# Multi-Tenant System Implementation

## ✅ Completed Changes

### 1. **Database Schema Updates**

#### Added UserTenant Junction Table
```prisma
model UserTenant {
  id              String    @id @default(uuid())
  userProfileId   String
  tenantId        String
  role            UserRole  @default(CUSTOMER)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  userProfile  UserProfile @relation(fields: [userProfileId], references: [id], onDelete: Cascade)
  tenant       Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userProfileId, tenantId])
  @@index([userProfileId])
  @@index([tenantId])
  @@map("user_tenants")
}
```

#### Updated UserProfile Model
- Added `userTenants` relationship for direct access to multiple tenants

#### Updated Tenant Model
- Added `userTenants` relationship for many-to-many with users

### 2. **Backend Changes**

#### Auth Utils (`backend/src/utils/auth.ts`)
- Updated `JWTPayload` interface to include:
  ```typescript
  accessibleTenants?: Array<{ id: string; subdomain: string }>;
  ```

#### User Service (`backend/src/services/UserService.ts`)
- Updated `login()` method to:
  - Fetch user with UserProfile and UserTenant relationships
  - Build list of accessible tenants (primary + additional)
  - Include accessible tenants in JWT token
  - Return accessible tenants in response

#### Tenant Middleware (`backend/src/middleware/tenant.ts`)
- Added multi-tenant security validation:
  - Extracts JWT token from Authorization header
  - Validates user has access to requested tenant
  - Checks both primary tenant and accessible tenants list
  - Returns 403 if user attempts unauthorized tenant access
  - Logs security violations

### 3. **Frontend Changes**

#### Types (`frontend/src/types/index.ts`)
- Updated `AuthUser` interface to include:
  ```typescript
  accessibleTenants?: Array<{
    id: string;
    subdomain: string;
    name: string;
    isPrimary: boolean;
  }>;
  ```

#### Tenant Switcher Component (`frontend/src/components/common/TenantSwitcher.tsx`)
- **New component** for switching between accessible tenants
- Features:
  - Dropdown showing all accessible organizations
  - Current tenant highlighted with checkmark
  - Primary tenant badge
  - Updates localStorage and reloads page on switch
  - Only shows when user has access to multiple tenants

#### Main Layout (`frontend/src/components/layout/MainLayout.tsx`)
- Added `<TenantSwitcher />` to desktop navigation bar
- Positioned between logo and theme toggle

---

## 🎯 How It Works

### User Flow

#### Single Tenant User (Business User)
```
1. User logs in → Acme Corp
2. No tenant switcher shown
3. Works normally within Acme
```

#### Multi-Tenant User (Customer/Consultant)
```
1. Customer logs in → Primary tenant (Acme)
2. Sees tenant switcher with: Acme, TechCorp, GlobalCo
3. Clicks "TechCorp" in switcher
4. Page reloads with TechCorp data
5. All API calls now use X-Tenant-ID: techcorp
6. Backend validates user has access
7. Can switch back to Acme anytime
```

### Security Flow

```
1. User requests data for tenant "techcorp"
2. Frontend sends: X-Tenant-ID: techcorp
3. Tenant middleware intercepts request
4. Extracts JWT token from Authorization header
5. Decodes token → gets accessibleTenants array
6. Checks if "techcorp" is in accessible tenants
7. If YES → Allow request ✅
8. If NO → Return 403 Forbidden ❌
```

---

## 🔒 Security Features

1. **JWT Contains Accessible Tenants**
   - Token includes list of all tenants user can access
   - Prevents manual tenant switching

2. **Backend Validates Every Request**
   - Middleware checks tenant access on ALL requests
   - No reliance on frontend validation

3. **Logs Security Violations**
   - Attempts to access unauthorized tenants are logged
   - Includes user ID, email, and attempted tenant

4. **Primary Tenant Tracking**
   - Users have a primary tenant (first joined)
   - Can access additional tenants via UserTenant table

---

## 📋 Next Steps

### Required Actions:

1. **Restart Backend Server**
   ```bash
   cd backend
   npx prisma generate  # Regenerate Prisma client
   npm run dev
   ```

2. **Rebuild Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Test Multi-Tenant Access**
   - Create test user in multiple tenants
   - Login and verify tenant switcher appears
   - Switch tenants and verify data changes
   - Test unauthorized access (should be blocked)

### Optional Enhancements:

1. **Add User to Tenant API**
   ```typescript
   POST /api/users/:userId/tenants
   {
     "tenantSubdomain": "techcorp",
     "role": "CUSTOMER"
   }
   ```

2. **Tenant Invitation System**
   - Send email invite to join tenant
   - Accept/reject invitation flow

3. **Remove User from Tenant**
   ```typescript
   DELETE /api/users/:userId/tenants/:tenantId
   ```

---

## 🎨 UI/UX Features

### Tenant Switcher
- **Location**: Top navigation bar (desktop only)
- **Appearance**: Shows current organization name
- **Dropdown**: Lists all accessible organizations
- **Indicators**:
  - ✅ Checkmark for current tenant
  - 🏷️ "Primary" badge for primary tenant
- **Action**: Click tenant → Updates localStorage → Reloads page

### Mobile Support
- TODO: Add mobile tenant switcher in sidebar
- Currently desktop-only

---

## 🧪 Testing Scenarios

### Test 1: Single Tenant User
```
1. Login as business user (sales@acme.com)
2. Verify NO tenant switcher shown
3. All requests use Acme tenant
4. Cannot access other tenants
```

### Test 2: Multi-Tenant Customer
```
1. Create customer account in Acme
2. Add same user to TechCorp (via UserTenant)
3. Login → See tenant switcher
4. Switch to TechCorp → Data reloads
5. Verify tickets/data from TechCorp shown
```

### Test 3: Security Validation
```
1. Login as user with access to Acme only
2. Manually change localStorage: tenant = "techcorp"
3. Make API request
4. Backend returns 403 Forbidden
5. Console shows security violation log
```

---

## 📊 Database Migration Status

**Migration Applied**: ✅ `db push` completed successfully
- `user_tenants` table created
- Relationships updated
- Indexes added

**Prisma Client**: ⚠️ Needs regeneration
- Run: `npx prisma generate`
- May need to restart backend after generation

---

## 🔧 Configuration

### Environment Variables
No new environment variables required. Uses existing:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`

### localStorage Keys
- `tenant`: Current tenant subdomain
- `accessToken`: JWT with accessible tenants
- `user`: User object with accessible tenants

---

## 📝 API Changes

### Login Response Now Includes:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "firstName": "...",
      "lastName": "...",
      "role": "CUSTOMER",
      "accessibleTenants": [
        {
          "id": "uuid-1",
          "subdomain": "acme",
          "name": "Acme Corp",
          "isPrimary": true
        },
        {
          "id": "uuid-2",
          "subdomain": "techcorp",
          "name": "TechCorp",
          "isPrimary": false
        }
      ]
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### JWT Token Payload:
```json
{
  "userId": "...",
  "tenantId": "...",
  "email": "...",
  "role": "...",
  "accessibleTenants": [
    { "id": "uuid-1", "subdomain": "acme" },
    { "id": "uuid-2", "subdomain": "techcorp" }
  ]
}
```

---

## ✅ Implementation Checklist

- [x] Update Prisma schema
- [x] Create UserTenant junction table
- [x] Update UserProfile relationships
- [x] Update Tenant relationships
- [x] Run database migration (db push)
- [x] Update JWTPayload interface
- [x] Update UserService login method
- [x] Update Tenant middleware (security)
- [x] Update AuthUser type
- [x] Create TenantSwitcher component
- [x] Add TenantSwitcher to MainLayout
- [ ] Generate Prisma client
- [ ] Restart backend server
- [ ] Rebuild frontend
- [ ] Test multi-tenant access
- [ ] Test security validation

---

## 🚀 Deployment Notes

1. **Database Migration**
   - Migration already applied via `db push`
   - Production: Use `prisma migrate deploy`

2. **Zero Downtime**
   - Schema changes are additive
   - Existing single-tenant users work as-is
   - Multi-tenant features only active when UserTenant records exist

3. **Rollback Plan**
   - UserTenant table can be dropped without affecting existing users
   - accessibleTenants field is optional in JWT

---

## 📚 Documentation for Developers

### Adding User to Additional Tenant

```typescript
// Backend service method needed
async addUserToTenant(userProfileId: string, tenantId: string, role: UserRole) {
  await prisma.userTenant.create({
    data: {
      userProfileId,
      tenantId,
      role
    }
  });
}
```

### Checking User's Tenants

```typescript
const userProfile = await prisma.userProfile.findUnique({
  where: { id: userProfileId },
  include: {
    userTenants: {
      include: {
        tenant: true
      }
    }
  }
});

const accessibleTenants = userProfile.userTenants.map(ut => ut.tenant);
```

---

**Implementation Date**: November 9, 2025
**Status**: ✅ Backend Complete | ⚠️ Needs Testing
