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
const { initializeBot } = require('./services/telegramBotService');
const { initializeWebSocket } = require('./utils/callSignaling');

// Port configuration
const port = process.env.PORT || 3000;
const httpPort = process.env.HTTP_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;
const wsPort = process.env.WS_PORT || 3001;

// Create HTTP server (always available)
const httpServer = http.createServer(app);

// Create HTTPS server (if certificates are available)
let httpsServer = null;
if (hasSSL) {
  const options = {
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  };
  httpsServer = https.createServer(options, app);
  console.log('✅ HTTPS enabled on backend - SSL certificate loaded');
} else {
  console.log('⚠️  HTTPS disabled - SSL certificates not found');
}

// Use HTTPS server for Socket.io if available, otherwise use HTTP
const server = httpsServer || httpServer;

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
app.use('/api/deals', dealRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/calls', callRoutes);

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

// Start HTTP server
httpServer.listen(httpPort, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('========================================');
  console.log(`🚀 Tawasol CRM Server is running`);
  console.log(`📡 HTTP Port: ${httpPort}`);
  if (hasSSL) {
    console.log(`🔒 HTTPS Port: ${httpsPort}`);
  }
  console.log('');
  console.log('🌐 Access URLs:');
  console.log(`   HTTP Local:    http://localhost:${httpPort}`);
  console.log(`   HTTP Network:  http://${localIP}:${httpPort}`);
  if (hasSSL) {
    console.log(`   HTTPS Local:   https://localhost:${httpsPort}`);
    console.log(`   HTTPS Network: https://${localIP}:${httpsPort}`);
  }
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

// Handle HTTP port already in use errors
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('========================================');
    console.error('❌ ERROR: HTTP Port ' + httpPort + ' is already in use!');
    console.error('========================================');
    console.error('');
    console.error('🔧 Solutions:');
    console.error('   1. Stop the process using port ' + httpPort + ':');
    console.error('      netstat -ano | findstr :' + httpPort);
    console.error('      taskkill /PID <PID> /F');
    console.error('');
    console.error('   2. Or change the port in Backend/.env:');
    console.error('      HTTP_PORT=3001');
    console.error('');
    console.error('   3. Or use stop.bat to stop all servers');
    console.error('');
    process.exit(1);
  } else {
    console.error('❌ HTTP Server error:', err);
    process.exit(1);
  }
});

// Start HTTPS server if certificates are available
if (hasSSL && httpsServer) {
  httpsServer.listen(httpsPort, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`✅ HTTPS server started on port ${httpsPort}`);
  });

  // Handle HTTPS port errors
  httpsServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('========================================');
      console.error('❌ ERROR: HTTPS Port ' + httpsPort + ' is already in use!');
      console.error('========================================');
      console.error('');
      console.error('🔧 Solutions:');
      console.error('   1. Stop the process using port ' + httpsPort + ':');
      console.error('      netstat -ano | findstr :' + httpsPort);
      console.error('      taskkill /PID <PID> /F');
      console.error('');
      console.error('   2. Or change the port in Backend/.env:');
      console.error('      HTTPS_PORT=3444');
      console.error('');
      process.exit(1);
    } else {
      console.error('❌ HTTPS Server error:', err);
      process.exit(1);
    }
  });
}
