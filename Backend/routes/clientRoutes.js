// Client Portal Routes
const express = require('express');
const router = express.Router();
const {
  getClientDeals,
  getClientIssues,
  getClientOverview,
  createClientIssue
} = require('../controllers/clientController');
const { verifyToken, isClient } = require('../middleware/auth');

// All client routes require client user type
router.get('/overview', verifyToken, isClient, getClientOverview);
router.get('/deals', verifyToken, isClient, getClientDeals);
router.get('/issues', verifyToken, isClient, getClientIssues);
router.post('/issues', verifyToken, isClient, createClientIssue);

module.exports = router;

