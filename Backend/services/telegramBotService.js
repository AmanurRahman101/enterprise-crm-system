// Telegram Bot Service
const TelegramBot = require('node-telegram-bot-api');
const db = require('../db/connection');
const { chat } = require('./chatbotService');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;


if (!TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN not configured. Telegram bot will not work.');
  module.exports = { initializeBot: () => {} };
  return; 
}

let bot = null;

const initializeBot = () => {
  if (!TELEGRAM_BOT_TOKEN) {
    return;
  }

  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

  // Webhook endpoint handler
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) {
      return;
    }

    // Check if user is linked
    const [links] = await db.query(
      'SELECT user_id FROM user_telegram_links WHERE telegram_chat_id = ? AND verified_at IS NOT NULL',
      [chatId]
    );

    if (links.length === 0) {
      // User not linked - check if they're trying to verify
      if (text.match(/^\d{6}$/)) {
        // 6-digit code
        const [unverifiedLinks] = await db.query(
          'SELECT user_id FROM user_telegram_links WHERE verification_code = ? AND verified_at IS NULL',
          [text]
        );

        if (unverifiedLinks.length > 0) {
          const userId = unverifiedLinks[0].user_id;
          await db.query(
            'UPDATE user_telegram_links SET verified_at = NOW() WHERE verification_code = ?',
            [text]
          );

          bot.sendMessage(chatId, '✅ Account linked successfully! You can now chat with the CRM assistant.');
        } else {
          bot.sendMessage(chatId, '❌ Invalid verification code. Please check and try again.');
        }
      } else {
        bot.sendMessage(chatId, '👋 Welcome! To use this bot, you need to link your account first.\n\n1. Go to your CRM Settings\n2. Generate a 6-digit verification code\n3. Send that code here to link your account.');
      }
      return;
    }

    const userId = links[0].user_id;

    // Get user's current organization (use first organization)
    const [orgs] = await db.query(
      `SELECT organization_id FROM user_organizations WHERE user_id = ? ORDER BY joined_at ASC LIMIT 1`,
      [userId]
    );

    if (orgs.length === 0) {
      bot.sendMessage(chatId, '❌ You are not a member of any organization.');
      return;
    }

    const organizationId = orgs[0].organization_id;

    try {
      // Forward message to chatbot
      const response = await chat(userId, organizationId, text);
      bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Telegram bot chat error:', error);
      bot.sendMessage(chatId, 'Sorry, I encountered an error. Please try again later.');
    }
  });

  console.log('Telegram bot initialized');
};

// Generate verification code for user
const generateVerificationCode = async (userId) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Delete existing unverified codes
  await db.query(
    'DELETE FROM user_telegram_links WHERE user_id = ? AND verified_at IS NULL',
    [userId]
  );

  // Create new link
  await db.query(
    'INSERT INTO user_telegram_links (user_id, verification_code) VALUES (?, ?)',
    [userId, code]
  );

  return code;
};

// Set webhook (call this when ngrok domain is configured)
const setWebhook = async (webhookUrl) => {
  if (!bot) {
    return;
  }

  try {
    await bot.setWebHook(`${webhookUrl}/api/telegram/webhook`);
    console.log('Telegram webhook set:', webhookUrl);
  } catch (error) {
    console.error('Error setting Telegram webhook:', error);
  }
};

module.exports = {
  initializeBot,
  generateVerificationCode,
  setWebhook,
  bot
};

