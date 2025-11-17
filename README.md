# Tawasol CRM - Complete Setup Guide

A multi-tenant CRM system with separate dashboards for Companies and Customers.

## 📋 Prerequisites

Before you begin, make sure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository

```bash
git clone <your-github-repo-url>
cd tawasol
```

### Step 2: Database Setup

#### Create Database
Open MySQL command line or Workbench:

```sql
DROP DATABASE IF EXISTS tawasol_crm;
CREATE DATABASE tawasol_crm;
USE tawasol_crm;
```

#### Run Schema File
**Option 1 - MySQL Command Line:**
```sql
SOURCE C:/path/to/tawasol/Backend/schema.sql;
```

**Option 2 - MySQL Workbench:**
- Open `Backend/schema.sql`
- Execute the script (Ctrl + Shift + Enter)

**Verify tables:**
```sql
SHOW TABLES;
```
Expected output: `companies`, `customers`, `company_customer_relationship`, `leads`

---

### Step 3: Backend Setup

```bash
cd Backend
npm install
```

#### Create `.env` file in Backend folder:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=tawasol_crm
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRATION=7d
```

**⚠️ Important:** 
- Update `DB_PASSWORD` with your MySQL password (leave empty if no password)
- Change `JWT_SECRET` to a secure random string

#### Start Backend:
```bash
npm run dev
```

Expected output:
```
✅ Database connected successfully
🚀 Tawasol CRM Server is running
📡 Port: 3000
```

---

### Step 4: Frontend Setup

Open **new terminal**:

```bash
cd Frontend
npm install
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:5173/
```

---

## 🌐 Access the Application

### For Companies:
- **Signup:** http://localhost:5173/auth/signup-company
- **Login:** http://localhost:5173/auth/signin-company
- **Dashboard:** http://localhost:5173/dashboard/company

### For Customers:
- **Signup:** http://localhost:5173/auth/signup-customer
- **Login:** http://localhost:5173/auth/signin-customer
- **Dashboard:** http://localhost:5173/dashboard/customer

---

## 📁 Project Structure

```
tawasol/
├── Backend/
│   ├── controllers/
│   │   ├── companyController.js
│   │   ├── customerController.js
│   │   ├── leadController.js
│   │   ├── customerManagementController.js
│   │   └── customerProfileController.js
│   ├── db/
│   │   └── connection.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   └── rpcRoutes.js
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── schema.sql
│   ├── index.js
│   ├── package.json
│   └── .env (you create this)
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   ├── layout/
    │   │   ├── Auth.jsx
    │   │   ├── MainLayot.jsx
    │   │   └── DashboardLayout.jsx
    │   ├── pages/
    │   │   ├── company/
    │   │   │   ├── Overview.jsx
    │   │   │   ├── Profile.jsx
    │   │   │   ├── Customers.jsx
    │   │   │   ├── Leads.jsx
    │   │   │   ├── Analytics.jsx
    │   │   │   ├── Email.jsx
    │   │   │   └── Support.jsx
    │   │   └── customer/
    │   │       ├── Overview.jsx
    │   │       ├── Profile.jsx
    │   │       └── MyCompanies.jsx
    │   ├── router/
    │   │   └── router.jsx
    │   └── main.jsx
    └── package.json
```

---

## ✨ Features

### Company Dashboard:
- ✅ Overview with statistics
- ✅ Profile management (update company info)
- ✅ Customer management (Add/Edit/Remove customers)
- ✅ Lead management (CRUD operations + Convert to Customer)
- ✅ Analytics (Real-time data from database)
- ✅ Email integration placeholder
- ✅ Customer support placeholder
- ✅ Fully responsive for mobile/tablet/desktop

### Customer Dashboard:
- ✅ Overview with quick actions
- ✅ Profile management (update personal info)
- ✅ My Companies (Browse and add companies)
- ✅ Add/Remove companies from service list
- ✅ Fully responsive design

---

## 🔧 Troubleshooting

### 1. Database Connection Failed
```
Error: Access denied for user 'root'@'localhost'
```
**Fix:** Check `DB_PASSWORD` in `Backend/.env`

---

### 2. Port 3000 Already in Use
```
Error: EADDRINUSE: address already in use :::3000
```

**Windows Fix:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**Or change port in `.env`:**
```env
PORT=3001
```

---

### 3. Tables Not Found
```
Error: Table 'tawasol_crm.companies' doesn't exist
```
**Fix:** Run `Backend/schema.sql` again in MySQL

---

### 4. Module Not Found
```
Error: Cannot find module 'express'
```
**Fix:** 
```bash
cd Backend
npm install
```

---

### 5. Frontend Won't Start
```
Error: Port 5173 is in use
```
**Fix:** Vite will ask to use another port, press `y`

---

## 🧪 Testing the Application

### Test Company Features:
1. Signup as company: http://localhost:5173/auth/signup-company
2. Login to dashboard
3. Go to Leads → Add new lead
4. Convert lead to customer (creates customer account automatically)
5. Go to Customers → View all customers
6. Go to Analytics → See real-time statistics
7. Update profile from Profile page

### Test Customer Features:
1. Signup as customer: http://localhost:5173/auth/signup-customer
2. Login to dashboard
3. Go to My Companies → Browse available companies
4. Click "Add Company" → Search and add companies
5. Remove companies from your list
6. Update profile from Profile page

---

## 📡 API Endpoints

### Public Routes:
- `POST /rpc/signupCompany`
- `POST /rpc/signinCompany`
- `POST /rpc/signupCustomer`
- `POST /rpc/signinCustomer`

### Company Protected Routes:
- `POST /rpc/updateCompanyProfile`
- `GET /rpc/getCompanyAnalytics`
- `GET /rpc/getCompanyLeads`
- `POST /rpc/createLead`
- `PUT /rpc/updateLead/:id`
- `DELETE /rpc/deleteLead/:id`
- `POST /rpc/convertLead/:id`
- `GET /rpc/getCompanyCustomers`
- `POST /rpc/addCustomer`
- `PUT /rpc/updateCustomer/:id`
- `DELETE /rpc/removeCustomer/:id`

### Customer Protected Routes:
- `POST /rpc/updateCustomerProfile`
- `GET /rpc/getAllCompanies`
- `GET /rpc/getCustomerCompanies`
- `POST /rpc/addCompanyToCustomer`
- `DELETE /rpc/removeCompanyFromCustomer/:companyId`

---

## 💻 Tech Stack

### Backend:
- **Node.js** + **Express.js** 5.1.0
- **MySQL** with mysql2
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled
- **dotenv** for environment variables

### Frontend:
- **React** 19.2.0
- **React Router** 7.9.6
- **Tailwind CSS** 4.1.17
- **Vite** build tool
- **react-hot-toast** for notifications

---

## 🛠️ Development Commands

### Backend:
```bash
npm run dev      # Development with nodemon
npm start        # Production
```

### Frontend:
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 📦 Production Deployment

Before deploying:

1. **Update `.env` for production:**
```env
PORT=3000
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=strong-password
DB_NAME=tawasol_crm
JWT_SECRET=very-secure-random-string-min-32-chars
JWT_EXPIRATION=7d
NODE_ENV=production
```

2. **Update CORS in `Backend/index.js`:**
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

3. **Update API URLs in Frontend:**
Replace `http://localhost:3000` with your production API URL in all fetch calls

4. **Build Frontend:**
```bash
cd Frontend
npm run build
```

5. **Use PM2 for Backend:**
```bash
npm install -g pm2
pm2 start Backend/index.js --name tawasol-crm
pm2 startup
pm2 save
```

---

## 🔐 Security Notes

- Never commit `.env` file to Git
- Use strong JWT_SECRET (minimum 32 characters)
- Use HTTPS in production
- Sanitize all user inputs
- Keep dependencies updated

---

## 📝 Database Schema

Tables created:
- `companies` - Company accounts
- `customers` - Customer accounts  
- `company_customer_relationship` - Many-to-many relationships
- `leads` - Potential customers for companies

---

## ❓ Need Help?

1. Check Troubleshooting section above
2. Verify all prerequisites are installed
3. Make sure MySQL is running
4. Check ports 3000 and 5173 are available
5. Run `npm install` in both Backend and Frontend

---

## 📄 License

Educational project - Free to use and modify

---

**Built with ❤️ using React, Express, and MySQL**

**Happy Coding! 🚀**
