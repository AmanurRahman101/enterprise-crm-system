const db = require('../db/connection');
const bcrypt = require('bcryptjs');

// Get all customers for a company
const getCompanyCustomers = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context is required.'
      });
    }
    
    const [customers] = await db.query(
      `SELECT 
        c.id, c.full_name, c.email, c.phone, c.created_at,
        ocr.status, ocr.notes, ocr.created_at as relationship_created
      FROM customers c
      INNER JOIN organization_customer_relationships ocr ON c.id = ocr.customer_id
      WHERE ocr.organization_id = ?
      ORDER BY ocr.created_at DESC`,
      [organizationId]
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
    const organizationId = req.user.organizationId;
    const addedByUserId = req.user.userId || null;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context is required.'
      });
    }
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
        'SELECT * FROM organization_customer_relationships WHERE organization_id = ? AND customer_id = ?',
        [organizationId, customerId]
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
      `INSERT INTO organization_customer_relationships 
       (organization_id, customer_id, status, notes, added_by_user_id) 
       VALUES (?, ?, 'active', ?, ?)`,
      [organizationId, customerId, notes, addedByUserId]
    );

    // Fetch the customer details
    const [customers] = await db.query(
      `SELECT 
        c.id, c.full_name, c.email, c.phone, c.created_at,
        ocr.status, ocr.notes, ocr.created_at as relationship_created
      FROM customers c
      INNER JOIN organization_customer_relationships ocr ON c.id = ocr.customer_id
      WHERE c.id = ? AND ocr.organization_id = ?`,
      [customerId, organizationId]
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
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context is required.'
      });
    }
    const { id } = req.params;
    const { status, notes } = req.body;

    // Verify the relationship exists
    const [relationship] = await db.query(
      'SELECT * FROM organization_customer_relationships WHERE organization_id = ? AND customer_id = ?',
      [organizationId, id]
    );

    if (relationship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer relationship not found'
      });
    }

    // Update relationship
    await db.query(
      `UPDATE organization_customer_relationships 
       SET status = ?, notes = ?
       WHERE organization_id = ? AND customer_id = ?`,
      [status, notes, organizationId, id]
    );

    // Fetch updated customer
    const [customers] = await db.query(
      `SELECT 
        c.id, c.full_name, c.email, c.phone, c.created_at,
        ocr.status, ocr.notes, ocr.created_at as relationship_created
      FROM customers c
      INNER JOIN organization_customer_relationships ocr ON c.id = ocr.customer_id
      WHERE c.id = ? AND ocr.organization_id = ?`,
      [id, organizationId]
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
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context is required.'
      });
    }
    const { id } = req.params;

    // Verify the relationship exists
    const [relationship] = await db.query(
      'SELECT * FROM organization_customer_relationships WHERE organization_id = ? AND customer_id = ?',
      [organizationId, id]
    );

    if (relationship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer relationship not found'
      });
    }

    // Delete relationship
    await db.query(
      'DELETE FROM organization_customer_relationships WHERE organization_id = ? AND customer_id = ?',
      [organizationId, id]
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
