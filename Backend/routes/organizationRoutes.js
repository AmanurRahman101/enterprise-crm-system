// Organization Routes
const express = require('express');
const router = express.Router();
const {
  createOrganization,
  listUserOrganizations,
  addUserToOrganization,
  updateMemberRole,
  removeMember,
  getOrganization,
  listOrganizationMembers
} = require('../controllers/organizationController');
const { verifyToken, authenticate } = require('../middleware/auth');

// Organization creation only requires authentication (no organization membership needed)
// List organizations requires authentication (allow users without organizations)
router.post('/', verifyToken, createOrganization); // Allow users without organizations to create
router.get('/', verifyToken, listUserOrganizations); // Allow users without organizations to list (empty list if none)
router.get('/:id', authenticate, getOrganization);
router.get('/:id/members', authenticate, listOrganizationMembers);
router.post('/:id/members', authenticate, addUserToOrganization);
router.put('/:id/members/:userId', authenticate, updateMemberRole);
router.delete('/:id/members/:userId', authenticate, removeMember);

module.exports = router;

