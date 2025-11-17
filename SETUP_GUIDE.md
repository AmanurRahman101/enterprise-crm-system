# 🚀 QUICK START GUIDE - Tawasol CRM

## ✅ What's Already Done

All files have been created and dependencies installed! Here's what you have:

### Frontend (React + Tailwind CSS)
- ✅ Home/Landing page with hero section
- ✅ Company Signup & Signin pages
- ✅ Customer Signup & Signin pages  
- ✅ Company Dashboard
- ✅ Customer Dashboard
- ✅ React Router configured
- ✅ All dependencies installed

### Backend (Express.js + MySQL)
- ✅ Database schema (schema.sql)
- ✅ JWT authentication middleware
- ✅ Company authentication controller
- ✅ Customer authentication controller
- ✅ RPC-style routes
- ✅ Database connection setup
- ✅ All dependencies installed (bcryptjs, jsonwebtoken, mysql2, nodemon)

## 📋 NEXT STEPS (Do This Now)

### Step 1: Setup MySQL Database

```sql
-- Open MySQL Workbench or MySQL Command Line

-- Create database
CREATE DATABASE tawasol_crm;

-- Use the database
USE tawasol_crm;

-- Copy and paste the entire content of Backend/schema.sql
-- OR import it using MySQL Workbench
```

**Alternative method using command line:**
```powershell
mysql -u root -p
# Enter your MySQL password
# Then run:
CREATE DATABASE tawasol_crm;
USE tawasol_crm;
source C:\Web- my personal projects\tawasol\Backend\schema.sql;
```

### Step 2: Configure Database Password

1. Open `Backend\.env`
2. Update `DB_PASSWORD` with your MySQL root password:
   ```
   DB_PASSWORD=your_mysql_password_here
   ```

### Step 3: Start the Backend Server

```powershell
# Open Terminal 1 (PowerShell)
cd "C:\Web- my personal projects\tawasol\Backend"
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Tawasol CRM Server is running
📡 Port: 3000
```

### Step 4: Start the Frontend

```powershell
# Open Terminal 2 (PowerShell)
cd "C:\Web- my personal projects\tawasol\Frontend"
npm run dev
```

You should see:
```
Local:   http://localhost:5173/
```

### Step 5: Test the Application

1. Open browser: `http://localhost:5173`
2. You'll see the beautiful landing page
3. Click "Get Started as Company" to register
4. Fill in the form and submit
5. You'll be redirected to the Company Dashboard

## 🧪 Testing Checklist

- [ ] Database created successfully
- [ ] Backend server running on port 3000
- [ ] Frontend running on port 5173
- [ ] Can see the Home page
- [ ] Can register as Company
- [ ] Can login as Company
- [ ] Can see Company Dashboard
- [ ] Can register as Customer
- [ ] Can login as Customer
- [ ] Can see Customer Dashboard
- [ ] Logout works correctly

## 🔧 Troubleshooting

### Database Connection Error
```
❌ Database connection failed: ER_ACCESS_DENIED_ERROR
```
**Fix:** Check your MySQL password in `Backend\.env`

### Database Not Found
```
❌ Database connection failed: ER_BAD_DB_ERROR
```
**Fix:** Run `CREATE DATABASE tawasol_crm;` in MySQL

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Fix:** Change PORT in `Backend\.env` to 3001 or kill the process using port 3000

### CORS Error in Browser
```
Access to fetch has been blocked by CORS policy
```
**Fix:** Make sure backend is running and CORS is enabled (already configured)

## 📊 API Endpoints

### Test with PowerShell

```powershell
# Company Signup
$body = @{
    companyName = "Test Company"
    email = "test@company.com"
    password = "test123"
    phone = "+1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rpc/signupCompany" -Method Post -ContentType "application/json" -Body $body

# Company Signin
$body = @{
    email = "test@company.com"
    password = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rpc/signinCompany" -Method Post -ContentType "application/json" -Body $body
```

### Test with Browser Console

Open browser console (F12) and run:

```javascript
// Company Signup
fetch('http://localhost:3000/rpc/signupCompany', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'Test Company',
    email: 'test@company.com',
    password: 'test123'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

## 📁 File Structure Overview

```
Backend/
├── config/          # Configuration files
├── controllers/     # Business logic (auth)
├── db/             # Database connection
├── middleware/     # JWT verification
├── routes/         # API routes (RPC-style)
├── .env            # Environment variables
├── schema.sql      # Database schema
└── index.js        # Main server file

Frontend/
├── src/
│   ├── pages/         # All page components
│   ├── components/    # Reusable components
│   ├── router/        # Route configuration
│   └── layout/        # Layout components
```

## 🎯 What to Build Next

1. **Customer Management**
   - Add customers to companies
   - View customer list
   - Customer details page

2. **Ticketing System**
   - Create tickets
   - Assign tickets
   - Track ticket status

3. **Dashboard Analytics**
   - Customer count
   - Active tickets
   - Revenue charts

4. **Profile Management**
   - Edit company profile
   - Edit customer profile
   - Change password

5. **Integrations**
   - Jira integration
   - VoIP integration
   - Gmail API
   - Telegram bot

## 💡 Pro Tips

1. **Development Mode**: Use `npm run dev` for auto-reload
2. **Production Mode**: Use `npm start` for production
3. **Database Backup**: Regularly export your database
4. **Security**: Change JWT_SECRET in production
5. **Testing**: Test all endpoints before deploying

## 🆘 Need Help?

1. Check the main README.md for detailed documentation
2. Review the code comments in each file
3. Check console logs for error messages
4. Verify all services are running
5. Check database connection

---

**Ready to build your CRM! 🎉**

Start with Step 1 above and work through each step.
