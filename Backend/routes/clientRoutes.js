// Client Portal Routes
const express = require('express');
const router = express.Router();
const {
  getClientDeals,
  getClientIssues,
  getClientOverview
} = require('../controllers/clientController');
const { verifyToken, isClient } = require('../middleware/auth');

// All client routes require client user type
router.get('/overview', verifyToken, isClient, getClientOverview);
router.get('/deals', verifyToken, isClient, getClientDeals);
router.get('/issues', verifyToken, isClient, getClientIssues);

module.exports = router;

