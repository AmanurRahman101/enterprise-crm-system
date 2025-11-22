// Contact Routes
const express = require('express');
const router = express.Router();
const {
  getContacts,
  getAvailableUsers,
  getAvailableOrganizations,
  createContactPerson,
  createContactOrganization,
  updateContactPerson,
  updateContactOrganization,
  deleteContactPerson,
  deleteContactOrganization
} = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');
const { logContactActivity } = require('../middleware/activityLogger');

// All contact routes require authentication and organization membership
router.get('/', authenticate, getContacts);
router.get('/available/users', authenticate, getAvailableUsers); // Get users available to add as contacts
router.get('/available/organizations', authenticate, getAvailableOrganizations); // Get organizations available to add as contacts
router.post('/people', authenticate, logContactActivity('created', 'Person'), createContactPerson);
router.post('/organizations', authenticate, logContactActivity('created', 'Organization'), createContactOrganization);
router.put('/people/:id', authenticate, logContactActivity('updated', 'Person'), updateContactPerson);
router.put('/organizations/:id', authenticate, logContactActivity('updated', 'Organization'), updateContactOrganization);
router.delete('/people/:id', authenticate, logContactActivity('deleted', 'Person'), deleteContactPerson);
router.delete('/organizations/:id', authenticate, logContactActivity('deleted', 'Organization'), deleteContactOrganization);

module.exports = router;

