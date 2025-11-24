const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Check if SSL certificates exist
const certPath = path.join(__dirname, 'cert');
const certFile = path.join(certPath, 'localhost.crt');
const keyFile = path.join(certPath, 'localhost.key');
const hasSSL = fs.existsSync(certFile) && fs.existsSync(keyFile);

// Import routes
const rpcRoutes = require('./routes/rpcRoutes');
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const clientRoutes = require('./routes/clientRoutes');
const dealRoutes = require('./routes/dealRoutes');
const contactRoutes = require('./routes/contactRoutes');
const issueRoutes = require('./routes/issueRoutes');
const activityRoutes = require('./routes/activityRoutes');
const fileRoutes = require('./routes/fileRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const callRoutes = require('./routes/callRoutes');
const userRoutes = require('./routes/userRoutes');
const jiraRoutes = require('./routes/jiraRoutes');
const { initializeBot } = require('./services/telegramBotService');
const { initializeWebSocket } = require('./utils/callSignaling');

// Port configuration
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 3001;

// Create HTTP or HTTPS server
let server;
if (hasSSL) {
  const options = {
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  };
  server = https.createServer(options, app);
  console.log('✅ HTTPS enabled on backend - SSL certificate loaded');
} else {
  server = http.createServer(app);
  console.log('⚠️  HTTPS disabled - Using HTTP (mixed content warnings will appear)');
}

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Support both transports
  allowEIO3: true // Allow Engine.IO v3 clients
});

// Socket.io connection handling
const socketService = require('./services/socketService')(io);

// Make io available to routes
app.set('io', io);

// Pass socket service to contact controller for online status checking
const contactController = require('./controllers/contactController');
if (contactController.setSocketService) {
  contactController.setSocketService(socketService);
}

// Initialize WebSocket for call signaling
initializeWebSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tawasol CRM Backend is running',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tawasol CRM API - Multi-tenant CRM System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      organizations: '/api/organizations/*',
      rpc: '/rpc/*',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/jira', jiraRoutes);

// Legacy RPC-style routes (for backward compatibility)
app.use('/rpc', rpcRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Initialize Telegram bot (gracefully handle missing token)
try {
  initializeBot();
} catch (error) {
  console.warn('⚠️  Telegram bot initialization failed:', error.message);
  console.log('💡 Telegram bot requires TELEGRAM_BOT_TOKEN in .env');
}

// Get local network IP for LAN access
const getLocalIP = () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Start server with error handling
server.listen(port, '0.0.0.0', () => {
  const localIP = getLocalIP();
  const protocol = hasSSL ? 'https' : 'http';
  console.log('========================================');
  console.log(`🚀 Tawasol CRM Server is running`);
  console.log(`📡 ${protocol.toUpperCase()} Port: ${port}`);
  console.log('');
  console.log('🌐 Access URLs:');
  console.log(`   Local:    ${protocol}://localhost:${port}`);
  console.log(`   Network:  ${protocol}://${localIP}:${port}`);
  console.log(`🔌 WebSocket Port: ${wsPort}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('========================================');
  console.log('');
  console.log('💡 Optional Features:');
  if (!process.env.GEMINI_API_KEY) {
    console.log('   ⚠️  GEMINI_API_KEY not set - Chatbot disabled');
  } else {
    console.log('   ✅ Gemini API configured - Chatbot enabled');
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('   ⚠️  TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
  } else {
    console.log('   ✅ Telegram bot configured');
  }
  if (!process.env.AGORA_APP_ID) {
    console.log('   ⚠️  AGORA_APP_ID not set - Voice calls disabled');
  } else {
    console.log('   ✅ Agora configured - Voice calls enabled');
  }
  console.log('');
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('========================================');
    console.error('❌ ERROR: Port ' + port + ' is already in use!');
    console.error('========================================');
    console.error('');
    console.error('🔧 Solutions:');
    console.error('   1. Stop the process using port ' + port + ':');
    console.error('      netstat -ano | findstr :' + port);
    console.error('      taskkill /PID <PID> /F');
    console.error('');
    console.error('   2. Or change the port in Backend/.env:');
    console.error('      PORT=3001');
    console.error('');
    console.error('   3. Or use stop.bat to stop all servers');
    console.error('');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});
