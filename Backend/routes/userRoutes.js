// User Routes
const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Get all users (requires authentication)
router.get('/', authenticate, getAllUsers);

module.exports = router;
