# Database Setup Instructions

## ⚠️ IMPORTANT: Run Updated Schema

The database schema has been updated with a new `leads` table and enhanced `company_customer_relationship` table. You MUST run the updated schema before using the new features.

## Steps to Update Database

### Option 1: Using MySQL Command Line

1. Open MySQL command line or terminal
2. Login to MySQL:
   ```bash
   mysql -u root -p
   ```

3. Drop the old database (if exists) and create fresh:
   ```sql
   DROP DATABASE IF EXISTS tawasol_crm;
   CREATE DATABASE tawasol_crm;
   USE tawasol_crm;
   ```

4. Run the schema file:
   ```sql
   SOURCE C:/Web- my personal projects/tawasol/Backend/schema.sql;
   ```
   
   **OR** copy and paste the entire content of `Backend/schema.sql` into the MySQL prompt.

5. Verify tables were created:
   ```sql
   SHOW TABLES;
   ```
   
   You should see:
   - companies
   - customers
   - company_customer_relationship
   - leads (NEW!)

6. Check leads table structure:
   ```sql
   DESCRIBE leads;
   ```

### Option 2: Using phpMyAdmin

1. Open phpMyAdmin in your browser (usually `http://localhost/phpmyadmin`)
2. Select the `tawasol_crm` database (or create it if it doesn't exist)
3. Click on the "SQL" tab
4. Copy the entire content of `Backend/schema.sql` and paste it
5. Click "Go" to execute
6. Verify all 4 tables exist in the left sidebar

### Option 3: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open the `Backend/schema.sql` file
4. Execute the script (Lightning bolt icon or Ctrl+Shift+Enter)
5. Refresh the Schemas panel to see the updated tables

## What Changed in the Database?

### New Table: `leads`
- Stores potential customers before they become actual customers
- Fields: id, company_id, full_name, email, phone, company_name, status, source, notes
- Status options: new, contacted, qualified, proposal, negotiation, converted, lost

### Updated Table: `company_customer_relationship`
- Added `added_by_company_id` field to track which company added the customer
- Enhanced foreign key relationships

## Verify Database is Ready

After running the schema, test the connection:

1. Make sure MySQL is running
2. Verify your `.env` file has correct database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=tawasol_crm
   ```

3. Restart the backend server

## Next Steps After Database Setup

1. **Restart Backend Server**
   - Stop the current backend server (Ctrl+C in the terminal)
   - Start it again: `npm start` or `node index.js`

2. **Test the New Endpoints**
   - Leads: `/rpc/getCompanyLeads`, `/rpc/createLead`, `/rpc/updateLead`, `/rpc/deleteLead`, `/rpc/convertLead`
   - Customers: `/rpc/getCompanyCustomers`, `/rpc/addCustomer`, `/rpc/updateCustomer`, `/rpc/removeCustomer`

3. **Navigate to New Pages**
   - After logging in as a company, you can access:
   - `/dashboard/company/leads` - Leads Management
   - `/dashboard/company/customers` - Customer Management
   - `/dashboard/company/email` - Email (placeholder)
   - `/dashboard/company/analytics` - Analytics (placeholder)
   - `/dashboard/company/support` - Support (placeholder)

## Troubleshooting

### Error: Table 'leads' doesn't exist
- Solution: You need to run the updated schema.sql file

### Error: Unknown column 'added_by_company_id'
- Solution: Drop the database and recreate it with the new schema

### Error: Access denied for user 'root'@'localhost'
- Solution: Check your DB_PASSWORD in the .env file

### Backend won't start after schema update
- Check that all tables were created successfully
- Verify MySQL service is running
- Check backend terminal for specific error messages

## Quick Command (MySQL CLI)

Run this single command to reset everything:

```sql
DROP DATABASE IF EXISTS tawasol_crm;
CREATE DATABASE tawasol_crm;
USE tawasol_crm;
SOURCE C:/Web- my personal projects/tawasol/Backend/schema.sql;
SHOW TABLES;
```

## Test Data (Optional)

After setting up, you can create a test company account to try the features:

1. Go to `http://localhost:5173/auth/signup-company`
2. Create a company account
3. Login and navigate to the Leads or Customers page
4. Test the CRUD operations

---

**Ready to test!** After running the database schema, restart your backend and start using the new features.
