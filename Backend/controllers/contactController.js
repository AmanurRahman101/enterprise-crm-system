// Contact Controller
const db = require('../db/connection');
const { hasPermission } = require('../utils/permissions');
const { validators, validateRequest } = require('../utils/validation');

// Get socket service instance to check online status
let socketServiceInstance = null;
const setSocketService = (instance) => {
  socketServiceInstance = instance;
};

// Get all contacts (people and organizations) for current organization
const getContacts = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { type } = req.query; // 'people' or 'organizations'

    if (type === 'people') {
      const [contacts] = await db.query(
        `SELECT cp.*, u.full_name as created_by_name
         FROM contacts_people cp
         LEFT JOIN users u ON cp.created_by_user_id = u.id
         WHERE cp.organization_id = ?
         ORDER BY cp.created_at DESC`,
        [organizationId]
      );

      // Check online status for contacts with userId
      const contactsWithStatus = contacts.map(contact => {
        const isOnline = contact.user_id && socketServiceInstance && socketServiceInstance.isUserOnline(contact.user_id);
        return {
          id: contact.id,
          userId: contact.user_id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.job_title,
          notes: contact.notes,
          createdByUserId: contact.created_by_user_id,
          createdBy: contact.created_by_name,
          isOnline: isOnline || false,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at
        };
      });

      return res.status(200).json({
        success: true,
        contacts: contactsWithStatus
      });
    } else if (type === 'organizations') {
      const [contacts] = await db.query(
        `SELECT co.*, u.full_name as created_by_name
         FROM contacts_organizations co
         LEFT JOIN users u ON co.created_by_user_id = u.id
         WHERE co.organization_id = ?
         ORDER BY co.created_at DESC`,
        [organizationId]
      );

      return res.status(200).json({
        success: true,
        contacts: contacts.map(contact => ({
          id: contact.id,
          linkedOrganizationId: contact.linked_organization_id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          website: contact.website,
          notes: contact.notes,
          createdByUserId: contact.created_by_user_id,
          createdBy: contact.created_by_name,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at
        }))
      });
    } else {
      // Return both types
      const [people] = await db.query(
        `SELECT cp.*, u.full_name as created_by_name
         FROM contacts_people cp
         LEFT JOIN users u ON cp.created_by_user_id = u.id
         WHERE cp.organization_id = ?
         ORDER BY cp.created_at DESC`,
        [organizationId]
      );

      const [organizations] = await db.query(
        `SELECT co.*, u.full_name as created_by_name
         FROM contacts_organizations co
         LEFT JOIN users u ON co.created_by_user_id = u.id
         WHERE co.organization_id = ?
         ORDER BY co.created_at DESC`,
        [organizationId]
      );

      // Check online status for contacts with userId
      const peopleWithStatus = people.map(contact => {
        const isOnline = contact.user_id && socketServiceInstance && socketServiceInstance.isUserOnline(contact.user_id);
        return {
          id: contact.id,
          userId: contact.user_id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.job_title,
          notes: contact.notes,
          createdByUserId: contact.created_by_user_id,
          createdBy: contact.created_by_name,
          isOnline: isOnline || false,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at
        };
      });

      return res.status(200).json({
        success: true,
        people: peopleWithStatus,
        organizations: organizations.map(contact => ({
          id: contact.id,
          linkedOrganizationId: contact.linked_organization_id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          website: contact.website,
          notes: contact.notes,
          createdByUserId: contact.created_by_user_id,
          createdBy: contact.created_by_name,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at
        }))
      });
    }

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contacts.',
      error: error.message
    });
  }
};

// Create contact person - Link to existing user
const createContactPerson = async (req, res) => {
  try {
    const { userId, jobTitle, notes } = req.body;
    const organizationId = req.user.organizationId;
    const createdByUserId = req.user.userId;
    const role = req.user.role;


    // Check if user has organization context
    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: 'No organization context. Please select or create an organization.'
      });
    }

    // Check if role is defined
    if (!role) {
      console.error('User role is undefined. User ID:', createdByUserId, 'Organization ID:', organizationId);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Unable to verify your role in the organization.'
      });
    }

    // Check permission: Only owner, admin, manager, agent can create contacts
    if (!hasPermission(role, 'CREATE_CONTACT')) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role (${role}) does not have permission to create contacts.`
      });
    }

    // Validate request body
    const validationError = validateRequest(req, res, {
      userId: (v) => validators.integer(v, true, 'User ID'),
      jobTitle: (v) => validators.jobTitle(v, false),
      notes: (v) => validators.text(v, false, 'Notes')
    });
    if (validationError) return validationError;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required. Please select an existing user from the system.'
      });
    }

    // Get user details
    const [users] = await db.query(
      'SELECT id, email, full_name, phone FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please select an existing user from the system.'
      });
    }

    const user = users[0];
    
    // Prevent user from adding themselves as a contact
    if (parseInt(userId) === parseInt(createdByUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a contact.'
      });
    }

    // Check if user is already a member of the current organization
    const [existingMemberships] = await db.query(
      'SELECT id FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [userId, organizationId]
    );

    if (existingMemberships.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add organization members as contacts. They are already part of your organization.'
      });
    }
    
    // Parse full_name into first and last name
    const nameParts = user.full_name.split(' ');
    const firstName = nameParts[0] || user.full_name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if this user is already a contact in this organization
    const [existingContacts] = await db.query(
      'SELECT id FROM contacts_people WHERE email = ? AND organization_id = ?',
      [user.email, organizationId]
    );

    if (existingContacts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This user is already a contact in your organization.'
      });
    }

    // Create contact linking to user
    // First, ensure the user_id column exists (for backward compatibility)
    try {
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'contacts_people' 
        AND COLUMN_NAME = 'user_id'
      `);
      
      if (columns.length === 0) {
        // Column doesn't exist, add it
        await db.query(`
          ALTER TABLE contacts_people 
          ADD COLUMN user_id INT NULL
        `);
        // Add index separately to avoid issues if it exists
        try {
          await db.query(`CREATE INDEX idx_user_id ON contacts_people (user_id)`);
        } catch (idxError) {
          // Index might already exist, ignore
        }
        // Add foreign key constraint separately
        try {
          await db.query(`
            ALTER TABLE contacts_people 
            ADD CONSTRAINT fk_contacts_people_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          `);
        } catch (fkError) {
          // Constraint might already exist, ignore
          console.log('Foreign key constraint might already exist:', fkError.message);
        }
      }
    } catch (checkError) {
      console.error('Error checking for user_id column:', checkError.message);
      // Continue anyway - if column doesn't exist, the INSERT will fail and we'll catch it
    }

    const [result] = await db.query(
      `INSERT INTO contacts_people (organization_id, user_id, first_name, last_name, email, phone, job_title, notes, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, userId, firstName, lastName, user.email, user.phone || null, jobTitle || null, notes || null, createdByUserId]
    );

    const [newContacts] = await db.query(
      `SELECT cp.*, u.full_name as created_by_name
       FROM contacts_people cp
       LEFT JOIN users u ON cp.created_by_user_id = u.id
       WHERE cp.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Contact person added successfully.',
        contact: {
          id: newContacts[0].id,
          userId: newContacts[0].user_id,
          firstName: newContacts[0].first_name,
          lastName: newContacts[0].last_name,
          email: newContacts[0].email,
          phone: newContacts[0].phone,
          jobTitle: newContacts[0].job_title,
          notes: newContacts[0].notes,
          createdByUserId: newContacts[0].created_by_user_id,
          createdBy: newContacts[0].created_by_name,
          createdAt: newContacts[0].created_at,
          updatedAt: newContacts[0].updated_at
        }
    });

  } catch (error) {
    console.error('Create contact person error:', error);
    
    // Check if error is due to missing column
    if (error.message && error.message.includes('Unknown column')) {
      return res.status(500).json({
        success: false,
        message: 'Database schema is outdated. Please run the migration: mysql -u root tawasol_crm < Backend/migrations/add_contact_foreign_keys.sql',
        error: error.message,
        requiresMigration: true
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating contact person.',
      error: error.message
    });
  }
};

// Create contact organization - Link to existing organization
const createContactOrganization = async (req, res) => {
  try {
    const { organizationId: contactOrgId, notes } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    const role = req.user.role;

    // Validate request body
    const validationError = validateRequest(req, res, {
      organizationId: (v) => validators.integer(v, true, 'Organization ID'),
      notes: (v) => validators.text(v, false, 'Notes')
    });
    if (validationError) return validationError;


    // Check if user has organization context
    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: 'No organization context. Please select or create an organization.'
      });
    }

    // Check if role is defined
    if (!role) {
      console.error('User role is undefined. User ID:', userId, 'Organization ID:', organizationId);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Unable to verify your role in the organization.'
      });
    }

    // Check permission: Only owner, admin, manager, agent can create contacts
    if (!hasPermission(role, 'CREATE_CONTACT')) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role (${role}) does not have permission to create contacts.`
      });
    }

    if (!contactOrgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required. Please select an existing organization from the system.'
      });
    }

    // Don't allow adding self as contact
    if (parseInt(contactOrgId) === organizationId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own organization as a contact.'
      });
    }

    // Get organization details
    const [organizations] = await db.query(
      'SELECT id, name, email, phone, address FROM organizations WHERE id = ?',
      [contactOrgId]
    );

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found. Please select an existing organization from the system.'
      });
    }

    const org = organizations[0];

    // Check if this organization is already a contact
    const [existingContacts] = await db.query(
      'SELECT id FROM contacts_organizations WHERE name = ? AND organization_id = ?',
      [org.name, organizationId]
    );

    if (existingContacts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This organization is already a contact in your organization.'
      });
    }

    // Create contact linking to organization
    // First, ensure the linked_organization_id column exists (for backward compatibility)
    try {
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'contacts_organizations' 
        AND COLUMN_NAME = 'linked_organization_id'
      `);
      
      if (columns.length === 0) {
        // Column doesn't exist, add it
        await db.query(`
          ALTER TABLE contacts_organizations 
          ADD COLUMN linked_organization_id INT NULL
        `);
        // Add index separately to avoid issues if it exists
        try {
          await db.query(`CREATE INDEX idx_linked_organization_id ON contacts_organizations (linked_organization_id)`);
        } catch (idxError) {
          // Index might already exist, ignore
        }
        // Add foreign key constraint separately
        try {
          await db.query(`
            ALTER TABLE contacts_organizations 
            ADD CONSTRAINT fk_contacts_org_linked_org_id 
            FOREIGN KEY (linked_organization_id) REFERENCES organizations(id) ON DELETE SET NULL
          `);
        } catch (fkError) {
          // Constraint might already exist, ignore
          console.log('Foreign key constraint might already exist:', fkError.message);
        }
      }
    } catch (checkError) {
      console.error('Error checking for linked_organization_id column:', checkError.message);
      // Continue anyway - if column doesn't exist, the INSERT will fail and we'll catch it
    }

    const [result] = await db.query(
      `INSERT INTO contacts_organizations (organization_id, linked_organization_id, name, email, phone, address, website, notes, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, contactOrgId, org.name, org.email || null, org.phone || null, org.address || null, null, notes || null, userId]
    );

    const [newContacts] = await db.query(
      `SELECT co.*, u.full_name as created_by_name
       FROM contacts_organizations co
       LEFT JOIN users u ON co.created_by_user_id = u.id
       WHERE co.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Contact organization added successfully.',
        contact: {
          id: newContacts[0].id,
          linkedOrganizationId: newContacts[0].linked_organization_id,
          name: newContacts[0].name,
          email: newContacts[0].email,
          phone: newContacts[0].phone,
          address: newContacts[0].address,
          website: newContacts[0].website,
          notes: newContacts[0].notes,
          createdByUserId: newContacts[0].created_by_user_id,
          createdBy: newContacts[0].created_by_name,
          createdAt: newContacts[0].created_at,
          updatedAt: newContacts[0].updated_at
        }
    });

  } catch (error) {
    console.error('Create contact organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating contact organization.',
      error: error.message
    });
  }
};

// Update contact person
const updateContactPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, jobTitle, notes } = req.body;
    const organizationId = req.user.organizationId;
    const role = req.user.role;
    const userId = req.user.userId;

    // Validate request body
    const validationError = validateRequest(req, res, {
      firstName: (v) => validators.name(v, false, 'First name', 255),
      lastName: (v) => validators.name(v, false, 'Last name', 255),
      email: (v) => validators.email(v, false),
      phone: (v) => validators.phone(v, false),
      jobTitle: (v) => validators.jobTitle(v, false),
      notes: (v) => validators.text(v, false, 'Notes')
    });
    if (validationError) return validationError;

    // Check permission: Only owner, admin, manager, agent can update contacts
    if (!hasPermission(role, 'UPDATE_CONTACT')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update contacts.'
      });
    }

    // Agents can only update contacts they created
    if (role === 'agent') {
      const [existingContacts] = await db.query(
        'SELECT created_by_user_id FROM contacts_people WHERE id = ? AND organization_id = ?',
        [id, organizationId]
      );
      if (existingContacts.length > 0 && existingContacts[0].created_by_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Agents can only update contacts they created.'
        });
      }
    }

    const [result] = await db.query(
      `UPDATE contacts_people 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, job_title = ?, notes = ?
       WHERE id = ? AND organization_id = ?`,
      [firstName, lastName, email || null, phone || null, jobTitle || null, notes || null, id, organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact person not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact person updated successfully.'
    });

  } catch (error) {
    console.error('Update contact person error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating contact person.',
      error: error.message
    });
  }
};

// Update contact organization
const updateContactOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, website, notes } = req.body;
    const organizationId = req.user.organizationId;
    const role = req.user.role;
    const userId = req.user.userId;

    // Validate request body
    const validationError = validateRequest(req, res, {
      name: (v) => validators.name(v, false, 'Name', 255),
      email: (v) => validators.email(v, false),
      phone: (v) => validators.phone(v, false),
      address: (v) => validators.text(v, false, 'Address'),
      website: (v) => validators.website(v, false),
      notes: (v) => validators.text(v, false, 'Notes')
    });
    if (validationError) return validationError;

    // Check permission: Only owner, admin, manager, agent can update contacts
    if (!hasPermission(role, 'UPDATE_CONTACT')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update contacts.'
      });
    }

    // Agents can only update contacts they created
    if (role === 'agent') {
      const [existingContacts] = await db.query(
        'SELECT created_by_user_id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
        [id, organizationId]
      );
      if (existingContacts.length > 0 && existingContacts[0].created_by_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Agents can only update contacts they created.'
        });
      }
    }

    const [result] = await db.query(
      `UPDATE contacts_organizations 
       SET name = ?, email = ?, phone = ?, address = ?, website = ?, notes = ?
       WHERE id = ? AND organization_id = ?`,
      [name, email || null, phone || null, address || null, website || null, notes || null, id, organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact organization not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact organization updated successfully.'
    });

  } catch (error) {
    console.error('Update contact organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating contact organization.',
      error: error.message
    });
  }
};

// Delete contact person
const deleteContactPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const role = req.user.role;
    const userId = req.user.userId;

    // Check permission: Only owner, admin, manager can delete contacts
    if (!hasPermission(role, 'DELETE_CONTACT')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete contacts.'
      });
    }

    // Agents can only delete contacts they created
    if (role === 'agent') {
      const [existingContacts] = await db.query(
        'SELECT created_by_user_id FROM contacts_people WHERE id = ? AND organization_id = ?',
        [id, organizationId]
      );
      if (existingContacts.length > 0 && existingContacts[0].created_by_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Agents can only delete contacts they created.'
        });
      }
    }

    const [result] = await db.query(
      'DELETE FROM contacts_people WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact person not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact person deleted successfully.'
    });

  } catch (error) {
    console.error('Delete contact person error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting contact person.',
      error: error.message
    });
  }
};

// Delete contact organization
const deleteContactOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const role = req.user.role;
    const userId = req.user.userId;

    // Check permission: Only owner, admin, manager can delete contacts
    if (!hasPermission(role, 'DELETE_CONTACT')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete contacts.'
      });
    }

    // Agents can only delete contacts they created
    if (role === 'agent') {
      const [existingContacts] = await db.query(
        'SELECT created_by_user_id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
        [id, organizationId]
      );
      if (existingContacts.length > 0 && existingContacts[0].created_by_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Agents can only delete contacts they created.'
        });
      }
    }

    const [result] = await db.query(
      'DELETE FROM contacts_organizations WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact organization not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact organization deleted successfully.'
    });

  } catch (error) {
    console.error('Delete contact organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting contact organization.',
      error: error.message
    });
  }
};

// Get all users in system (for adding as contacts)
// Excludes: current user, organization members
const getAvailableUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user.userId;

    // Build query to exclude only the current user (can't add themselves)
    // Allow adding any other user, even if they're already in the organization
    let query = `
      SELECT DISTINCT u.id, u.email, u.full_name, u.phone 
      FROM users u
      WHERE u.id != ?
    `;
    const params = [currentUserId];

    if (search) {
      query += ' AND (u.email LIKE ? OR u.full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY u.full_name ASC LIMIT 50';

    const [users] = await db.query(query, params);

    res.status(200).json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone
      }))
    });

  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available users.',
      error: error.message
    });
  }
};

// Get all organizations in system (for adding as contacts)
const getAvailableOrganizations = async (req, res) => {
  try {
    const { search } = req.query;
    const currentOrganizationId = req.user.organizationId;

    let query = 'SELECT id, name, email, phone, address FROM organizations WHERE id != ?';
    const params = [currentOrganizationId]; // Exclude current organization

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC LIMIT 50';

    const [organizations] = await db.query(query, params);

    res.status(200).json({
      success: true,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        email: org.email,
        phone: org.phone,
        address: org.address
      }))
    });

  } catch (error) {
    console.error('Get available organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available organizations.',
      error: error.message
    });
  }
};

module.exports = {
  setSocketService,
  getContacts,
  getAvailableUsers,
  getAvailableOrganizations,
  createContactPerson,
  createContactOrganization,
  updateContactPerson,
  updateContactOrganization,
  deleteContactPerson,
  deleteContactOrganization
};

