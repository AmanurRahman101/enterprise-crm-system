// Authentication Middleware
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.headers['x-access-token'];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'No token provided. Authentication required.'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message
    });
  }
};

// Verify if user is a company
const isCompany = (req, res, next) => {
  if (req.user && req.user.type === 'company') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Company role required.'
    });
  }
};

// Verify if user is a customer
const isCustomer = (req, res, next) => {
  if (req.user && req.user.type === 'customer') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.'
    });
  }
};

module.exports = {
  verifyToken,
  isCompany,
  isCustomer
};
