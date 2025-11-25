# Tawasol CRM - Setup Guide

## Prerequisites

Before starting, make sure you have these installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MySQL** (v8.0 or higher)
   - Download XAMPP: https://www.apachefriends.org/
   - Or MySQL directly: https://dev.mysql.com/downloads/mysql/

3. **Git**
   - Download from: https://git-scm.com/downloads

---

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/MuhammadAdnanWasti/tawasol-crm.git
cd tawasol-crm
git checkout adnan-new
```

---

### Step 2: Database Setup

#### Option A: Using XAMPP (Recommended for Windows)

1. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start **Apache** and **MySQL**

2. **Open phpMyAdmin**
   - Go to: http://localhost/phpmyadmin

3. **Create Database**
   - Click **"New"** in the left sidebar
   - Database name: `tawasol_crm`
   - Collation: `utf8mb4_unicode_ci`
   - Click **"Create"**

4. **Import Schema**
   - Select the `tawasol_crm` database
   - Click **"Import"** tab
   - Click **"Choose File"**
   - Select: `Backend/schema.sql`
   - Click **"Go"** at the bottom

5. **Add deal_id Column**
   - Click **"SQL"** tab
   - Paste this command:
   ```sql
   ALTER TABLE issues ADD COLUMN deal_id INT AFTER organization_id;
   ALTER TABLE issues ADD INDEX idx_deal_id (deal_id);
   ALTER TABLE issues ADD CONSTRAINT fk_issues_deal_id FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
   ```
   - Click **"Go"**

#### Option B: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE tawasol_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Use the database
USE tawasol_crm;

# Import schema
SOURCE Backend/schema.sql;

# Add deal_id column
ALTER TABLE issues ADD COLUMN deal_id INT AFTER organization_id;
ALTER TABLE issues ADD INDEX idx_deal_id (deal_id);
ALTER TABLE issues ADD CONSTRAINT fk_issues_deal_id FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

# Exit
EXIT;
```

---

### Step 3: Backend Setup

```bash
# Navigate to Backend folder
cd Backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
# On Mac/Linux use: cp .env.example .env

# Edit .env file with your settings
```

**Edit the `.env` file:**

Open `Backend/.env` in a text editor and update:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Your MySQL password (empty if no password)
DB_NAME=tawasol_crm
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Server Configuration
NODE_ENV=development
PORT=3000

# Optional: JIRA Integration (skip for now)
# JIRA_URL=https://your-domain.atlassian.net
# JIRA_EMAIL=your-email@example.com
# JIRA_API_TOKEN=your-jira-api-token
# JIRA_PROJECT_KEY=CRM

# AI Agent / Telegram Host
GEMINI_API_KEY=         # Required for Google Gemini
TELEGRAM_BOT_TOKEN=     # Required for Telegram bot
MCP_SSE_URL=http://localhost:3000/mcp/sse
GEMINI_MODEL=gemini-2.5-flash
TELEGRAM_BOT_USERNAME=  # Optional handle (without @) shown in the UI
```

**Start the Backend:**

```bash
npm start
```

You should see:
```
✅ Database connected successfully
Server running on port 3000
```

> ℹ️ Need to debug the MCP layer in isolation? Run `npm run mcp` to start only `Backend/mcp/server.js` on its own Express instance.

---

### Step 4: Frontend Setup

Open a **NEW terminal** (keep backend running):

```bash
# Navigate to Frontend folder
cd Frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### Step 5: Access the Application

1. **Open your browser**
2. **Go to:** http://localhost:5173/

---

### Step 6: (Optional) Start the MCP Telegram Host

1. Confirm `GEMINI_API_KEY` and `TELEGRAM_BOT_TOKEN` are set in `Backend/.env`.
2. In a new terminal, start the host:
   ```bash
   cd Backend
   npm run bot
   ```
3. Link your Telegram account:
   - In the CRM, go to **Organization Dashboard → Telegram Link** and generate a 6-digit code.
   - Send the code to the bot. Once you get `✅ Account linked`, start asking CRM questions.

The host connects to the MCP server at `http://localhost:3000/mcp/sse`. If you reverse-proxy or change ports, update `MCP_SSE_URL` accordingly.

---

## First Time Usage

### Create an Account

1. Click **"Sign Up"**
2. Fill in your details:
   - Full Name
   - Email
   - Password
   - Phone (optional)
   - User Type: **Internal** (for organization staff) or **Client**

3. Click **"Sign Up"**

### Create an Organization (for Internal Users)

1. After signing in, you'll be prompted to create an organization
2. Enter:
   - Organization Name
   - Email
   - Phone
   - Address

3. Click **"Create Organization"**

### Start Using the CRM

**For Organization Users:**
- Dashboard: View overview
- Deals: Manage deals pipeline
- Contacts: Manage contacts
- Issues: View and manage client issues

**For Client Users:**
- My Deals: View deals assigned to you
- My Issues: Create issues for won deals
- Overview: See your stats

---

## Troubleshooting

### Backend won't start

**Error: "Cannot connect to database"**
- Make sure MySQL is running (XAMPP > MySQL > Start)
- Check `.env` file has correct DB_USER and DB_PASSWORD
- Verify database name is `tawasol_crm`

**Error: "Port 3000 already in use"**
- Stop any process using port 3000
- Or change PORT in `.env` to 3001

### Frontend won't start

**Error: "ENOENT: no such file or directory"**
- Run `npm install` again in Frontend folder

**Error: "Network error"**
- Make sure Backend is running on http://localhost:3000
- Check if firewall is blocking the connection

### Database errors

**Error: "Table doesn't exist"**
- Re-import `Backend/schema.sql` in phpMyAdmin

**Error: "Unknown column 'deal_id'"**
- Run the ALTER TABLE command from Step 2

---

## Default Test Data

The schema includes default deal stages:
- Lead (10% probability)
- Qualified (25% probability)
- Proposal (50% probability)
- Negotiation (75% probability)
- Won (100% probability)
- Lost (0% probability)

---

## Project Structure

```
tawasol-crm/
├── Backend/
│   ├── controllers/      # API logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── services/        # JIRA integration
│   ├── schema.sql       # Database schema
│   ├── index.js         # Server entry
│   └── .env            # Configuration
│
├── Frontend/
│   ├── src/
│   │   ├── pages/      # React pages
│   │   ├── components/ # React components
│   │   ├── services/   # API service
│   │   └── router/     # Routes config
│   └── package.json
│
└── README.md
```

---

## Support

If you encounter any issues:
1. Check the terminal for error messages
2. Verify all prerequisites are installed
3. Make sure MySQL is running
4. Check `.env` configuration

---

## Next Steps

- Configure JIRA integration (optional)
- Set up Agora for voice calls (optional)
- Configure Telegram bot (optional)
- Deploy to production server

**Enjoy using Tawasol CRM! 🚀**
