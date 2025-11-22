// Deal Controller
const db = require('../db/connection');
const { hasPermission, canPerformAction } = require('../utils/permissions');

// Get all deals for current organization
const getDeals = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [deals] = await db.query(
      `SELECT d.*, 
              ds.name as stage_name, ds.color as stage_color, ds.order_index,
              cp.first_name as contact_first_name, cp.last_name as contact_last_name, cp.email as contact_email,
              co.name as contact_org_name, co.email as contact_org_email,
              u.full_name as assigned_to_name,
              u_assigned.email as assigned_to_email
       FROM deals d
       INNER JOIN deal_stages ds ON d.stage_id = ds.id
       LEFT JOIN contacts_people cp ON d.contact_person_id = cp.id
       LEFT JOIN contacts_organizations co ON d.contact_org_id = co.id
       LEFT JOIN users u ON d.assigned_to_user_id = u.id
       LEFT JOIN users u_assigned ON d.assigned_to_user_id = u_assigned.id
       WHERE d.organization_id = ?
       ORDER BY ds.order_index, d.created_at DESC`,
      [organizationId]
    );

    res.status(200).json({
      success: true,
      deals: deals.map(deal => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        stage: {
          id: deal.stage_id,
          name: deal.stage_name,
          color: deal.stage_color,
          orderIndex: deal.order_index
        },
        contactPerson: deal.contact_first_name ? {
          id: deal.contact_person_id,
          name: `${deal.contact_first_name} ${deal.contact_last_name}`,
          email: deal.contact_email
        } : null,
        contactOrg: deal.contact_org_name ? {
          id: deal.contact_org_id,
          name: deal.contact_org_name,
          email: deal.contact_org_email
        } : null,
        assignedTo: deal.assigned_to_name ? {
          id: deal.assigned_to_user_id,
          name: deal.assigned_to_name,
          email: deal.assigned_to_email
        } : null,
        expectedCloseDate: deal.expected_close_date,
        probability: deal.probability,
        notes: deal.notes,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }))
    });

  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching deals.',
      error: error.message
    });
  }
};

// Get deal by ID
const getDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const [deals] = await db.query(
      `SELECT d.*, 
              ds.name as stage_name, ds.color as stage_color,
              cp.first_name as contact_first_name, cp.last_name as contact_last_name,
              co.name as contact_org_name,
              u.full_name as assigned_to_name
       FROM deals d
       INNER JOIN deal_stages ds ON d.stage_id = ds.id
       LEFT JOIN contacts_people cp ON d.contact_person_id = cp.id
       LEFT JOIN contacts_organizations co ON d.contact_org_id = co.id
       LEFT JOIN users u ON d.assigned_to_user_id = u.id
       WHERE d.id = ? AND d.organization_id = ?`,
      [id, organizationId]
    );

    if (deals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found.'
      });
    }

    const deal = deals[0];
    res.status(200).json({
      success: true,
      deal: {
        id: deal.id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        stageId: deal.stage_id,
        contactPersonId: deal.contact_person_id,
        contactOrgId: deal.contact_org_id,
        assignedToUserId: deal.assigned_to_user_id,
        expectedCloseDate: deal.expected_close_date,
        probability: deal.probability,
        notes: deal.notes,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }
    });

  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching deal.',
      error: error.message
    });
  }
};

// Create deal
const createDeal = async (req, res) => {
  try {
    const {
      title,
      value,
      currency = 'USD',
      stageId,
      contactPersonId,
      contactOrgId,
      assignedToUserId,
      expectedCloseDate,
      probability = 0,
      notes
    } = req.body;

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    const role = req.user.role;

    // Check permission: Only owner, admin, manager, agent can create deals
    if (!hasPermission(role, 'CREATE_DEAL')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to create deals.'
      });
    }

    // Agents can only assign deals to themselves
    if (role === 'agent' && assignedToUserId && parseInt(assignedToUserId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Agents can only create deals assigned to themselves.'
      });
    }

    if (!title || !stageId) {
      return res.status(400).json({
        success: false,
        message: 'Title and stage are required.'
      });
    }

    // Validate stage exists
    const [stages] = await db.query('SELECT id FROM deal_stages WHERE id = ?', [stageId]);
    if (stages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deal stage.'
      });
    }

    // Validate contact if provided
    if (contactPersonId) {
      const [contacts] = await db.query(
        'SELECT id FROM contacts_people WHERE id = ? AND organization_id = ?',
        [contactPersonId, organizationId]
      );
      if (contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact person.'
        });
      }
    }

    if (contactOrgId) {
      const [contacts] = await db.query(
        'SELECT id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
        [contactOrgId, organizationId]
      );
      if (contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact organization.'
        });
      }
    }

    // Create deal
    const [result] = await db.query(
      `INSERT INTO deals (organization_id, title, value, currency, stage_id, contact_person_id, contact_org_id, assigned_to_user_id, expected_close_date, probability, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, title, value || null, currency, stageId, contactPersonId || null, contactOrgId || null, assignedToUserId || null, expectedCloseDate || null, probability, notes || null]
    );

    // Fetch created deal
    const [newDeals] = await db.query(
      `SELECT d.*, ds.name as stage_name, ds.color as stage_color
       FROM deals d
       INNER JOIN deal_stages ds ON d.stage_id = ds.id
       WHERE d.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Deal created successfully.',
      deal: newDeals[0]
    });

  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating deal.',
      error: error.message
    });
  }
};

// Update deal
const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      value,
      currency,
      stageId,
      contactPersonId,
      contactOrgId,
      assignedToUserId,
      expectedCloseDate,
      probability,
      notes
    } = req.body;

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    const role = req.user.role;

    // Check if deal exists and belongs to organization
    const [existingDeals] = await db.query(
      'SELECT id, stage_id, assigned_to_user_id FROM deals WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (existingDeals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found.'
      });
    }

    const existingDeal = existingDeals[0];

    // Check permission: Only owner, admin, manager, agent can update deals
    if (!hasPermission(role, 'UPDATE_DEAL')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update deals.'
      });
    }

    // Agents can only update deals assigned to them
    if (role === 'agent' && existingDeal.assigned_to_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Agents can only update deals assigned to them.'
      });
    }

    // Only managers and above can assign deals to others
    if (assignedToUserId !== undefined && role === 'agent' && parseInt(assignedToUserId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Agents can only assign deals to themselves.'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (value !== undefined) {
      updates.push('value = ?');
      values.push(value);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      values.push(currency);
    }
    if (stageId !== undefined) {
      updates.push('stage_id = ?');
      values.push(stageId);
    }
    if (contactPersonId !== undefined) {
      updates.push('contact_person_id = ?');
      values.push(contactPersonId);
    }
    if (contactOrgId !== undefined) {
      updates.push('contact_org_id = ?');
      values.push(contactOrgId);
    }
    if (assignedToUserId !== undefined) {
      updates.push('assigned_to_user_id = ?');
      values.push(assignedToUserId);
    }
    if (expectedCloseDate !== undefined) {
      updates.push('expected_close_date = ?');
      values.push(expectedCloseDate);
    }
    if (probability !== undefined) {
      updates.push('probability = ?');
      values.push(probability);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    values.push(id, organizationId);
    await db.query(
      `UPDATE deals SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`,
      values
    );

    // Fetch updated deal
    const [updatedDeals] = await db.query(
      `SELECT d.*, ds.name as stage_name, ds.color as stage_color
       FROM deals d
       INNER JOIN deal_stages ds ON d.stage_id = ds.id
       WHERE d.id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Deal updated successfully.',
      deal: updatedDeals[0],
      stageChanged: stageId !== undefined && stageId !== existingDeal.stage_id
    });

  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating deal.',
      error: error.message
    });
  }
};

// Delete deal
const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const role = req.user.role;

    // Check permission: Only owner, admin, manager can delete deals
    if (!hasPermission(role, 'DELETE_DEAL')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete deals.'
      });
    }

    const [result] = await db.query(
      'DELETE FROM deals WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deal deleted successfully.'
    });

  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting deal.',
      error: error.message
    });
  }
};

// Get deal stages
const getDealStages = async (req, res) => {
  try {
    const [stages] = await db.query(
      'SELECT * FROM deal_stages ORDER BY order_index ASC'
    );

    res.status(200).json({
      success: true,
      stages: stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        orderIndex: stage.order_index,
        color: stage.color
      }))
    });

  } catch (error) {
    console.error('Get deal stages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching deal stages.',
      error: error.message
    });
  }
};

module.exports = {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealStages
};

