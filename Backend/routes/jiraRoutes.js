// JIRA Webhook Routes
const express = require('express');
const router = express.Router();
const { handleJiraWebhook } = require('../controllers/jiraWebhookController');

// JIRA webhook endpoint (public - no auth required as JIRA sends requests)
// Note: In production, you should verify the webhook using JIRA's webhook secret
router.post('/webhook', handleJiraWebhook);

module.exports = router;
