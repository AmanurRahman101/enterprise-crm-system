// Deal Routes
const express = require('express');
const router = express.Router();
const {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealStages,
  createDealStage,
  updateDealStage,
  deleteDealStage,
  reorderDealStages
} = require('../controllers/dealController');
const { authenticate } = require('../middleware/auth');
const { logDealActivity } = require('../middleware/activityLogger');

// All deal routes require authentication and organization membership
router.get('/stages', authenticate, getDealStages);
router.post('/stages', authenticate, createDealStage);
router.put('/stages/:id', authenticate, updateDealStage);
router.delete('/stages/:id', authenticate, deleteDealStage);
router.post('/stages/reorder', authenticate, reorderDealStages);
router.get('/', authenticate, getDeals);
router.get('/:id', authenticate, getDeal);
router.post('/', authenticate, logDealActivity('created'), createDeal);
router.put('/:id', authenticate, logDealActivity('updated'), updateDeal);
router.delete('/:id', authenticate, logDealActivity('deleted'), deleteDeal);

module.exports = router;

