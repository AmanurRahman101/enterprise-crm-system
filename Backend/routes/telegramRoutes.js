// Telegram Webhook Routes
const express = require('express');
const router = express.Router();
const { bot } = require('../services/telegramBotService');

// Webhook endpoint for Telegram
router.post('/webhook', (req, res) => {
  if (bot) {
    bot.processUpdate(req.body);
  }
  res.sendStatus(200);
});

module.exports = router;

