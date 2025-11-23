// Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { jwtSecret, jwtExpiration } = require('../config/jwt');

// User Signup (creates unified user account - all users can access client portal and create/join organizations)
const signup = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required.'
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database (user_type is optional, kept for backward compatibility but ignored)
    const [result] = await db.query(
      'INSERT INTO users (email, password, full_name, phone, user_type) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, fullName, phone || null, 'internal'] // Default to internal for backward compatibility
    );

    // Return success response (no JWT yet, user needs to sign in)
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please sign in to continue.',
      user: {
        id: result.insertId,
        email,
        fullName
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message
    });
  }
};

// User Signin (authenticate and return JWT with first organization as currentOrganizationId)
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug logging (masked for security)
    console.log('Signin attempt:', { 
      email: email ? email.substring(0, 3) + '***' : 'missing', 
      hasPassword: !!password,
      passwordLength: password ? password.length : 0
    });

    // Validate required fields
    if (!email || !password) {
      console.log('Signin validation failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find user by email (case-insensitive)
    const [users] = await db.query(
      'SELECT id, email, password, full_name, phone, user_type FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (users.length === 0) {
      console.log(`Signin attempt failed: User not found with email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password
    if (!user.password) {
      console.error(`User ${user.id} has no password stored`);
      return res.status(500).json({
        success: false,
        message: 'Account error. Please contact support.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`Signin attempt failed: Invalid password for user: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    console.log(`Signin successful for user: ${user.email} (ID: ${user.id})`);

    // Get user's organizations
    const [organizations] = await db.query(
      `SELECT o.id, o.name, uo.role 
       FROM organizations o
       INNER JOIN user_organizations uo ON o.id = uo.organization_id
       WHERE uo.user_id = ?
       ORDER BY uo.joined_at ASC`,
      [user.id]
    );

    // For client users, organizations are optional - they can access client portal
    // For internal users without orgs, they'll be prompted to create one
    const currentOrganizationId = organizations.length > 0 ? organizations[0].id : null;

    // Generate JWT token (allow null currentOrganizationId for new users)
    // userType removed - all users are unified and can access both client portal and organizations
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        currentOrganizationId: currentOrganizationId
      },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Sign in successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone
      },
      currentOrganization: organizations.length > 0 ? {
        id: organizations[0].id,
        name: organizations[0].name,
        role: organizations[0].role
      } : null,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        role: org.role
      }))
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sign in.',
      error: error.message
    });
  }
};

// Switch Organization (validate membership and issue new JWT with updated currentOrganizationId)
const switchOrganization = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const userId = req.user.userId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required.'
      });
    }

    // Validate user membership in the requested organization
    const [memberships] = await db.query(
      `SELECT o.id, o.name, uo.role 
       FROM organizations o
       INNER JOIN user_organizations uo ON o.id = uo.organization_id
       WHERE uo.user_id = ? AND uo.organization_id = ?`,
      [userId, organizationId]
    );

    if (memberships.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this organization.'
      });
    }

    const organization = memberships[0];

    // Get user details
    const [users] = await db.query(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Generate new JWT token with updated currentOrganizationId
    // userType removed - all users are unified
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        currentOrganizationId: organization.id
      },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Organization switched successfully.',
      token,
      currentOrganization: {
        id: organization.id,
        name: organization.name,
        role: organization.role
      }
    });

  } catch (error) {
    console.error('Switch organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during organization switch.',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  signin,
  switchOrganization
};

