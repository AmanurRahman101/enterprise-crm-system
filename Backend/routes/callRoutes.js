const express = require('express');
const router = express.Router();
const { verifyToken, validateOrganizationMembership, authenticate } = require('../middleware/auth');
const {
    generateAgoraToken,
    startCall,
    endCall,
    getCallHistory,
    getCallStatistics
} = require('../controllers/callController');

// Agora token generation - only requires token verification (org context flexible for incoming calls)
router.post('/agora/token', verifyToken, generateAgoraToken);

// Call logging - requires organization context
router.post('/start', authenticate, startCall);
router.post('/end', verifyToken, endCall);

// Call history - requires organization context
router.get('/history', authenticate, getCallHistory);
router.get('/statistics', authenticate, getCallStatistics);

module.exports = router;

