// Company Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { jwtSecret, jwtExpiration } = require('../config/jwt');

// Company Signup (legacy endpoint bridging new multi-tenant system)
const signupCompany = async (req, res) => {
  try {
    const { companyName, fullName, email, password, phone, address } = req.body;
    const ownerFullName = fullName || `${companyName} Owner`;

    if (!companyName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company name, email, and password are required.'
      });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    const [userResult] = await db.query(
      'INSERT INTO users (email, password, full_name, phone, user_type) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, ownerFullName, phone || null, 'internal']
    );
    const userId = userResult.insertId;

    // Create organization
    const [orgResult] = await db.query(
      'INSERT INTO organizations (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [companyName, email, phone || null, address || null]
    );
    const organizationId = orgResult.insertId;

    // Link user to organization as owner
    await db.query(
      'INSERT INTO user_organizations (user_id, organization_id, role) VALUES (?, ?, ?)',
      [userId, organizationId, 'owner']
    );

    const token = jwt.sign(
      { userId, email, currentOrganizationId: organizationId },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    res.status(201).json({
      success: true,
      message: 'Company registered successfully.',
      token,
      company: {
        id: organizationId,
        company_name: companyName,
        email,
        phone,
        address
      },
      user: {
        id: userId,
        full_name: ownerFullName,
        email,
        phone
      },
      currentOrganization: {
        id: organizationId,
        name: companyName,
        role: 'owner'
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

// Company Signin (legacy endpoint bridging new multi-tenant system)
const signinCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Fetch user's organizations (legacy company view assumes first organization)
    const [organizations] = await db.query(
      `SELECT o.id, o.name, o.email, o.phone, o.address, uo.role
       FROM organizations o
       INNER JOIN user_organizations uo ON o.id = uo.organization_id
       WHERE uo.user_id = ?
       ORDER BY uo.joined_at ASC`,
      [user.id]
    );

    const currentOrganization = organizations.length > 0 ? organizations[0] : null;

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        currentOrganizationId: currentOrganization ? currentOrganization.id : null
      },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    const { password: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Company signed in successfully.',
      token,
      user: safeUser,
      company: currentOrganization
        ? {
            id: currentOrganization.id,
            company_name: currentOrganization.name,
            email: currentOrganization.email,
            phone: currentOrganization.phone,
            address: currentOrganization.address
          }
        : null,
      organizations
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
    const organizationId = req.user.organizationId;
    const { companyName, email, phone, address } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context is required.'
      });
    }

    // Validate required fields
    if (!companyName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name and email are required.'
      });
    }

    // Update company profile
    await db.query(
      'UPDATE organizations SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [companyName, email, phone || null, address || null, organizationId]
    );

    // Fetch updated company data
    const [updatedOrganization] = await db.query(
      'SELECT id, name, email, phone, address, created_at FROM organizations WHERE id = ?',
      [organizationId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      company: {
        id: updatedOrganization[0].id,
        company_name: updatedOrganization[0].name,
        email: updatedOrganization[0].email,
        phone: updatedOrganization[0].phone,
        address: updatedOrganization[0].address,
        created_at: updatedOrganization[0].created_at
      }
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
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context is required.'
      });
    }

    // Get total customers
    const [customersCount] = await db.query(
      'SELECT COUNT(*) as total FROM organization_customer_relationships WHERE organization_id = ?',
      [organizationId]
    );

    // Get total leads
    const [leadsCount] = await db.query(
      'SELECT COUNT(*) as total FROM leads WHERE organization_id = ?',
      [organizationId]
    );

    // Get leads by status
    const [leadsByStatus] = await db.query(
      'SELECT status, COUNT(*) as count FROM leads WHERE organization_id = ? GROUP BY status',
      [organizationId]
    );

    // Get conversion rate (converted leads / total leads)
    const [convertedLeads] = await db.query(
      'SELECT COUNT(*) as total FROM leads WHERE organization_id = ? AND status = "converted"',
      [organizationId]
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
