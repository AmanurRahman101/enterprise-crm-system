// Issue Routes
const express = require('express');
const router = express.Router();
const {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue
} = require('../controllers/issueController');
const { authenticate } = require('../middleware/auth');
const { logIssueActivity } = require('../middleware/activityLogger');

// All issue routes require authentication and organization membership
router.get('/', authenticate, getIssues);
router.get('/:id', authenticate, getIssue);
router.post('/', authenticate, logIssueActivity('created'), createIssue);
router.put('/:id', authenticate, logIssueActivity('updated'), updateIssue);
router.delete('/:id', authenticate, logIssueActivity('deleted'), deleteIssue);

module.exports = router;

