// RPC-style Routes
const express = require('express');
const router = express.Router();
const { signupCompany, signinCompany, updateCompanyProfile, getCompanyAnalytics } = require('../controllers/companyController');
const { signupCustomer, signinCustomer } = require('../controllers/customerController');
const { verifyToken, isCompany, isCustomer, authenticate } = require('../middleware/auth');

// Lead Controller
const {
  getCompanyLeads,
  createLead,
  updateLead,
  deleteLead,
  convertLead
} = require('../controllers/leadController');

// Customer Management Controller
const {
  getCompanyCustomers,
  addCustomer,
  updateCustomer,
  removeCustomer
} = require('../controllers/customerManagementController');

// Customer Profile Controller
const {
  updateCustomerProfile,
  getAllCompanies,
  getCustomerCompanies,
  addCompanyToCustomer,
  removeCompanyFromCustomer
} = require('../controllers/customerProfileController');

// ========== PUBLIC ROUTES (Authentication) ==========

// Company Authentication
router.post('/signupCompany', signupCompany);
router.post('/signinCompany', signinCompany);

// Customer Authentication
router.post('/signupCustomer', signupCustomer);
router.post('/signinCustomer', signinCustomer);
 
// ========== PROTECTED ROUTES ==========

// ===== Company Protected Routes =====

// Company Profile
router.get('/getCompanyProfile', authenticate, isCompany, (req, res) => {
  res.json({
    success: true,
    message: 'Company profile endpoint',
    user: req.user
  });
});

router.post('/updateCompanyProfile', authenticate, isCompany, updateCompanyProfile);

// Analytics
router.get('/getCompanyAnalytics', authenticate, isCompany, getCompanyAnalytics);

// Leads Management
router.get('/getCompanyLeads', authenticate, isCompany, getCompanyLeads);
router.post('/createLead', authenticate, isCompany, createLead);
router.put('/updateLead/:id', authenticate, isCompany, updateLead);
router.delete('/deleteLead/:id', authenticate, isCompany, deleteLead);
router.post('/convertLead/:id', authenticate, isCompany, convertLead);

// Customer Management
router.get('/getCompanyCustomers', authenticate, isCompany, getCompanyCustomers);
router.post('/addCustomer', authenticate, isCompany, addCustomer);
router.put('/updateCustomer/:id', authenticate, isCompany, updateCustomer);
router.delete('/removeCustomer/:id', authenticate, isCompany, removeCustomer);

// ===== Customer Protected Routes =====
router.get('/getCustomerProfile', verifyToken, isCustomer, (req, res) => {
  res.json({
    success: true,
    message: 'Customer profile endpoint',
    user: req.user
  });
});

router.post('/updateCustomerProfile', verifyToken, isCustomer, updateCustomerProfile);

// Customer Company Management
router.get('/getAllCompanies', verifyToken, isCustomer, getAllCompanies);
router.get('/getCustomerCompanies', verifyToken, isCustomer, getCustomerCompanies);
router.post('/addCompanyToCustomer', verifyToken, isCustomer, addCompanyToCustomer);
router.delete('/removeCompanyFromCustomer/:companyId', verifyToken, isCustomer, removeCompanyFromCustomer);

// Test route to verify token
router.get('/verifyToken', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;
