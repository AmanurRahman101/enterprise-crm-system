// Customer Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { jwtSecret, jwtExpiration } = require('../config/jwt');

// Customer Signup
const signupCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.'
      });
    }

    // Check if customer already exists
    const [existingCustomer] = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingCustomer.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert customer into database
    const [result] = await db.query(
      'INSERT INTO customers (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, phone || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email, type: 'customer' },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      token,
      customer: {
        id: result.insertId,
        full_name: fullName,
        email,
        phone
      }
    });

  } catch (error) {
    console.error('Customer signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during customer registration.',
      error: error.message
    });
  }
};

// Customer Signin
const signinCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find customer by email
    const [customers] = await db.query(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const customer = customers[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'customer' },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Return success response (excluding password)
    const { password: _, ...customerData } = customer;

    res.status(200).json({
      success: true,
      message: 'Customer signed in successfully.',
      token,
      customer: customerData
    });

  } catch (error) {
    console.error('Customer signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during customer sign in.',
      error: error.message
    });
  }
};

module.exports = {
  signupCustomer,
  signinCustomer
};
