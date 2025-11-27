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

# AI Agent / Telegram Bot
GEMINI_API_KEY=         # Required for Google Gemini AI
TELEGRAM_BOT_TOKEN=     # Required for Telegram bot
MCP_CLIENT_SSE_URL=http://localhost:3000/mcp/client/sse   # Client mode MCP endpoint
MCP_ORG_SSE_URL=http://localhost:3000/mcp/org/sse         # Organization mode MCP endpoint
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

> ℹ️ **MCP Debugging**: Run `npm run mcp` to start the MCP server standalone. This exposes both endpoints:
> - Client tools: `http://localhost:3000/mcp/client/sse`
> - Organization tools: `http://localhost:3000/mcp/org/sse`

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

### Step 6: (Optional) Start the Telegram Bot

The Telegram bot provides AI-powered CRM access with dual-mode operation:
- **Client Mode**: Report issues, view your deals, and interact with organizations as a customer
- **Organization Mode**: Full CRM management (deals, contacts, issues) for team members

#### Setup

1. **Create a Telegram Bot**
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Send `/newbot` and follow the prompts
   - Copy the bot token provided

2. **Configure Environment Variables**
   - Set `TELEGRAM_BOT_TOKEN` in `Backend/.env` to your bot token
   - Set `GEMINI_API_KEY` to your Google AI API key (get one at https://aistudio.google.com/apikey)
   - Optionally set `TELEGRAM_BOT_USERNAME` to your bot's username (without @)

3. **Start the Bot**
   ```bash
   cd Backend
   npm run bot
   ```
   
   You should see:
   ```
   🤖 Telegram bot started! Send /start to begin.
   ```

#### Linking Your Account

1. **Generate a Link Code**
   - In the CRM web app, go to **Settings → Telegram Link** (available in both Client and Organization dashboards)
   - Click **Generate Code** to get a 6-digit code (valid for 10 minutes)

2. **Link via Telegram**
   - Open your Telegram bot
   - Send `/start` to the bot
   - Send the 6-digit code
   - You'll see `✅ Account linked successfully!`

3. **Choose Interaction Mode**
   - After linking, the bot will ask how you want to interact:
     - **👤 Client Mode**: Access as a customer (report issues, view deals)
     - **🏢 Organization Mode**: Access as a team member (full CRM management)
   - If you're a member of multiple organizations, you can choose which one to manage

#### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot or link a new account |
| `/switch` | Switch between Client and Organization modes |
| `/status` | View current connection status and mode |
| `/help` | Show available commands and features |

#### Features by Mode

**Client Mode Tools:**
- View your deals across organizations
- Report issues to any organization
- Check issue status and history
- View personal stats

**Organization Mode Tools:**
- Create, update, and delete deals
- Manage contacts (both system and general contacts)
- Handle customer issues
- View organization statistics
- Search and link system users to contacts

The bot connects to segmented MCP endpoints:
- Client Mode: `http://localhost:3000/mcp/client/sse`
- Organization Mode: `http://localhost:3000/mcp/org/sse`

If you change ports or use a reverse proxy, update `MCP_CLIENT_SSE_URL` and `MCP_ORG_SSE_URL` accordingly.

---

## First Time Usage

### Create an Account

1. Click **"Sign Up"**
2. Fill in your details:
   - Full Name
   - Email
   - Password
   - Phone (optional)

3. Click **"Sign Up"**

> **Note:** After signup, every user automatically has access to the **Client Portal**. Users can then create or join organizations to access the **Organization Portal**.

### Access Options

**Client Portal (Available to All Users):**
- View deals where you're the contact person
- Report issues to organizations
- Track issue status and resolution
- Connect your Telegram account

**Organization Portal (After Creating/Joining an Organization):**

1. **Create an Organization:**
   - Go to Dashboard
   - Click **"Create Organization"**
   - Enter organization details (name, email, phone, address)

2. **Join an Existing Organization:**
   - Request an invite from an organization admin
   - Accept the invitation from your dashboard

### Using the CRM

**Organization Dashboard:**
- **Overview**: Key metrics and recent activity
- **Deals**: Full pipeline management with drag-and-drop stages
- **Contacts**: Manage both system contacts (CRM users) and general contacts
- **Issues**: Handle customer support tickets
- **Team**: Manage organization members and roles
- **Telegram Link**: Connect your Telegram account for AI-powered access

**Client Dashboard:**
- **Overview**: Personal stats and summary
- **My Deals**: Deals where you're the contact person
- **My Issues**: Create and track support issues
- **Telegram Link**: Connect your Telegram account

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

### Telegram Bot Issues

**Error: "Unable to connect to CRM server"**
- Ensure the backend server is running (`npm start` in Backend folder)
- Check that `MCP_CLIENT_SSE_URL` and `MCP_ORG_SSE_URL` point to the correct backend address

**Error: "TELEGRAM_BOT_TOKEN is not set"**
- Add your bot token to `Backend/.env`
- Get a token from [@BotFather](https://t.me/BotFather) on Telegram

**Error: "GEMINI_API_KEY is not set"**
- Add your API key to `Backend/.env`
- Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)

**Bot says "Conversation history issue"**
- This is auto-recovered; just retry your request
- If persistent, use `/start` to reset your session

**Bot shows "You don't have access"**
- All authenticated users can access Client Mode
- For Organization Mode, you must be a member of at least one organization
- Use `/switch` to change modes

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
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & validation
│   ├── services/         # External integrations (JIRA, etc.)
│   ├── mcp/
│   │   └── server.js     # MCP server with client & org endpoints
│   ├── telegram/
│   │   ├── auth.js       # Telegram auth utilities
│   │   └── sessionStore.js # Chat session management
│   ├── bot.js            # Telegram bot (Telegraf + Gemini AI)
│   ├── schema.sql        # Database schema
│   ├── index.js          # Server entry point
│   └── .env              # Configuration
│
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── client/   # Client portal pages
│   │   │   ├── organization/ # Organization portal pages
│   │   │   └── company/  # Company pages
│   │   ├── components/   # Reusable React components
│   │   ├── services/     # API & socket services
│   │   ├── layout/       # Layout components
│   │   └── router/       # Routes config
│   └── package.json
│
├── start.bat             # Windows: Start backend + frontend
├── stop.bat              # Windows: Stop all services
├── TelegramBot.bat       # Windows: Start Telegram bot
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

- **Telegram Bot**: Set up the AI-powered Telegram bot for mobile CRM access (see Step 6)
- **JIRA Integration**: Connect to JIRA for issue synchronization (optional)
- **Agora Voice Calls**: Enable in-app voice calling with Agora (optional)
- **Production Deployment**: Deploy to your production server with proper SSL

---

## Quick Reference

### Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | MySQL host (usually `localhost`) |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | No | MySQL password (empty if none) |
| `DB_NAME` | Yes | Database name (`tawasol_crm`) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `PORT` | No | Backend port (default: 3000) |
| `GEMINI_API_KEY` | For bot | Google AI API key |
| `TELEGRAM_BOT_TOKEN` | For bot | Telegram bot token |
| `MCP_CLIENT_SSE_URL` | For bot | Client MCP endpoint URL |
| `MCP_ORG_SSE_URL` | For bot | Organization MCP endpoint URL |

### Available npm Scripts (Backend)

| Command | Description |
|---------|-------------|
| `npm start` | Start the backend server |
| `npm run bot` | Start the Telegram bot |
| `npm run mcp` | Start MCP server standalone (debugging) |

### Available npm Scripts (Frontend)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

**Enjoy using Tawasol CRM! 🚀**
