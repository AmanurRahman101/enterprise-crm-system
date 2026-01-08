/**
 * HudHud Chatbot Routes
 * API endpoints for the web chatbot interface
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  chat, 
  resetSession, 
  getSessionInfo,
  createThread,
  getThreads,
  getThreadMessages,
  deleteThread,
  sendThreadMessage
} = require('../services/chatbotService');

/**
 * POST /api/chatbot/message
 * Send a message to HudHud (legacy endpoint with thread support)
 * Mode is determined by isClientMode flag from request body:
 * - isClientMode: true → Client Mode (only user's own data)
 * - isClientMode: false/undefined → Organization Mode (org data)
 * 
 * If threadId is provided, uses that thread.
 * If no threadId, auto-selects or creates the most recent thread for the mode.
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, isClientMode, threadId } = req.body;
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

    // If threadId provided, use thread-based messaging
    if (threadId) {
      const response = await sendThreadMessage(
        userId,
        effectiveOrgId,
        threadId,
        message.trim(),
        { email }
      );

      return res.status(200).json({
        success: true,
        response,
        threadId,
        mode: effectiveOrgId ? 'organization' : 'client'
      });
    }

    // Legacy behavior: use most recent thread or create new one
    const threads = await getThreads(userId, effectiveOrgId);
    let activeThreadId;

    if (threads.length > 0) {
      // Use most recent thread
      activeThreadId = threads[0].id;
    } else {
      // Create new thread
      activeThreadId = await createThread(userId, effectiveOrgId);
    }

    const response = await sendThreadMessage(
      userId,
      effectiveOrgId,
      activeThreadId,
      message.trim(),
      { email }
    );

    res.status(200).json({
      success: true,
      response,
      threadId: activeThreadId,
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
 * Reset the chat session by creating a new thread
 * Returns the new thread ID
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    const { isClientMode } = req.body || {};
    const userId = req.user.userId;
    
    // Use client mode if explicitly requested
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    // Clear in-memory session (for backward compatibility)
    resetSession(userId, effectiveOrgId);

    // Create a new thread
    const newThreadId = await createThread(userId, effectiveOrgId);

    res.status(200).json({
      success: true,
      message: 'New chat created.',
      threadId: newThreadId,
      mode: effectiveOrgId ? 'organization' : 'client'
    });

  } catch (error) {
    console.error('Chatbot reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create new chat.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// ============================================================
// THREAD MANAGEMENT ENDPOINTS
// ============================================================

/**
 * GET /api/chatbot/threads
 * Get user's chat threads for current mode
 * Query params: ?clientMode=true|false
 */
router.get('/threads', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isClientMode = req.query.clientMode === 'true';
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    const threads = await getThreads(userId, effectiveOrgId);

    res.status(200).json({
      success: true,
      threads
    });

  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat threads.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/chatbot/threads
 * Create a new chat thread
 * Body: { isClientMode: boolean }
 */
router.post('/threads', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isClientMode } = req.body || {};
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    const threadId = await createThread(userId, effectiveOrgId);

    res.status(201).json({
      success: true,
      threadId,
      mode: effectiveOrgId ? 'organization' : 'client'
    });

  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat thread.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chatbot/threads/:threadId/messages
 * Get messages for a specific thread
 */
router.get('/threads/:threadId/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { threadId } = req.params;

    const messages = await getThreadMessages(userId, threadId);

    res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get thread messages error:', error);
    
    if (error.message === 'THREAD_NOT_FOUND' || error.message === 'THREAD_ACCESS_DENIED') {
      return res.status(404).json({
        success: false,
        message: error.message === 'THREAD_NOT_FOUND' 
          ? 'Chat thread not found.' 
          : 'Access denied to this chat thread.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve thread messages.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/chatbot/threads/:threadId
 * Soft-delete a chat thread
 */
router.delete('/threads/:threadId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { threadId } = req.params;

    await deleteThread(userId, threadId);

    res.status(200).json({
      success: true,
      message: 'Chat thread deleted successfully.'
    });

  } catch (error) {
    console.error('Delete thread error:', error);
    
    if (error.message === 'THREAD_NOT_FOUND' || error.message === 'THREAD_ACCESS_DENIED') {
      return res.status(404).json({
        success: false,
        message: error.message === 'THREAD_NOT_FOUND' 
          ? 'Chat thread not found.' 
          : 'Access denied to this chat thread.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete chat thread.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/chatbot/threads/:threadId/message
 * Send a message to a specific thread
 * Body: { message: string, isClientMode: boolean }
 */
router.post('/threads/:threadId/message', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;
    const { threadId } = req.params;
    const { message, isClientMode } = req.body;
    
    const effectiveOrgId = isClientMode ? null : (req.user.organizationId || null);

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.'
      });
    }

    const response = await sendThreadMessage(
      userId, 
      effectiveOrgId, 
      threadId, 
      message.trim(), 
      { email }
    );

    res.status(200).json({
      success: true,
      response,
      mode: effectiveOrgId ? 'organization' : 'client'
    });

  } catch (error) {
    console.error('Thread message error:', error);
    
    if (error.message === 'THREAD_NOT_FOUND' || error.message === 'THREAD_ACCESS_DENIED') {
      return res.status(404).json({
        success: false,
        message: error.message === 'THREAD_NOT_FOUND' 
          ? 'Chat thread not found.' 
          : 'Access denied to this chat thread.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing chat message.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
