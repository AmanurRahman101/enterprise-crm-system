# Tawasol CRM - Setup Guide

## 🚀 Quick Start (5 Minutes)

This guide will help you set up the complete Tawasol CRM development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js** v18 or higher ([Download](https://nodejs.org/))
- ✅ **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- ✅ **Redis** 7 or higher ([Download](https://redis.io/download))
- ✅ **Android Studio** (for mobile development) ([Download](https://developer.android.com/studio))
- ✅ **Git** ([Download](https://git-scm.com/))

## Step-by-Step Setup

### Step 1: Clone Repository (Skip if already done)

```bash
git clone <repository-url>
cd Tawasol
```

### Step 2: Backend Setup

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env file with your PostgreSQL credentials
# Use notepad or any editor
notepad .env
```

**Configure your .env file:**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tawasol_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**Setup Database:**
```powershell
# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

**Start Backend Server:**
```powershell
npm run dev
```

✅ Backend should be running on `http://localhost:5000`

### Step 3: Frontend Setup

Open a **new terminal window**:

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Start frontend
npm start
```

✅ Frontend should open automatically at `http://localhost:3000`

### Step 4: Verify Setup

1. **Check Backend Health:**
   - Open browser: `http://localhost:5000/health`
   - Should see: `{"status":"success","message":"Tawasol CRM API is running"}`

2. **Check Frontend:**
   - Open browser: `http://localhost:3000`
   - Should see: "🚀 Tawasol CRM - Coming Soon"

3. **Check Database:**
   ```powershell
   npm run prisma:studio
   ```
   - Opens database viewer in browser

## 🎯 Next Steps After Setup

Now that your environment is ready, proceed with development prompts:

- **Prompt 2**: Database Schema & Models Implementation
- **Prompt 3**: Authentication System
- **Prompt 4**: Contact Management Backend
- And so on...

## 🔧 Troubleshooting

### Issue: PostgreSQL connection error

**Solution:**
1. Ensure PostgreSQL is running
2. Verify credentials in `.env`
3. Create database manually:
   ```sql
   CREATE DATABASE tawasol_db;
   ```

### Issue: Port already in use

**Solution:**
1. Backend (5000):
   ```powershell
   # Find process
   netstat -ano | findstr :5000
   # Kill process (replace PID)
   taskkill /PID <PID> /F
   ```

2. Frontend (3000):
   ```powershell
   # Find process
   netstat -ano | findstr :3000
   # Kill process
   taskkill /PID <PID> /F
   ```

### Issue: npm install fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -r node_modules
npm install
```

### Issue: Prisma migration fails

**Solution:**
```powershell
# Reset database (WARNING: Deletes all data)
npm run prisma:migrate -- reset

# Or create database manually
npx prisma db push
```

## 📱 Mobile Setup (Later)

Mobile development will be set up in later prompts. For now, focus on backend and frontend.

## 🛠️ Development Tools

### Recommended VS Code Extensions
- ESLint
- Prettier
- Prisma
- TypeScript
- GitLens

### Recommended Browser Extensions
- React Developer Tools
- Redux DevTools

## 🔐 Security Notes

- Never commit `.env` files
- Change JWT_SECRET in production
- Use strong database passwords
- Keep dependencies updated

## 📚 Documentation

- **Backend**: `docs/BACKEND.md`
- **Frontend**: `docs/FRONTEND.md`
- **Mobile**: `docs/MOBILE.md`

## 🆘 Need Help?

- Check documentation in `docs/` folder
- Review PRD: `Tawasol PRD Final.md`
- Check logs in `backend/logs/`

## ✅ Setup Complete!

You're now ready to start building Tawasol CRM! 🎉

**Say "Start Prompt 2"** when ready to continue development.
