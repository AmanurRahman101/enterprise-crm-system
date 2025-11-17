# 🚧 COMPANY DASHBOARD - IMPLEMENTATION GUIDE

## ✅ What's Been Created

### Layout
- ✅ `DashboardLayout.jsx` - Role-based sidebar with dynamic navigation

### Pages Created
- ✅ `company/Overview.jsx` - Dashboard overview with stats
- ✅ `company/Profile.jsx` - Company profile with edit functionality

---

## 🔨 What You Need to Complete

I've created the foundation. Here's what remains to be built:

### 1. FRONTEND PAGES (Create these files)

#### `Frontend/src/pages/company/Customers.jsx`
```jsx
- Table with customer list
- Add/Edit/Delete customer modals
- Search and filter functionality
- Pagination
- CRUD operations using fetch to:
  - GET /rpc/getCompanyCustomers
  - POST /rpc/addCustomer
  - POST /rpc/updateCustomer
  - POST /rpc/deleteCustomer
```

#### `Frontend/src/pages/company/Leads.jsx`
```jsx
- Leads table with status badges
- Add/Edit/Delete lead modals
- Lead status: New, Contacted, Qualified, Converted, Lost
- Filter by status
- CRUD operations using:
  - GET /rpc/getCompanyLeads
  - POST /rpc/createLead
  - POST /rpc/updateLead
  - POST /rpc/deleteLead
  - POST /rpc/convertLead (convert lead to customer)
```

#### `Frontend/src/pages/company/Analytics.jsx`
```jsx
- Install recharts: npm install recharts
- Bar chart for monthly leads
- Pie chart for lead status distribution  
- Line chart for customer growth
- Stats cards
- Use sample data initially
- Later connect to: GET /rpc/getAnalyticsData
```

#### `Frontend/src/pages/company/Email.jsx`
```jsx
- Basic email UI (placeholder for Gmail API)
- Compose email form
- Email list (inbox simulation)
- Send button (show toast "Gmail API integration coming soon")
```

#### `Frontend/src/pages/company/Support.jsx`
```jsx
- Customer support tickets UI (placeholder for Jira)
- Ticket list table
- Create ticket button
- Show message "Jira integration coming soon"
```

---

### 2. BACKEND SCHEMA UPDATES

#### Update `Backend/schema.sql`
Add these tables after the existing ones:

```sql
-- Leads Table
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update customers table to link with companies
ALTER TABLE company_customer_relationship
ADD COLUMN added_by_company_id INT,
ADD FOREIGN KEY (added_by_company_id) REFERENCES companies(id);
```

---

### 3. BACKEND CONTROLLERS

#### Create `Backend/controllers/leadController.js`
```javascript
const db = require('../db/connection');

// Get all leads for a company
const getCompanyLeads = async (req, res) => {
  try {
    const companyId = req.user.id;
    const [leads] = await db.query(
      'SELECT * FROM leads WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    res.json({ success: true, leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create lead
const createLead = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { fullName, email, phone, companyName, source, notes } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO leads (company_id, full_name, email, phone, company_name, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [companyId, fullName, email, phone, companyName, source, notes]
    );
    
    res.status(201).json({ success: true, message: 'Lead created', leadId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update lead
const updateLead = async (req, res) => {
  try {
    const { leadId, fullName, email, phone, companyName, status, source, notes } = req.body;
    const companyId = req.user.id;
    
    await db.query(
      'UPDATE leads SET full_name=?, email=?, phone=?, company_name=?, status=?, source=?, notes=? WHERE id=? AND company_id=?',
      [fullName, email, phone, companyName, status, source, notes, leadId, companyId]
    );
    
    res.json({ success: true, message: 'Lead updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete lead
const deleteLead = async (req, res) => {
  try {
    const { leadId } = req.body;
    const companyId = req.user.id;
    
    await db.query('DELETE FROM leads WHERE id=? AND company_id=?', [leadId, companyId]);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Convert lead to customer
const convertLead = async (req, res) => {
  try {
    const { leadId, password } = req.body;
    const companyId = req.user.id;
    const bcrypt = require('bcryptjs');
    
    // Get lead
    const [leads] = await db.query('SELECT * FROM leads WHERE id=? AND company_id=?', [leadId, companyId]);
    if (leads.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    const lead = leads[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create customer
    const [result] = await db.query(
      'INSERT INTO customers (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [lead.full_name, lead.email, hashedPassword, lead.phone]
    );
    
    // Link customer to company
    await db.query(
      'INSERT INTO company_customer_relationship (company_id, customer_id, status) VALUES (?, ?, ?)',
      [companyId, result.insertId, 'active']
    );
    
    // Update lead status
    await db.query('UPDATE leads SET status=? WHERE id=?', ['converted', leadId]);
    
    res.json({ success: true, message: 'Lead converted to customer' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCompanyLeads, createLead, updateLead, deleteLead, convertLead };
```

#### Create `Backend/controllers/customerManagementController.js`
```javascript
const db = require('../db/connection');
const bcrypt = require('bcryptjs');

// Get company customers
const getCompanyCustomers = async (req, res) => {
  try {
    const companyId = req.user.id;
    const [customers] = await db.query(
      `SELECT c.*, ccr.status, ccr.notes, ccr.created_at as relationship_date
       FROM customers c
       JOIN company_customer_relationship ccr ON c.id = ccr.customer_id
       WHERE ccr.company_id = ?
       ORDER BY ccr.created_at DESC`,
      [companyId]
    );
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add customer (existing or new)
const addCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { fullName, email, phone, password, notes } = req.body;
    
    // Check if customer exists
    const [existing] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
    
    let customerId;
    if (existing.length > 0) {
      customerId = existing[0].id;
    } else {
      // Create new customer
      const hashedPassword = await bcrypt.hash(password || 'defaultpass123', 10);
      const [result] = await db.query(
        'INSERT INTO customers (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
        [fullName, email, hashedPassword, phone]
      );
      customerId = result.insertId;
    }
    
    // Link to company
    await db.query(
      'INSERT INTO company_customer_relationship (company_id, customer_id, notes) VALUES (?, ?, ?)',
      [companyId, customerId, notes]
    );
    
    res.status(201).json({ success: true, message: 'Customer added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { customerId, fullName, phone, notes } = req.body;
    const companyId = req.user.id;
    
    await db.query('UPDATE customers SET full_name=?, phone=? WHERE id=?', [fullName, phone, customerId]);
    
    await db.query(
      'UPDATE company_customer_relationship SET notes=? WHERE company_id=? AND customer_id=?',
      [notes, companyId, customerId]
    );
    
    res.json({ success: true, message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove customer from company
const removeCustomer = async (req, res) => {
  try {
    const { customerId } = req.body;
    const companyId = req.user.id;
    
    await db.query(
      'DELETE FROM company_customer_relationship WHERE company_id=? AND customer_id=?',
      [companyId, customerId]
    );
    
    res.json({ success: true, message: 'Customer removed from company' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCompanyCustomers, addCustomer, updateCustomer, removeCustomer };
```

#### Update `Backend/controllers/companyController.js`
Add these functions:

```javascript
// Update company profile
const updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { companyName, email, phone, address } = req.body;
    
    await db.query(
      'UPDATE companies SET company_name=?, email=?, phone=?, address=? WHERE id=?',
      [companyName, email, phone, address, companyId]
    );
    
    const [companies] = await db.query('SELECT * FROM companies WHERE id=?', [companyId]);
    const { password, ...companyData } = companies[0];
    
    res.json({ success: true, message: 'Profile updated', company: companyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get company stats
const getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const [customers] = await db.query(
      'SELECT COUNT(*) as count FROM company_customer_relationship WHERE company_id=?',
      [companyId]
    );
    
    const [leads] = await db.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status IN ("new", "contacted", "qualified") THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status="converted" THEN 1 ELSE 0 END) as converted FROM leads WHERE company_id=?',
      [companyId]
    );
    
    res.json({
      success: true,
      stats: {
        totalCustomers: customers[0].count,
        totalLeads: leads[0].total || 0,
        activeLeads: leads[0].active || 0,
        convertedLeads: leads[0].converted || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get analytics data
const getAnalyticsData = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    // Monthly leads data
    const [monthlyLeads] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
       FROM leads WHERE company_id=?
       GROUP BY month ORDER BY month DESC LIMIT 6`,
      [companyId]
    );
    
    // Lead status distribution
    const [statusDist] = await db.query(
      'SELECT status, COUNT(*) as count FROM leads WHERE company_id=? GROUP BY status',
      [companyId]
    );
    
    res.json({ success: true, monthlyLeads, statusDistribution: statusDist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all
module.exports = {
  signupCompany,
  signinCompany,
  updateCompanyProfile,
  getCompanyStats,
  getAnalyticsData
};
```

---

### 4. UPDATE ROUTES

#### Update `Backend/routes/rpcRoutes.js`
```javascript
const leadController = require('../controllers/leadController');
const customerMgmt = require('../controllers/customerManagementController');
const { updateCompanyProfile, getCompanyStats, getAnalyticsData } = require('../controllers/companyController');

// Company protected routes
router.post('/updateCompanyProfile', verifyToken, isCompany, updateCompanyProfile);
router.get('/getCompanyStats', verifyToken, isCompany, getCompanyStats);
router.get('/getAnalyticsData', verifyToken, isCompany, getAnalyticsData);

// Customer management
router.get('/getCompanyCustomers', verifyToken, isCompany, customerMgmt.getCompanyCustomers);
router.post('/addCustomer', verifyToken, isCompany, customerMgmt.addCustomer);
router.post('/updateCustomer', verifyToken, isCompany, customerMgmt.updateCustomer);
router.post('/removeCustomer', verifyToken, isCompany, customerMgmt.removeCustomer);

// Lead management
router.get('/getCompanyLeads', verifyToken, isCompany, leadController.getCompanyLeads);
router.post('/createLead', verifyToken, isCompany, leadController.createLead);
router.post('/updateLead', verifyToken, isCompany, leadController.updateLead);
router.post('/deleteLead', verifyToken, isCompany, leadController.deleteLead);
router.post('/convertLead', verifyToken, isCompany, leadController.convertLead);
```

---

### 5. UPDATE ROUTER

#### Update `Frontend/src/router/router.jsx`
```javascript
import DashboardLayout from '../layout/DashboardLayout';
import CompanyOverview from '../pages/company/Overview';
import CompanyProfile from '../pages/company/Profile';
import CompanyCustomers from '../pages/company/Customers';
import CompanyLeads from '../pages/company/Leads';
import CompanyAnalytics from '../pages/company/Analytics';
import CompanyEmail from '../pages/company/Email';
import CompanySupport from '../pages/company/Support';

// Add to router:
{
  path: "/dashboard/company",
  Component: DashboardLayout,
  children: [
    { path: '/dashboard/company/overview', Component: CompanyOverview },
    { path: '/dashboard/company/profile', Component: CompanyProfile },
    { path: '/dashboard/company/customers', Component: CompanyCustomers },
    { path: '/dashboard/company/leads', Component: CompanyLeads },
    { path: '/dashboard/company/analytics', Component: CompanyAnalytics },
    { path: '/dashboard/company/email', Component: CompanyEmail },
    { path: '/dashboard/company/support', Component: CompanySupport },
  ]
}
```

---

## 📝 SUMMARY

**You now have:**
1. ✅ DashboardLayout with dynamic sidebar
2. ✅ Company Overview page
3. ✅ Company Profile page with edit
4. ✅ Backend controller templates
5. ✅ Database schema design

**You still need to create:**
1. ❌ Customers page (CRUD)
2. ❌ Leads page (CRUD)
3. ❌ Analytics page (with charts)
4. ❌ Email page (placeholder)
5. ❌ Support page (placeholder)
6. ❌ Implement all backend controllers
7. ❌ Update database schema
8. ❌ Update routes configuration

This guide provides all the code templates you need. Copy and adapt them to complete your dashboard!
