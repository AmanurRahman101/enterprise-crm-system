// Company Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { jwtSecret, jwtExpiration } = require('../config/jwt');

// Company Signup
const signupCompany = async (req, res) => {
  try {
    const { companyName, email, password, phone, address } = req.body;

    // Validate required fields
    if (!companyName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company name, email, and password are required.'
      });
    }

    // Check if company already exists
    const [existingCompany] = await db.query(
      'SELECT id FROM companies WHERE email = ?',
      [email]
    );

    if (existingCompany.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Company with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert company into database
    const [result] = await db.query(
      'INSERT INTO companies (company_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [companyName, email, hashedPassword, phone || null, address || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email, type: 'company' },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Company registered successfully.',
      token,
      company: {
        id: result.insertId,
        company_name: companyName,
        email,
        phone,
        address
      }
    });

  } catch (error) {
    console.error('Company signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during company registration.',
      error: error.message
    });
  }
};

// Company Signin
const signinCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find company by email
    const [companies] = await db.query(
      'SELECT * FROM companies WHERE email = ?',
      [email]
    );

    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const company = companies[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, company.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: company.id, email: company.email, type: 'company' },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Return success response (excluding password)
    const { password: _, ...companyData } = company;

    res.status(200).json({
      success: true,
      message: 'Company signed in successfully.',
      token,
      company: companyData
    });

  } catch (error) {
    console.error('Company signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during company sign in.',
      error: error.message
    });
  }
};

// Update Company Profile
const updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { companyName, email, phone, address } = req.body;

    // Validate required fields
    if (!companyName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name and email are required.'
      });
    }

    // Check if email is already used by another company
    const [existingCompany] = await db.query(
      'SELECT id FROM companies WHERE email = ? AND id != ?',
      [email, companyId]
    );

    if (existingCompany.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use by another company.'
      });
    }

    // Update company profile
    await db.query(
      'UPDATE companies SET company_name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [companyName, email, phone || null, address || null, companyId]
    );

    // Fetch updated company data
    const [updatedCompany] = await db.query(
      'SELECT id, company_name, email, phone, address, created_at FROM companies WHERE id = ?',
      [companyId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      company: updatedCompany[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update.',
      error: error.message
    });
  }
};

// Get Company Analytics Data
const getCompanyAnalytics = async (req, res) => {
  try {
    const companyId = req.user.id;

    // Get total customers
    const [customersCount] = await db.query(
      'SELECT COUNT(*) as total FROM company_customer_relationship WHERE company_id = ?',
      [companyId]
    );

    // Get total leads
    const [leadsCount] = await db.query(
      'SELECT COUNT(*) as total FROM leads WHERE company_id = ?',
      [companyId]
    );

    // Get leads by status
    const [leadsByStatus] = await db.query(
      'SELECT status, COUNT(*) as count FROM leads WHERE company_id = ? GROUP BY status',
      [companyId]
    );

    // Get conversion rate (converted leads / total leads)
    const [convertedLeads] = await db.query(
      'SELECT COUNT(*) as total FROM leads WHERE company_id = ? AND status = "converted"',
      [companyId]
    );

    const totalLeads = leadsCount[0].total;
    const converted = convertedLeads[0].total;
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalCustomers: customersCount[0].total,
        totalLeads: totalLeads,
        convertedLeads: converted,
        conversionRate: conversionRate,
        leadsByStatus: leadsByStatus
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics.',
      error: error.message
    });
  }
};

module.exports = {
  signupCompany,
  signinCompany,
  updateCompanyProfile,
  getCompanyAnalytics
};
