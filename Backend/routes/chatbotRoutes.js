/**
 * HudHud Chatbot Routes
 * API endpoints for the web chatbot interface
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { chat, resetSession, getSessionInfo } = require('../services/chatbotService');

/**
 * POST /api/chatbot/message
 * Send a message to HudHud
 * Mode is auto-detected from JWT:
 * - If organizationId present → Organization Mode
 * - If no organizationId → Client Mode
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;
    const organizationId = req.user.organizationId || null;
    const email = req.user.email;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.'
      });
    }

    const response = await chat(userId, organizationId, message, { email });

    res.status(200).json({
      success: true,
      response,
      mode: organizationId ? 'organization' : 'client'
    });

  } catch (error) {
    console.error('Chatbot route error:', error);
    
    // Return user-friendly error messages
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing chat message.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/chatbot/reset
 * Reset the chat session (clear history)
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId || null;

    resetSession(userId, organizationId);

    res.status(200).json({
      success: true,
      message: 'Chat session has been reset.'
    });

  } catch (error) {
    console.error('Chatbot reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset chat session.'
    });
  }
});

/**
 * GET /api/chatbot/status
 * Get current session info
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId || null;

    const sessionInfo = getSessionInfo(userId, organizationId);

    res.status(200).json({
      success: true,
      ...sessionInfo
    });

  } catch (error) {
    console.error('Chatbot status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session info.'
    });
  }
});

module.exports = router;
