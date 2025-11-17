// JWT Configuration
require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d'
};
