// Agora Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { generateToken } = require('../services/agoraService');

// Generate Agora token for voice call
router.post('/token', authenticate, (req, res) => {
  try {
    const { channelName, userId } = req.body;

    if (!channelName || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Channel name and user ID are required.'
      });
    }

    const token = generateToken(channelName, userId);

    res.status(200).json({
      success: true,
      token,
      appId: process.env.AGORA_APP_ID,
      channelName,
      userId
    });

  } catch (error) {
    console.error('Generate Agora token error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error generating token.',
      error: error.message
    });
  }
});

module.exports = router;

