const db = require('../db/connection');

// Get all leads for a company
const getCompanyLeads = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const [leads] = await db.query(
      'SELECT * FROM leads WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    res.status(200).json({
      success: true,
      leads
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: error.message
    });
  }
};

// Create a new lead
const createLead = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { full_name, email, phone, company_name, source, notes } = req.body;

    // Validate required fields
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO leads 
       (company_id, full_name, email, phone, company_name, source, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
      [companyId, full_name, email, phone, company_name, source, notes]
    );

    // Fetch the created lead
    const [leads] = await db.query(
      'SELECT * FROM leads WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: leads[0]
    });
  } catch (error) {
    console.error('Create lead error:', error);
    
    // Check for duplicate email
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating lead',
      error: error.message
    });
  }
};

// Update a lead
const updateLead = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;
    const { full_name, email, phone, company_name, status, source, notes } = req.body;

    // Verify the lead belongs to this company
    const [existingLead] = await db.query(
      'SELECT * FROM leads WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Update the lead
    await db.query(
      `UPDATE leads 
       SET full_name = ?, email = ?, phone = ?, company_name = ?, 
           status = ?, source = ?, notes = ?
       WHERE id = ? AND company_id = ?`,
      [full_name, email, phone, company_name, status, source, notes, id, companyId]
    );

    // Fetch updated lead
    const [updatedLead] = await db.query(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead[0]
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead',
      error: error.message
    });
  }
};

// Delete a lead
const deleteLead = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;

    // Verify the lead belongs to this company
    const [existingLead] = await db.query(
      'SELECT * FROM leads WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    await db.query(
      'DELETE FROM leads WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lead',
      error: error.message
    });
  }
};

// Convert lead to customer
const convertLead = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;
    const { password } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get the lead
    const [leads] = await db.query(
      'SELECT * FROM leads WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const lead = leads[0];

    // Check if customer with this email already exists
    const [existingCustomer] = await db.query(
      'SELECT * FROM customers WHERE email = ?',
      [lead.email]
    );

    let customerId;

    if (existingCustomer.length > 0) {
      // Customer exists, just create relationship
      customerId = existingCustomer[0].id;
    } else {
      // Create new customer
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        `INSERT INTO customers (full_name, email, password, phone) 
         VALUES (?, ?, ?, ?)`,
        [lead.full_name, lead.email, hashedPassword, lead.phone]
      );
      customerId = result.insertId;
    }

    // Create relationship
    await db.query(
      `INSERT INTO company_customer_relationship 
       (company_id, customer_id, status, notes, added_by_company_id) 
       VALUES (?, ?, 'active', ?, ?)
       ON DUPLICATE KEY UPDATE status = 'active', notes = ?, updated_at = CURRENT_TIMESTAMP`,
      [companyId, customerId, `Converted from lead: ${lead.full_name}`, companyId, `Converted from lead: ${lead.full_name}`]
    );

    // Update lead status to converted
    await db.query(
      'UPDATE leads SET status = ? WHERE id = ?',
      ['converted', id]
    );

    res.status(200).json({
      success: true,
      message: 'Lead converted to customer successfully',
      customerId
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error converting lead',
      error: error.message
    });
  }
};

module.exports = {
  getCompanyLeads,
  createLead,
  updateLead,
  deleteLead,
  convertLead
};
