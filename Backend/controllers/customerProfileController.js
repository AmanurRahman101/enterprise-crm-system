// Customer Profile and Company Management Controller
const bcrypt = require('bcryptjs');
const db = require('../db/connection');

// Update Customer Profile
const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { fullName, email, phone } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required.'
      });
    }

    // Check if email is already used by another customer
    const [existingCustomer] = await db.query(
      'SELECT id FROM customers WHERE email = ? AND id != ?',
      [email, customerId]
    );

    if (existingCustomer.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use by another customer.'
      });
    }

    // Update customer profile
    await db.query(
      'UPDATE customers SET full_name = ?, email = ?, phone = ? WHERE id = ?',
      [fullName, email, phone || null, customerId]
    );

    // Fetch updated customer data
    const [updatedCustomer] = await db.query(
      'SELECT id, full_name, email, phone, created_at FROM customers WHERE id = ?',
      [customerId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      customer: updatedCustomer[0]
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

// Get All Companies (for customer to browse and add)
const getAllCompanies = async (req, res) => {
  try {
    const [companies] = await db.query(
      'SELECT id, company_name, email, phone, address, created_at FROM companies ORDER BY company_name ASC'
    );

    res.status(200).json({
      success: true,
      companies
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching companies.',
      error: error.message
    });
  }
};

// Get Customer's Companies (companies customer has relationship with)
const getCustomerCompanies = async (req, res) => {
  try {
    const customerId = req.user.id;

    const [companies] = await db.query(
      `SELECT 
        c.id,
        c.company_name,
        c.email,
        c.phone,
        c.address,
        ccr.status,
        ccr.notes,
        ccr.created_at as relationship_started
      FROM company_customer_relationship ccr
      INNER JOIN companies c ON ccr.company_id = c.id
      WHERE ccr.customer_id = ?
      ORDER BY ccr.created_at DESC`,
      [customerId]
    );

    res.status(200).json({
      success: true,
      companies
    });

  } catch (error) {
    console.error('Get customer companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your companies.',
      error: error.message
    });
  }
};

// Add Company to Customer's List
const addCompanyToCustomer = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    // Check if company exists
    const [company] = await db.query(
      'SELECT id FROM companies WHERE id = ?',
      [companyId]
    );

    if (company.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    // Check if relationship already exists
    const [existing] = await db.query(
      'SELECT id FROM company_customer_relationship WHERE company_id = ? AND customer_id = ?',
      [companyId, customerId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a relationship with this company.'
      });
    }

    // Create relationship
    await db.query(
      'INSERT INTO company_customer_relationship (company_id, customer_id, status) VALUES (?, ?, ?)',
      [companyId, customerId, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Company added successfully to your list.'
    });

  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding company.',
      error: error.message
    });
  }
};

// Remove Company from Customer's List
const removeCompanyFromCustomer = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { companyId } = req.params;

    // Delete the relationship
    const [result] = await db.query(
      'DELETE FROM company_customer_relationship WHERE company_id = ? AND customer_id = ?',
      [companyId, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company relationship not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company removed from your list successfully.'
    });

  } catch (error) {
    console.error('Remove company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing company.',
      error: error.message
    });
  }
};

module.exports = {
  updateCustomerProfile,
  getAllCompanies,
  getCustomerCompanies,
  addCompanyToCustomer,
  removeCompanyFromCustomer
};
