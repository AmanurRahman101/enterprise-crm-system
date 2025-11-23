# Tawasol CRM

A comprehensive multi-tenant CRM system with real-time voice calling capabilities, built with React, Node.js, Express, and MySQL.

## Features

- 🔐 **Multi-tenant Architecture**: Organization-based data isolation
- 👥 **Role-based Access Control**: Owner, Admin, Manager, Agent, and Viewer roles
- 📞 **Real-time Voice Calls**: Powered by Agora SDK with WebSocket signaling
- 📋 **Contact Management**: Manage people and organizations
- 💼 **Deal Management**: Track deals through customizable stages
- 🎫 **Issue Tracking**: Manage support tickets and issues
- 📊 **Activity Logging**: Track all user actions
- 🔔 **Real-time Notifications**: WebSocket-based updates
- 🤖 **AI Chatbot**: Gemini AI integration (optional)
- 📱 **Mobile Support**: HTTPS-enabled for mobile device access

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)
- **Windows OS** (for using the batch scripts)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tawasol-crm
```

### 2. Database Setup

Create the MySQL database and import the schema:

```bash
mysql -u root -p < Backend/schema.sql
```

Or manually:

```sql
CREATE DATABASE tawasol_crm;
USE tawasol_crm;
SOURCE Backend/schema.sql;
```

### 3. Configure Environment Variables

#### Backend Configuration

Copy `Backend/.env.example` to `Backend/.env` and update the values:

```bash
cd Backend
copy .env.example .env
# Edit .env with your configuration
```

Required variables:
- `DB_HOST` - MySQL host (default: localhost)
- `DB_USER` - MySQL username (default: root)
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name (default: tawasol_crm)
- `DB_PORT` - MySQL port (default: 3306)
- `JWT_SECRET` - Secret key for JWT tokens (change this in production!)
- `AGORA_APP_ID` - Agora application ID (for voice calls)
- `AGORA_APP_CERTIFICATE` - Agora application certificate

Optional variables:
- `JWT_EXPIRATION` - JWT token expiration (default: 7d)
- `GEMINI_API_KEY` - Google Gemini API key (for chatbot)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (for Telegram integration)

#### Frontend Configuration

Copy `Frontend/.env.example` to `Frontend/.env` and update the values:

```bash
cd Frontend
copy .env.example .env
# Edit .env with your configuration
```

Required variables:
- `VITE_API_URL` - Backend API URL (e.g., http://localhost:3000)

Optional variables (for LAN/mobile access):
- `VITE_SOCKET_URL` - WebSocket URL (defaults to VITE_API_URL)
- `VITE_WS_HOST` - WebSocket host (for direct WebSocket connections)
- `VITE_WS_PORT` - WebSocket port

### 4. Install Dependencies

The `start.bat` script will automatically install dependencies, but you can also install them manually:

```bash
# Backend dependencies
cd Backend
npm install

# Frontend dependencies
cd ../Frontend
npm install
```

### 5. Generate SSL Certificates (Optional - for mobile/LAN access)

To enable HTTPS for mobile device access, generate SSL certificates:

```powershell
cd Frontend
.\generate-cert.ps1
```

This will create self-signed certificates in `Frontend/cert/`. Copy them to `Backend/cert/`:

```bash
copy Frontend\cert\localhost.crt Backend\cert\localhost.crt
copy Frontend\cert\localhost.key Backend\cert\localhost.key
```

**Note**: You'll need to accept the security warning in browsers when using self-signed certificates.

### 6. Start the Application

Simply run:

```bash
.\start.bat
```

This script will:
- Check if Node.js and MySQL are installed
- Verify database connection
- Create database if it doesn't exist
- Install dependencies if needed
- Start backend server (port 3000)
- Start frontend server (port 5173)
- Open the application in your browser

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

For HTTPS (if certificates are configured):
- **Frontend**: https://localhost:5173
- **Backend API**: https://localhost:3000

## LAN/Mobile Access Setup

To access the application from other devices on your local network:

1. **Find your local IP address**:
   ```bash
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.0.101)
   ```

2. **Update Frontend/.env**:
   ```
   VITE_API_URL=https://192.168.0.101:3000
   VITE_SOCKET_URL=https://192.168.0.101:3000
   ```

3. **Generate SSL certificates** (required for microphone access on mobile):
   ```powershell
   cd Frontend
   .\generate-cert.ps1
   ```

4. **Configure Windows Firewall** (allow ports 3000 and 5173)

5. **Access from mobile device**:
   - Open `https://192.168.0.101:5173`
   - Accept the security warning (self-signed certificate)

## Project Structure

```
tawasol-crm/
├── Backend/                 # Node.js/Express backend
│   ├── cert/               # SSL certificates (not in git)
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── db/                 # Database connection
│   ├── uploads/            # Uploaded files
│   ├── schema.sql          # Database schema
│   └── index.js            # Server entry point
│
├── Frontend/               # React frontend
│   ├── cert/               # SSL certificates (not in git)
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── router/         # Routing configuration
│   ├── generate-cert.ps1   # SSL certificate generator
│   └── vite.config.js      # Vite configuration
│
├── start.bat               # Start script
├── stop.bat                # Stop script
└── README.md               # This file
```

## Available Scripts

### Backend

```bash
cd Backend

# Start in development mode (with auto-reload)
npm run dev

# Start in production mode
npm start
```

### Frontend

```bash
cd Frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/refresh` - Refresh JWT token

### Organizations
- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Contacts
- `GET /api/contacts/people` - Get all people
- `GET /api/contacts/organizations` - Get all organizations
- `POST /api/contacts/people` - Create person
- `POST /api/contacts/organizations` - Create organization
- `PUT /api/contacts/people/:id` - Update person
- `PUT /api/contacts/organizations/:id` - Update organization
- `DELETE /api/contacts/people/:id` - Delete person
- `DELETE /api/contacts/organizations/:id` - Delete organization

### Calls
- `POST /api/calls/agora/token` - Generate Agora token
- `GET /api/calls/history` - Get call history

## Role Permissions

| Permission | Owner | Admin | Manager | Agent | Viewer |
|------------|-------|-------|---------|-------|--------|
| Create Organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Organization | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Contact | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Contact | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Contact | ✅ | ✅ | ✅ | ❌ | ❌ |
| Make Call | ✅ | ✅ | ✅ | ✅ | ❌ |
| Answer Call | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Call History | ✅ | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### Backend won't start

1. **Port already in use**: Stop any existing Node.js processes
   ```bash
   .\stop.bat
   ```

2. **Database connection error**: Verify MySQL is running and credentials are correct in `Backend/.env`

3. **Missing dependencies**: Run `npm install` in the Backend directory

### Frontend won't start

1. **Port already in use**: Change the port in `Frontend/vite.config.js`

2. **Missing dependencies**: Run `npm install` in the Frontend directory

3. **API connection error**: Verify `VITE_API_URL` in `Frontend/.env` points to the correct backend URL

### Mobile device can't access

1. **HTTPS not configured**: Generate SSL certificates using `generate-cert.ps1`

2. **Firewall blocking**: Allow ports 3000 and 5173 in Windows Firewall

3. **Wrong IP address**: Verify your local IP address using `ipconfig` and update `.env` files

### Calls not working

1. **Agora credentials missing**: Add `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` to `Backend/.env`

2. **Microphone permission**: Ensure browser has microphone permissions (HTTPS required for remote devices)

3. **WebSocket connection**: Check that WebSocket is connecting (check browser console)

## Development

### Code Style

- **Backend**: Standard JavaScript/Node.js conventions
- **Frontend**: React with functional components and hooks
- **Styling**: Tailwind CSS

### Database Migrations

Run migration files manually:
```bash
mysql -u root -p tawasol_crm < Backend/migrations/add_call_logs_table.sql
```

## Production Deployment

1. **Update environment variables** with production values
2. **Change JWT_SECRET** to a strong random string
3. **Use proper SSL certificates** (not self-signed)
4. **Build frontend**: `cd Frontend && npm run build`
5. **Use a process manager** (PM2, systemd, etc.)
6. **Configure reverse proxy** (Nginx, Apache) if needed

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

