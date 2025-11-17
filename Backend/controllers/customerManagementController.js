const db = require('../db/connection');
const bcrypt = require('bcryptjs');

// Get all customers for a company
const getCompanyCustomers = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const [customers] = await db.query(
      `SELECT 
        c.id, c.full_name, c.email, c.phone, c.created_at,
        ccr.status, ccr.notes, ccr.created_at as relationship_created
      FROM customers c
      INNER JOIN company_customer_relationship ccr ON c.id = ccr.customer_id
      WHERE ccr.company_id = ?
      ORDER BY ccr.created_at DESC`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// Add a new customer
const addCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { full_name, email, phone, password, notes } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if customer with this email already exists
    const [existingCustomer] = await db.query(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    let customerId;

    if (existingCustomer.length > 0) {
      // Customer exists, check if relationship exists
      customerId = existingCustomer[0].id;
      
      const [existingRelationship] = await db.query(
        'SELECT * FROM company_customer_relationship WHERE company_id = ? AND customer_id = ?',
        [companyId, customerId]
      );

      if (existingRelationship.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'This customer is already associated with your company'
        });
      }
    } else {
      // Create new customer
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await db.query(
        'INSERT INTO customers (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
        [full_name, email, hashedPassword, phone]
      );
      customerId = result.insertId;
    }

    // Create relationship
    await db.query(
      `INSERT INTO company_customer_relationship 
       (company_id, customer_id, status, notes, added_by_company_id) 
       VALUES (?, ?, 'active', ?, ?)`,
      [companyId, customerId, notes, companyId]
    );

    // Fetch the customer details
    const [customers] = await db.query(
      `SELECT 
        c.id, c.full_name, c.email, c.phone, c.created_at,
        ccr.status, ccr.notes, ccr.created_at as relationship_created
      FROM customers c
      INNER JOIN company_customer_relationship ccr ON c.id = ccr.customer_id
      WHERE c.id = ? AND ccr.company_id = ?`,
      [customerId, companyId]
    );

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      customer: customers[0]
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding customer',
      error: error.message
    });
  }
};

// Update customer relationship
const updateCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;
    const { status, notes } = req.body;

    // Verify the relationship exists
    const [relationship] = await db.query(
      'SELECT * FROM company_customer_relationship WHERE company_id = ? AND customer_id = ?',
      [companyId, id]
    );

    if (relationship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer relationship not found'
      });
    }

    // Update relationship
    await db.query(
      `UPDATE company_customer_relationship 
       SET status = ?, notes = ?
       WHERE company_id = ? AND customer_id = ?`,
      [status, notes, companyId, id]
    );

    // Fetch updated customer
    const [customers] = await db.query(
      `SELECT 
        c.id, c.full_name, c.email, c.phone, c.created_at,
        ccr.status, ccr.notes, ccr.created_at as relationship_created
      FROM customers c
      INNER JOIN company_customer_relationship ccr ON c.id = ccr.customer_id
      WHERE c.id = ? AND ccr.company_id = ?`,
      [id, companyId]
    );

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: customers[0]
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// Remove customer relationship
const removeCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;

    // Verify the relationship exists
    const [relationship] = await db.query(
      'SELECT * FROM company_customer_relationship WHERE company_id = ? AND customer_id = ?',
      [companyId, id]
    );

    if (relationship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer relationship not found'
      });
    }

    // Delete relationship
    await db.query(
      'DELETE FROM company_customer_relationship WHERE company_id = ? AND customer_id = ?',
      [companyId, id]
    );

    res.status(200).json({
      success: true,
      message: 'Customer removed from your company successfully'
    });
  } catch (error) {
    console.error('Remove customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing customer',
      error: error.message
    });
  }
};

module.exports = {
  getCompanyCustomers,
  addCustomer,
  updateCustomer,
  removeCustomer
};
