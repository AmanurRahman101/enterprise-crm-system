// Telegram Routes (CRM account linking utilities)
// Note: The Telegram bot runs as a separate process (bot.js) using polling mode
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createVerificationCodeForUser,
  getLinkStatusForUser
} = require('../telegram/auth');

const serializeLinkPayload = (status, entry) => {
  const toISO = (value) => (value ? new Date(value).toISOString() : null);
  return {
    status,
    link:
      entry && Object.keys(entry).length > 0
        ? {
            verificationCode: entry.verification_code || null,
            generatedAt: toISO(entry.created_at),
            verifiedAt: toISO(entry.verified_at),
            telegramChatId: entry.telegram_chat_id || null
          }
        : null,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || null
  };
};

// Return current link status for authenticated user
router.get('/link', verifyToken, async (req, res) => {
  try {
    const status = await getLinkStatusForUser(req.user.userId);
    const payload = serializeLinkPayload(status.state, status.entry);
    return res.json({
      success: true,
      ...payload
    });
  } catch (error) {
    console.error('Failed to fetch Telegram link status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Telegram link status.',
      error: error.message
    });
  }
});

// Generate (or regenerate) verification code for authenticated user
router.post('/link', verifyToken, async (req, res) => {
  try {
    const result = await createVerificationCodeForUser(req.user.userId);
    const payload = serializeLinkPayload('pending', {
      verification_code: result.verificationCode,
      created_at: result.generatedAt
    });
    return res.json({
      success: true,
      message: 'Telegram verification code generated.',
      ...payload
    });
  } catch (error) {
    console.error('Failed to generate Telegram verification code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Telegram verification code.',
      error: error.message
    });
  }
});

module.exports = router;
