# 📋 Tawasol CRM - TODO List

**Status:** Comparing implementation vs. project_plan.md

---

## ✅ **COMPLETED FEATURES**

### ✓ Core Infrastructure
- [x] Database schema with multi-tenant isolation
- [x] JWT authentication with organization-aware tokens
- [x] Unified user model (removed internal/client classification)
- [x] Organization management (create, join, switch)
- [x] Role-based access control (owner/admin/manager/agent/viewer)

### ✓ Frontend Pages
- [x] Unified signup/signin pages
- [x] Organization dashboard (Overview, Deals, Contacts, Issues, Activities)
- [x] Client portal (Overview, My Deals, My Issues)
- [x] Organization switcher component
- [x] Dashboard layout with navigation

### ✓ Backend API
- [x] Auth routes (signup, signin, switch organization)
- [x] Organization routes (CRUD, members)
- [x] Deal routes with Kanban support
- [x] Contact routes (people and organizations)
- [x] Issue routes with Jira-ready fields
- [x] Activity routes with filtering
- [x] File upload routes

### ✓ Real-time & Integration
- [x] Socket.io WebSocket infrastructure
- [x] Room-based isolation per user:organization
- [x] Agora voice call integration (backend + frontend)
- [x] Gemini AI chatbot (basic)
- [x] Telegram bot integration (basic)
- [x] Activity logging middleware

---

## 🔨 **PENDING TASKS**

---

## **PHASE 1: Missing Critical Features**

### 1.1 MCP Server Setup
**Current:** Chatbot runs in main server process  
**Required:** Separate MCP server on different port with Gemini CLI integration

- [ ] **Task 1.1.1:** Create `Backend/mcp-server.js` file
- [ ] **Task 1.1.2:** Set up MCP server on separate port (e.g., 3002)
- [ ] **Task 1.1.3:** Integrate Gemini CLI for conversational context
- [ ] **Task 1.1.4:** Implement session management keyed by userId:organizationId
- [ ] **Task 1.1.5:** Add explicit organization validation on every MCP action
- [ ] **Task 1.1.6:** Update chatbot routes to connect to MCP server
- [ ] **Task 1.1.7:** Add MCP server start command to start.bat
- [ ] **Task 1.1.8:** Add process management (PM2 or Docker Compose)

---

### 1.2 Notification Service (FCM)
**Current:** Table exists but no service implementation  
**Required:** Push notifications to Android app when app is closed

- [ ] **Task 1.2.1:** Create `Backend/services/notificationService.js`
- [ ] **Task 1.2.2:** Install Firebase Admin SDK (`npm install firebase-admin`)
- [ ] **Task 1.2.3:** Add Firebase service account JSON to .env
- [ ] **Task 1.2.4:** Implement `sendPushNotification(userId, title, body, data)`
- [ ] **Task 1.2.5:** Implement `saveUserFCMToken(userId, token)` function
- [ ] **Task 1.2.6:** Implement `removeUserFCMToken(userId, token)` function
- [ ] **Task 1.2.7:** Create API endpoint to register FCM tokens (`POST /api/fcm/register`)
- [ ] **Task 1.2.8:** Integrate notifications on deal updates
- [ ] **Task 1.2.9:** Integrate notifications on new issues assigned
- [ ] **Task 1.2.10:** Integrate notifications on new activities
- [ ] **Task 1.2.11:** Store last 100 notifications per user in database

---

### 1.3 WebSocket Reconnection Strategy
**Current:** Basic Socket.io setup  
**Required:** Queue missed events and sync on reconnect

- [ ] **Task 1.3.1:** Update notifications table with `delivered_at` timestamp
- [ ] **Task 1.3.2:** Create API endpoint to fetch missed notifications (`GET /api/notifications/missed?since=timestamp`)
- [ ] **Task 1.3.3:** Update `socketService.js` to track connection status
- [ ] **Task 1.3.4:** Implement reconnection handler in frontend `socketService.js`
- [ ] **Task 1.3.5:** Fetch missed events on reconnect by last sync timestamp
- [ ] **Task 1.3.6:** Display reconnection status in UI
- [ ] **Task 1.3.7:** Add notification badge for missed notifications

---

### 1.4 File Upload Security & Limits
**Current:** Basic file uploads  
**Required:** Size limits, MIME validation, extension whitelist

- [ ] **Task 1.4.1:** Install `file-type` package for MIME validation (`npm install file-type`)
- [ ] **Task 1.4.2:** Add file size limit to 10MB in multer config
- [ ] **Task 1.4.3:** Whitelist extensions (.pdf, .docx, .xlsx, .jpg, .png, .gif)
- [ ] **Task 1.4.4:** Validate MIME types match extensions
- [ ] **Task 1.4.5:** Add file type validation error messages
- [ ] **Task 1.4.6:** Add file size error messages
- [ ] **Task 1.4.7:** Test with various file types
- [ ] **Task 1.4.8:** Update frontend to show file type/size errors

---

## **PHASE 2: Android App Development**

### 2.1 Android Project Setup
**Current:** Empty AndroidApp directory  
**Required:** Complete native Android app with Kotlin

- [ ] **Task 2.1.1:** Initialize Android Studio project in `AndroidApp/`
- [ ] **Task 2.1.2:** Set up Gradle dependencies (Retrofit, Room, Kotlin coroutines)
- [ ] **Task 2.1.3:** Add Firebase Cloud Messaging SDK
- [ ] **Task 2.1.4:** Add Agora Android SDK for voice calls
- [ ] **Task 2.1.5:** Configure build.gradle with required permissions
- [ ] **Task 2.1.6:** Set up project structure (data, domain, presentation layers)
- [ ] **Task 2.1.7:** Create application class for initialization

---

### 2.2 Android Authentication
**Current:** None  
**Required:** JWT auth shared with web app

- [ ] **Task 2.2.1:** Create `AuthService` with Retrofit for API calls
- [ ] **Task 2.2.2:** Implement login screen (LoginActivity)
- [ ] **Task 2.2.3:** Implement signup screen (SignupActivity)
- [ ] **Task 2.2.4:** Store JWT token in SharedPreferences
- [ ] **Task 2.2.5:** Add token interceptor for Retrofit
- [ ] **Task 2.2.6:** Handle token expiration and refresh
- [ ] **Task 2.2.7:** Add biometric authentication (optional)

---

### 2.3 Android Organization Management
**Current:** None  
**Required:** Organization switcher in drawer navigation

- [ ] **Task 2.3.1:** Create `OrganizationRepository` for API calls
- [ ] **Task 2.3.2:** Implement organization list screen
- [ ] **Task 2.3.3:** Add organization switcher in navigation drawer
- [ ] **Task 2.3.4:** Update JWT token when switching organizations
- [ ] **Task 2.3.5:** Reload app context after organization switch
- [ ] **Task 2.3.6:** Cache current organization in SharedPreferences

---

### 2.4 Android Core Features
**Current:** None  
**Required:** Deals, Contacts, Issues, Activities screens

- [ ] **Task 2.4.1:** Create Deals Kanban screen with drag-and-drop
- [ ] **Task 2.4.2:** Create Contacts list screen (people + organizations)
- [ ] **Task 2.4.3:** Create Issues list screen with filters
- [ ] **Task 2.4.4:** Create Activities timeline screen
- [ ] **Task 2.4.5:** Implement deal creation/edit forms
- [ ] **Task 2.4.6:** Implement contact creation/edit forms
- [ ] **Task 2.4.7:** Implement issue creation/edit forms
- [ ] **Task 2.4.8:** Add search functionality for all screens

---

### 2.5 Android Voice Calls (Agora)
**Current:** None  
**Required:** Integrate Agora Android SDK

- [ ] **Task 2.5.1:** Set up Agora SDK initialization
- [ ] **Task 2.5.2:** Create call screen UI
- [ ] **Task 2.5.3:** Implement join channel functionality
- [ ] **Task 2.5.4:** Add mute/unmute controls
- [ ] **Task 2.5.5:** Add speaker/earpiece toggle
- [ ] **Task 2.5.6:** Handle call end and cleanup
- [ ] **Task 2.5.7:** Request microphone permissions
- [ ] **Task 2.5.8:** Log call activities to backend

---

### 2.6 Android Real-time (WebSocket)
**Current:** None  
**Required:** Socket.io client for real-time updates

- [ ] **Task 2.6.1:** Add Socket.io client library
- [ ] **Task 2.6.2:** Create WebSocket service
- [ ] **Task 2.6.3:** Connect with JWT token authentication
- [ ] **Task 2.6.4:** Handle incoming notifications
- [ ] **Task 2.6.5:** Update UI on real-time events
- [ ] **Task 2.6.6:** Handle reconnection strategy
- [ ] **Task 2.6.7:** Show connection status indicator

---

### 2.7 Android Chatbot
**Current:** None  
**Required:** Chat interface with WebSocket

- [ ] **Task 2.7.1:** Create chat screen UI
- [ ] **Task 2.7.2:** Implement message list with RecyclerView
- [ ] **Task 2.7.3:** Connect to chatbot WebSocket
- [ ] **Task 2.7.4:** Send user messages
- [ ] **Task 2.7.5:** Receive and display bot responses
- [ ] **Task 2.7.6:** Add typing indicator
- [ ] **Task 2.7.7:** Store chat history locally (Room database)

---

### 2.8 Android Offline-First & Caching
**Current:** None  
**Required:** Room database for local caching

- [ ] **Task 2.8.1:** Set up Room database schema
- [ ] **Task 2.8.2:** Create DAOs for all entities
- [ ] **Task 2.8.3:** Implement caching strategy for deals
- [ ] **Task 2.8.4:** Implement caching strategy for contacts
- [ ] **Task 2.8.5:** Implement caching strategy for issues
- [ ] **Task 2.8.6:** Sync local data with backend on reconnect
- [ ] **Task 2.8.7:** Handle conflict resolution
- [ ] **Task 2.8.8:** Show offline mode indicator

---

### 2.9 Android Push Notifications (FCM)
**Current:** FCM tokens table exists  
**Required:** Receive and display push notifications

- [ ] **Task 2.9.1:** Set up FCM in Android project
- [ ] **Task 2.9.2:** Request notification permissions
- [ ] **Task 2.9.3:** Get FCM token and send to backend
- [ ] **Task 2.9.4:** Handle incoming notifications (foreground)
- [ ] **Task 2.9.5:** Handle incoming notifications (background)
- [ ] **Task 2.9.6:** Create notification channels
- [ ] **Task 2.9.7:** Handle notification click actions
- [ ] **Task 2.9.8:** Update badge count for notifications

---

## **PHASE 3: Enhanced Features**

### 3.1 Telegram Bot Enhancements
**Current:** Basic bot setup  
**Required:** One-time code linking system

- [ ] **Task 3.1.1:** Create settings page in web app for Telegram linking
- [ ] **Task 3.1.2:** Generate 6-digit verification code
- [ ] **Task 3.1.3:** Store code in database with expiration (5 minutes)
- [ ] **Task 3.1.4:** Update bot to accept `/link <code>` command
- [ ] **Task 3.1.5:** Verify code and link telegram chat_id to user
- [ ] **Task 3.1.6:** Show linked status in settings page
- [ ] **Task 3.1.7:** Add unlink functionality
- [ ] **Task 3.1.8:** Test bot commands with linked account
- [ ] **Task 3.1.9:** Configure ngrok webhook URL in .env
- [ ] **Task 3.1.10:** Set up webhook instead of polling

---

### 3.2 Client Invitation System
**Current:** Users can self-register  
**Required:** Invitation-only registration for clients

- [ ] **Task 3.2.1:** Create invitations table in schema.sql
- [ ] **Task 3.2.2:** Create `Backend/controllers/invitationController.js`
- [ ] **Task 3.2.3:** Add API to send invitation email (`POST /api/invitations/send`)
- [ ] **Task 3.2.4:** Generate unique invitation token with expiration
- [ ] **Task 3.2.5:** Create email template for invitation
- [ ] **Task 3.2.6:** Add signup page for invited users (`/auth/signup/:token`)
- [ ] **Task 3.2.7:** Validate invitation token on signup
- [ ] **Task 3.2.8:** Mark invitation as used after signup
- [ ] **Task 3.2.9:** Add invitation management UI in organization settings
- [ ] **Task 3.2.10:** List pending/accepted invitations

---

### 3.3 Organization Ownership Transfer
**Current:** Basic roles system  
**Required:** Transfer ownership and prevent orphaned orgs

- [ ] **Task 3.3.1:** Create ownership transfer API (`POST /api/organizations/:id/transfer-ownership`)
- [ ] **Task 3.3.2:** Validate only owner can transfer ownership
- [ ] **Task 3.3.3:** Require target user to be admin
- [ ] **Task 3.3.4:** Update roles: old owner becomes admin, new admin becomes owner
- [ ] **Task 3.3.5:** Log ownership transfer activity
- [ ] **Task 3.3.6:** Send notification to new owner
- [ ] **Task 3.3.7:** Add ownership transfer UI in organization settings
- [ ] **Task 3.3.8:** Add confirmation dialog with warning
- [ ] **Task 3.3.9:** Prevent leaving organization if last owner
- [ ] **Task 3.3.10:** Show "designate successor" warning before leaving

---

### 3.4 Deal Pipeline Customization
**Current:** Global deal stages for all organizations  
**Required:** Per-organization custom stages (Phase 2)

- [ ] **Task 3.4.1:** Create `organization_deal_stages` table
- [ ] **Task 3.4.2:** Migrate existing deals to use organization-specific stages
- [ ] **Task 3.4.3:** Create API to manage custom stages (`/api/organizations/:id/deal-stages`)
- [ ] **Task 3.4.4:** Add UI to customize deal pipeline in settings
- [ ] **Task 3.4.5:** Support drag-and-drop stage reordering
- [ ] **Task 3.4.6:** Allow adding custom stages
- [ ] **Task 3.4.7:** Allow editing stage names and colors
- [ ] **Task 3.4.8:** Prevent deleting stages with existing deals
- [ ] **Task 3.4.9:** Update Deals Kanban to use custom stages
- [ ] **Task 3.4.10:** Add default stages on organization creation

---

### 3.5 Environment Configuration
**Current:** Basic .env setup  
**Required:** Google OAuth placeholders and complete configuration

- [ ] **Task 3.5.1:** Add `GOOGLE_CLIENT_ID` to .env (commented out)
- [ ] **Task 3.5.2:** Add `GOOGLE_CLIENT_SECRET` to .env (commented out)
- [ ] **Task 3.5.3:** Add `GOOGLE_CALLBACK_URL` to .env (commented out)
- [ ] **Task 3.5.4:** Add `NGROK_DOMAIN` to .env for Telegram webhook
- [ ] **Task 3.5.5:** Add `MCP_PORT` to .env (default 3002)
- [ ] **Task 3.5.6:** Add `FCM_SERVICE_ACCOUNT_PATH` to .env
- [ ] **Task 3.5.7:** Add `FILE_UPLOAD_MAX_SIZE` to .env (default 10MB)
- [ ] **Task 3.5.8:** Add `FILE_UPLOAD_ALLOWED_TYPES` to .env
- [ ] **Task 3.5.9:** Create .env.example file with all variables
- [ ] **Task 3.5.10:** Document all environment variables

---

## **PHASE 4: Testing & Polish**

### 4.1 Testing
- [ ] **Task 4.1.1:** Test signup/signin flow
- [ ] **Task 4.1.2:** Test organization creation and switching
- [ ] **Task 4.1.3:** Test all CRUD operations (deals, contacts, issues)
- [ ] **Task 4.1.4:** Test WebSocket real-time updates
- [ ] **Task 4.1.5:** Test file uploads with various types/sizes
- [ ] **Task 4.1.6:** Test Agora voice calls
- [ ] **Task 4.1.7:** Test chatbot responses
- [ ] **Task 4.1.8:** Test role-based access control
- [ ] **Task 4.1.9:** Test multi-tenant isolation
- [ ] **Task 4.1.10:** Test Android app end-to-end

---

### 4.2 Documentation
- [ ] **Task 4.2.1:** Create API documentation (Postman/Swagger)
- [ ] **Task 4.2.2:** Create user guide for web app
- [ ] **Task 4.2.3:** Create admin guide for organization management
- [ ] **Task 4.2.4:** Create developer setup guide
- [ ] **Task 4.2.5:** Document database schema
- [ ] **Task 4.2.6:** Create deployment guide
- [ ] **Task 4.2.7:** Document Android app setup
- [ ] **Task 4.2.8:** Create troubleshooting guide
- [ ] **Task 4.2.9:** Document environment variables
- [ ] **Task 4.2.10:** Create README.md with project overview

---

### 4.3 Deployment Preparation
- [ ] **Task 4.3.1:** Set up Docker Compose for backend services
- [ ] **Task 4.3.2:** Create Dockerfile for main server
- [ ] **Task 4.3.3:** Create Dockerfile for MCP server
- [ ] **Task 4.3.4:** Configure nginx for frontend
- [ ] **Task 4.3.5:** Set up SSL certificates
- [ ] **Task 4.3.6:** Configure production database
- [ ] **Task 4.3.7:** Set up PM2 for process management
- [ ] **Task 4.3.8:** Create backup strategy for database
- [ ] **Task 4.3.9:** Set up logging and monitoring
- [ ] **Task 4.3.10:** Test production deployment

---

## 📊 **SUMMARY**

**Total Tasks:** 175  
**Completed:** ~60% (core features)  
**Pending:** ~40%

**Priority:**
1. **HIGH:** MCP Server, Notification Service, Android App Core
2. **MEDIUM:** Telegram Enhancements, Client Invitations, Ownership Transfer
3. **LOW:** Deal Customization, Testing, Documentation

---

**Next Steps:**
1. Review this TODO list
2. Choose which task to complete first
3. I will complete each task when you request it

