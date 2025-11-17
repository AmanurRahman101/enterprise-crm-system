# ⚡ QUICK REFERENCE GUIDE

## 🚀 Start Development (Copy & Paste)

### Terminal 1 - Backend
```powershell
cd "C:\Web- my personal projects\tawasol\Backend"
npm run dev
```

### Terminal 2 - Frontend
```powershell
cd "C:\Web- my personal projects\tawasol\Frontend"
npm run dev
```

---

## 📝 First Time Setup (Only Once)

### 1. Create Database
```sql
CREATE DATABASE tawasol_crm;
USE tawasol_crm;
```
Then run the SQL from `Backend/schema.sql`

### 2. Update .env
File: `Backend/.env`
```
DB_PASSWORD=your_mysql_password
```

---

## 🔗 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

---

## 📊 Database Tables

```
companies (id, company_name, email, password, phone, address)
customers (id, full_name, email, password, phone)
company_customer_relationship (company_id, customer_id, status)
```

---

## 🛣️ Frontend Routes

```
/                           → Home Page
/auth/signup-company        → Company Signup
/auth/signin-company        → Company Signin
/auth/signup-customer       → Customer Signup
/auth/signin-customer       → Customer Signin
/dashboard/company          → Company Dashboard (Protected)
/dashboard/customer         → Customer Dashboard (Protected)
```

---

## 🔌 API Endpoints

### Public
```
POST /rpc/signupCompany     → Register company
POST /rpc/signinCompany     → Login company
POST /rpc/signupCustomer    → Register customer
POST /rpc/signinCustomer    → Login customer
```

### Protected (Needs Token)
```
GET /rpc/getCompanyProfile  → Company profile
GET /rpc/getCustomerProfile → Customer profile
GET /rpc/verifyToken        → Verify JWT token
```

---

## 💾 Test API (PowerShell)

### Company Signup
```powershell
$body = @{
    companyName = "Test Company"
    email = "test@company.com"
    password = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rpc/signupCompany" -Method Post -ContentType "application/json" -Body $body
```

### Company Signin
```powershell
$body = @{
    email = "test@company.com"
    password = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rpc/signinCompany" -Method Post -ContentType "application/json" -Body $body
```

---

## 📂 Important Files

### Backend
```
Backend/
├── index.js              → Main server
├── .env                  → Environment config
├── schema.sql            → Database schema
├── config/
│   ├── database.js       → DB config
│   └── jwt.js            → JWT config
├── controllers/
│   ├── companyController.js
│   └── customerController.js
├── middleware/
│   └── auth.js           → JWT verification
└── routes/
    └── rpcRoutes.js      → API routes
```

### Frontend
```
Frontend/src/
├── pages/
│   ├── Home.jsx
│   ├── SignupCompany.jsx
│   ├── SigninCompany.jsx
│   ├── SignupCustomer.jsx
│   ├── SigninCustomer.jsx
│   ├── CompanyDashboard.jsx
│   └── CustomerDashboard.jsx
├── router/
│   └── router.jsx        → Routes
└── components/
    ├── Navbar.jsx
    └── Footer.jsx
```

---

## 🔧 Common Commands

### Backend
```powershell
npm run dev              # Start with nodemon
npm start                # Start production
npm install              # Install dependencies
```

### Frontend
```powershell
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Database
```sql
-- View companies
SELECT * FROM companies;

-- View customers
SELECT * FROM customers;

-- View relationships
SELECT * FROM company_customer_relationship;

-- Count users
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM customers;
```

---

## 🐛 Troubleshooting

### Backend won't start
1. Check MySQL is running
2. Verify .env DB_PASSWORD
3. Check port 3000 is free

### Frontend won't start
1. Check npm dependencies installed
2. Check port 5173 is free

### Database connection error
1. Verify MySQL is running
2. Check database exists: `SHOW DATABASES;`
3. Verify credentials in .env

### CORS error
1. Make sure backend is running
2. Check backend console for errors

---

## 📚 Documentation Files

- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Setup instructions
- `API_TESTING.md` - API testing guide
- `DEPLOYMENT.md` - Deployment guide
- `PROJECT_SUMMARY.md` - Complete overview
- `QUICK_REFERENCE.md` - This file

---

## 🎯 Development Workflow

1. Start backend → Terminal 1
2. Start frontend → Terminal 2
3. Make changes to files
4. Test in browser
5. Check backend logs for API calls
6. Commit changes to git

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt
- JWT tokens expire in 7 days
- Change JWT_SECRET in production
- Use HTTPS in production

---

## 📊 Tech Stack

**Frontend:**
- React 19.2.0
- React Router 7.9.6
- Tailwind CSS 4.1.17
- Vite 7.2.2

**Backend:**
- Express.js 5.1.0
- MySQL (mysql2)
- JWT (jsonwebtoken)
- bcryptjs

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Home page loads
- [ ] Company signup works
- [ ] Company signin works
- [ ] Company dashboard shows
- [ ] Customer signup works
- [ ] Customer signin works
- [ ] Customer dashboard shows
- [ ] Logout works

---

## 🚀 Next Features to Build

1. Add customer to company
2. Customer list page
3. Edit profile functionality
4. Ticketing system
5. Search functionality
6. Analytics dashboard

---

**Keep this file handy for quick reference! 📌**
