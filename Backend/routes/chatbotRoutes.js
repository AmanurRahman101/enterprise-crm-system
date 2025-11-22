// Chatbot Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { chat } = require('../services/chatbotService');

router.post('/message', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.'
      });
    }

    const response = await chat(userId, organizationId, message);

    res.status(200).json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Chatbot route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing chat message.',
      error: error.message
    });
  }
});

module.exports = router;

