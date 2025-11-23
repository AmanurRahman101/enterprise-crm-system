// Deal Controller
const db = require('../db/connection');
const { validators, validateRequest } = require('../utils/validation');
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

    // Validate request body
    const validationError = validateRequest(req, res, {
      title: (v) => validators.name(v, true, 'Title', 255),
      value: (v) => validators.dealValue(v, false),
      currency: (v) => validators.currency(v, false),
      stageId: (v) => validators.integer(v, true, 'Stage ID'),
      probability: (v) => validators.probability(v, false),
      expectedCloseDate: (v) => validators.date(v, false, 'Expected close date'),
      notes: (v) => validators.text(v, false, 'Notes')
    });
    if (validationError) return validationError;

    if (!title || !stageId) {
      return res.status(400).json({
        success: false,
        message: 'Title and stage are required.'
      });
    }

    // Validate stage exists and get default probability
    const [stages] = await db.query('SELECT id, default_probability FROM deal_stages WHERE id = ?', [stageId]);
    if (stages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deal stage.'
      });
    }
    
    // Use stage's default probability if probability not explicitly provided
    const finalProbability = probability !== undefined && probability !== null 
      ? probability 
      : (stages[0].default_probability || 0);

    // Validate contact if provided
    if (contactPersonId) {
      const [contacts] = await db.query(
        'SELECT id FROM contacts_people WHERE id = ? AND organization_id = ?',
        [contactPersonId, organizationId]
      );
      if (contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact person. Please select a contact from your contacts list.'
        });
      }
    }

    if (contactOrgId) {
      const [contacts] = await db.query(
        'SELECT id, linked_organization_id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
        [contactOrgId, organizationId]
      );
      if (contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact organization. Please select a contact from your contacts list.'
        });
      }
      // Prevent adding a deal with the current organization itself
      if (contacts[0].linked_organization_id && parseInt(contacts[0].linked_organization_id) === parseInt(organizationId)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot create a deal with your own organization.'
        });
      }
    }

    // Contact is optional - deals can exist without a contact

    // Create deal
    const [result] = await db.query(
      `INSERT INTO deals (organization_id, title, value, currency, stage_id, contact_person_id, contact_org_id, assigned_to_user_id, expected_close_date, probability, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, title, value || null, currency, stageId, contactPersonId || null, contactOrgId || null, assignedToUserId || null, expectedCloseDate || null, finalProbability, notes || null]
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

    // Validate request body
    const validationError = validateRequest(req, res, {
      title: (v) => validators.name(v, false, 'Title', 255),
      value: (v) => validators.dealValue(v, false),
      currency: (v) => validators.currency(v, false),
      stageId: (v) => validators.integer(v, false, 'Stage ID'),
      probability: (v) => validators.probability(v, false),
      expectedCloseDate: (v) => validators.date(v, false, 'Expected close date'),
      notes: (v) => validators.text(v, false, 'Notes')
    });
    if (validationError) return validationError;

    // Check if deal exists and belongs to organization
    const [existingDeals] = await db.query(
      'SELECT id, stage_id, assigned_to_user_id, probability FROM deals WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (existingDeals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found.'
      });
    }

    const existingDeal = existingDeals[0];
    
    // If stage is being changed, get the new stage's default probability
    let finalProbability = probability;
    if (stageId !== undefined && parseInt(stageId) !== parseInt(existingDeal.stage_id)) {
      const [newStages] = await db.query('SELECT default_probability FROM deal_stages WHERE id = ?', [stageId]);
      if (newStages.length > 0) {
        // If probability is explicitly provided, use it; otherwise use stage default
        if (probability !== undefined && probability !== null) {
          finalProbability = probability;
        } else {
          // Use stage's default probability (even if it's 0)
          finalProbability = newStages[0].default_probability !== null 
            ? newStages[0].default_probability 
            : 0;
        }
      }
    } else if (probability === undefined || probability === null) {
      // If probability not provided and stage not changing, keep existing probability
      finalProbability = existingDeal.probability;
    }

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
    if (finalProbability !== undefined) {
      updates.push('probability = ?');
      values.push(finalProbability);
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
        color: stage.color,
        defaultProbability: stage.default_probability || 0
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

// Create deal stage
const createDealStage = async (req, res) => {
  try {
    const { name, color = '#6B7280', defaultProbability = 0 } = req.body;
    const role = req.user.role;

    // Check permission: Only owner and admin can manage stages
    if (!hasPermission(role, 'MANAGE_ORGANIZATION')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can manage deal stages.'
      });
    }

    // Validate request body
    const validationError = validateRequest(req, res, {
      name: (v) => validators.stageName(v, true),
      color: (v) => validators.color(v, false),
      defaultProbability: (v) => validators.probability(v, false)
    });
    if (validationError) return validationError;

    const prob = parseInt(defaultProbability) || 0;

    // Get the highest order_index
    const [maxOrder] = await db.query(
      'SELECT MAX(order_index) as max_order FROM deal_stages'
    );
    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO deal_stages (name, order_index, color, default_probability) VALUES (?, ?, ?, ?)',
      [name.trim(), nextOrder, color, prob]
    );

    res.status(201).json({
      success: true,
      message: 'Deal stage created successfully.',
      stage: {
        id: result.insertId,
        name: name.trim(),
        orderIndex: nextOrder,
        color
      }
    });

  } catch (error) {
    console.error('Create deal stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating deal stage.',
      error: error.message
    });
  }
};

// Update deal stage
const updateDealStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, orderIndex, defaultProbability } = req.body;
    const role = req.user.role;

    // Check permission: Only owner and admin can manage stages
    if (!hasPermission(role, 'MANAGE_ORGANIZATION')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can manage deal stages.'
      });
    }

    // Validate request body
    const validationError = validateRequest(req, res, {
      name: (v) => validators.stageName(v, false),
      color: (v) => validators.color(v, false),
      defaultProbability: (v) => validators.probability(v, false)
    });
    if (validationError) return validationError;

    // Check if stage exists
    const [stages] = await db.query('SELECT * FROM deal_stages WHERE id = ?', [id]);
    if (stages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal stage not found.'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Stage name cannot be empty.'
        });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (orderIndex !== undefined) {
      updates.push('order_index = ?');
      params.push(orderIndex);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    params.push(id);
    await db.query(
      `UPDATE deal_stages SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.status(200).json({
      success: true,
      message: 'Deal stage updated successfully.'
    });

  } catch (error) {
    console.error('Update deal stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating deal stage.',
      error: error.message
    });
  }
};

// Delete deal stage
const deleteDealStage = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;

    // Check permission: Only owner and admin can manage stages
    if (!hasPermission(role, 'MANAGE_ORGANIZATION')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can manage deal stages.'
      });
    }

    // Check if stage exists
    const [stages] = await db.query('SELECT * FROM deal_stages WHERE id = ?', [id]);
    if (stages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal stage not found.'
      });
    }

    // Check if any deals are using this stage
    const [deals] = await db.query('SELECT COUNT(*) as count FROM deals WHERE stage_id = ?', [id]);
    if (deals[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stage. ${deals[0].count} deal(s) are currently using this stage. Please move them to another stage first.`
      });
    }

    await db.query('DELETE FROM deal_stages WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Deal stage deleted successfully.'
    });

  } catch (error) {
    console.error('Delete deal stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting deal stage.',
      error: error.message
    });
  }
};

// Reorder deal stages
const reorderDealStages = async (req, res) => {
  try {
    const { stageOrders } = req.body; // Array of { id, orderIndex }
    const role = req.user.role;

    // Check permission: Only owner and admin can manage stages
    if (!hasPermission(role, 'MANAGE_ORGANIZATION')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can manage deal stages.'
      });
    }

    if (!Array.isArray(stageOrders) || stageOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage orders array.'
      });
    }

    // Update all stages in a transaction
    await db.query('START TRANSACTION');
    try {
      for (const { id, orderIndex } of stageOrders) {
        await db.query(
          'UPDATE deal_stages SET order_index = ? WHERE id = ?',
          [orderIndex, id]
        );
      }
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Deal stages reordered successfully.'
    });

  } catch (error) {
    console.error('Reorder deal stages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reordering deal stages.',
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
  getDealStages,
  createDealStage,
  updateDealStage,
  deleteDealStage,
  reorderDealStages
};

