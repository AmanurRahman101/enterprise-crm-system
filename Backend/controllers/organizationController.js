// Organization Controller
const db = require('../db/connection');
const { validators, validateRequest } = require('../utils/validation');

// Create Organization (creator becomes owner and switches to it)
const createOrganization = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const userId = req.user.userId;

    // Validate request body
    const validationError = validateRequest(req, res, {
      name: (v) => validators.name(v, true, 'Organization name', 255),
      email: (v) => validators.email(v, false),
      phone: (v) => validators.phone(v, false),
      address: (v) => validators.text(v, false, 'Address')
    });
    if (validationError) return validationError;

    // Create organization
    const [orgResult] = await db.query(
      'INSERT INTO organizations (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, address || null]
    );

    const organizationId = orgResult.insertId;

    // Add creator as owner
    await db.query(
      'INSERT INTO user_organizations (user_id, organization_id, role) VALUES (?, ?, ?)',
      [userId, organizationId, 'owner']
    );

    // Fetch created organization
    const [organizations] = await db.query(
      'SELECT id, name, email, phone, address, created_at FROM organizations WHERE id = ?',
      [organizationId]
    );

    // Generate new JWT with the new organization as currentOrganizationId
    const jwt = require('jsonwebtoken');
    const { jwtSecret, jwtExpiration } = require('../config/jwt');

    const [users] = await db.query(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length > 0) {
      const user = users[0];
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          currentOrganizationId: organizationId
        },
        jwtSecret,
        { expiresIn: jwtExpiration }
      );

      // Return success with new token
      res.status(201).json({
        success: true,
        message: 'Organization created successfully.',
        organization: organizations[0],
        token, // Return new token with organization context
        currentOrganization: {
          id: organizations[0].id,
          name: organizations[0].name,
          role: 'owner'
        }
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Organization created successfully.',
        organization: organizations[0]
      });
    }

  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during organization creation.',
      error: error.message
    });
  }
};

// List User's Organizations
const listUserOrganizations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [organizations] = await db.query(
      `SELECT o.id, o.name, o.email, o.phone, o.address, o.created_at, uo.role, uo.joined_at
       FROM organizations o
       INNER JOIN user_organizations uo ON o.id = uo.organization_id
       WHERE uo.user_id = ?
       ORDER BY uo.joined_at ASC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        email: org.email,
        phone: org.phone,
        address: org.address,
        role: org.role,
        joinedAt: org.joined_at,
        createdAt: org.created_at
      }))
    });

  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organizations.',
      error: error.message
    });
  }
};

// Add User to Organization (by email lookup, existing users only)
const addUserToOrganization = async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const { email, role = 'agent' } = req.body;
    const currentUserId = req.user.userId;
    const currentOrgId = req.user.currentOrganizationId;

    // Validate that user is adding to their current organization
    if (parseInt(organizationId) !== currentOrgId) {
      return res.status(403).json({
        success: false,
        message: 'You can only add users to your current organization.'
      });
    }

    // Validate role
    if (!['owner', 'admin', 'manager', 'agent', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: owner, admin, manager, agent, viewer.'
      });
    }

    // Check if current user has permission (owner/admin only)
    const [currentUserMembership] = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [currentUserId, organizationId]
    );

    if (currentUserMembership.length === 0 || !['owner', 'admin'].includes(currentUserMembership[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can add members.'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, email, full_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist. User must sign up first.'
      });
    }

    const user = users[0];

    // Check if user is already a member
    const [existingMemberships] = await db.query(
      'SELECT id FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [user.id, organizationId]
    );

    if (existingMemberships.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this organization.'
      });
    }

    // Add user to organization
    await db.query(
      'INSERT INTO user_organizations (user_id, organization_id, role) VALUES (?, ?, ?)',
      [user.id, organizationId, role]
    );

    res.status(201).json({
      success: true,
      message: 'User added to organization successfully.',
      member: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        role
      }
    });

  } catch (error) {
    console.error('Add user to organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding user to organization.',
      error: error.message
    });
  }
};

// Update Member Role (owner/admin only)
const updateMemberRole = async (req, res) => {
  try {
    const { id: organizationId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.userId;
    const currentOrgId = req.user.currentOrganizationId;

    // Validate that user is updating in their current organization
    if (parseInt(organizationId) !== currentOrgId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update members in your current organization.'
      });
    }

    // Validate role
    if (!['owner', 'admin', 'manager', 'agent', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: owner, admin, manager, agent, viewer.'
      });
    }

    // Check if current user has permission (owner/admin only)
    const [currentUserMembership] = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [currentUserId, organizationId]
    );

    if (currentUserMembership.length === 0 || !['owner', 'admin'].includes(currentUserMembership[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can update member roles.'
      });
    }

    // Prevent removing last owner
    if (role !== 'owner') {
      const [owners] = await db.query(
        'SELECT COUNT(*) as count FROM user_organizations WHERE organization_id = ? AND role = ?',
        [organizationId, 'owner']
      );

      const [targetUser] = await db.query(
        'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
        [userId, organizationId]
      );

      if (targetUser.length > 0 && targetUser[0].role === 'owner' && owners[0].count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last owner. Please transfer ownership first.'
        });
      }
    }

    // Update role
    await db.query(
      'UPDATE user_organizations SET role = ? WHERE user_id = ? AND organization_id = ?',
      [role, userId, organizationId]
    );

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully.'
    });

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating member role.',
      error: error.message
    });
  }
};

// Remove Member from Organization
const removeMember = async (req, res) => {
  try {
    const { id: organizationId, userId } = req.params;
    const currentUserId = req.user.userId;
    const currentOrgId = req.user.currentOrganizationId;

    // Validate that user is removing from their current organization
    if (parseInt(organizationId) !== currentOrgId) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove members from your current organization.'
      });
    }

    // Check if current user has permission (owner/admin only)
    const [currentUserMembership] = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [currentUserId, organizationId]
    );

    if (currentUserMembership.length === 0 || !['owner', 'admin'].includes(currentUserMembership[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owners and admins can remove members.'
      });
    }

    // Prevent removing last owner
    const [targetUser] = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [userId, organizationId]
    );

    if (targetUser.length > 0 && targetUser[0].role === 'owner') {
      const [owners] = await db.query(
        'SELECT COUNT(*) as count FROM user_organizations WHERE organization_id = ? AND role = ?',
        [organizationId, 'owner']
      );

      if (owners[0].count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last owner. Please transfer ownership first.'
        });
      }
    }

    // Prevent self-removal
    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself. Please transfer ownership or have another admin remove you.'
      });
    }

    // Remove member
    await db.query(
      'DELETE FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [userId, organizationId]
    );

    res.status(200).json({
      success: true,
      message: 'Member removed from organization successfully.'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing member.',
      error: error.message
    });
  }
};

// Get Organization Details
const getOrganization = async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    // Validate that user is requesting their current organization
    if (parseInt(organizationId) !== currentOrgId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your current organization.'
      });
    }

    const [organizations] = await db.query(
      'SELECT id, name, email, phone, address, created_at FROM organizations WHERE id = ?',
      [organizationId]
    );

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    res.status(200).json({
      success: true,
      organization: organizations[0]
    });

  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organization.',
      error: error.message
    });
  }
};

// List Organization Members (with role and joined date)
const listOrganizationMembers = async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    // Validate that user is requesting their current organization
    if (parseInt(organizationId) !== currentOrgId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view members of your current organization.'
      });
    }

    // Get all members with user details
    const [members] = await db.query(
      `SELECT 
        u.id as userId,
        u.email,
        u.full_name,
        u.phone,
        uo.role,
        uo.joined_at,
        uo.id as membership_id
      FROM user_organizations uo
      INNER JOIN users u ON uo.user_id = u.id
      WHERE uo.organization_id = ?
      ORDER BY 
        CASE uo.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'manager' THEN 3
          WHEN 'agent' THEN 4
          WHEN 'viewer' THEN 5
        END,
        uo.joined_at ASC`,
      [organizationId]
    );

    res.status(200).json({
      success: true,
      members: members.map(member => ({
        userId: member.userId,
        email: member.email,
        fullName: member.full_name,
        phone: member.phone,
        role: member.role,
        joinedAt: member.joined_at,
        membershipId: member.membership_id
      }))
    });

  } catch (error) {
    console.error('List organization members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organization members.',
      error: error.message
    });
  }
};

module.exports = {
  createOrganization,
  listUserOrganizations,
  addUserToOrganization,
  updateMemberRole,
  removeMember,
  getOrganization,
  listOrganizationMembers
};

