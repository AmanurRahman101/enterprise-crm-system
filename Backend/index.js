const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Import routes
const rpcRoutes = require('./routes/rpcRoutes');

// Port configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tawasol CRM API - Multi-tenant CRM System',
    version: '1.0.0',
    endpoints: {
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

// RPC-style routes
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

// Start server
app.listen(port, () => {
  console.log('========================================');
  console.log(`🚀 Tawasol CRM Server is running`);
  console.log(`📡 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('========================================');
});
