# Tawasol CRM - Intelligent System of Action

## 🎯 Project Overview
Tawasol CRM is an AI-powered customer relationship management platform designed as an "Intelligent System of Action" - actively working for users rather than being a passive data repository.

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache/Real-time**: Redis
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **API Client**: Axios
- **Real-time**: Socket.io-client

### Mobile
- **Platform**: Android Native
- **Language**: Kotlin
- **Architecture**: MVVM
- **Networking**: Retrofit
- **DI**: Hilt

## 📁 Project Structure

```
Tawasol/
├── backend/                 # Node.js + Express API
├── frontend/                # React web application
├── mobile/                  # Android applications
│   ├── employee-app/       # Internal CRM app
│   └── customer-app/       # Customer support app
├── docs/                    # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- Redis 7+
- Android Studio (for mobile development)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Tawasol
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
# Configure your .env file
npm start
```

4. **Mobile Setup**
- Open `mobile/employee-app` in Android Studio
- Sync Gradle
- Run on emulator or device

## 📋 Development Phases

### Phase 1: Core Platform (In Progress)
- ✅ Project structure setup
- ⏳ Contact Management
- ⏳ Sales Pipeline
- ⏳ Task Management
- ⏳ Helpdesk System
- ⏳ Analytics Dashboard

### Phase 2: Intelligence & Automation
- AI Chatbot Assistant
- AI Auto-Updating Records
- VoIP Integration
- Telegram Bot
- Advanced Analytics

## 🔒 Environment Variables

See `.env.example` files in backend and frontend directories.

## 📝 License
Proprietary - All rights reserved

## 👥 Team
Development started: November 2025
