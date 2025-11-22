// Authentication Routes
const express = require('express');
const router = express.Router();
const { signup, signin, switchOrganization } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.user.userId,
      email: req.user.email
    }
  });
});

router.post('/switch-organization', verifyToken, switchOrganization);

module.exports = router;

