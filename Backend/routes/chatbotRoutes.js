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
 * Mode is determined by isClientMode flag from request body:
 * - isClientMode: true → Client Mode (only user's own data)
 * - isClientMode: false/undefined → Organization Mode (org data)
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, isClientMode } = req.body;
    const userId = req.user.userId;
    const email = req.user.email;
    
    // Use client mode if explicitly requested, otherwise use org mode if user has an org
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.'
      });
    }

    const response = await chat(userId, effectiveOrgId, message, { email });

    res.status(200).json({
      success: true,
      response,
      mode: effectiveOrgId ? 'organization' : 'client'
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
    const { isClientMode } = req.body || {};
    const userId = req.user.userId;
    
    // Use client mode if explicitly requested
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    resetSession(userId, effectiveOrgId);

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
 * Pass ?clientMode=true for client mode session info
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isClientMode = req.query.clientMode === 'true';
    
    // Use client mode if explicitly requested
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    const sessionInfo = getSessionInfo(userId, effectiveOrgId);

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
