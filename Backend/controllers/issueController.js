// Issue Controller
const db = require('../db/connection');
const jiraService = require('../services/jiraService');
const { hasPermission, canPerformAction } = require('../utils/permissions');

// Get all issues for current organization
const getIssues = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, priority, assignedTo } = req.query;

    let query = `
      SELECT i.*, 
             u_assigned.full_name as assigned_to_name,
             u_reporter.full_name as reporter_name
      FROM issues i
      LEFT JOIN users u_assigned ON i.assigned_to_user_id = u_assigned.id
      LEFT JOIN users u_reporter ON i.reporter_user_id = u_reporter.id
      WHERE i.organization_id = ?
    `;
    const params = [organizationId];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND i.priority = ?';
      params.push(priority);
    }
    if (assignedTo) {
      query += ' AND i.assigned_to_user_id = ?';
      params.push(assignedTo);
    }

    query += ' ORDER BY i.created_at DESC';

    const [issues] = await db.query(query, params);

    res.status(200).json({
      success: true,
      issues: issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        assignedTo: issue.assigned_to_name ? {
          id: issue.assigned_to_user_id,
          name: issue.assigned_to_name
        } : null,
        reporter: {
          id: issue.reporter_user_id,
          name: issue.reporter_name
        },
        jiraProjectKey: issue.jira_project_key,
        jiraTicketId: issue.jira_ticket_id,
        jiraUrl: issue.jira_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at
      }))
    });

  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching issues.',
      error: error.message
    });
  }
};

// Get issue by ID
const getIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const [issues] = await db.query(
      `SELECT i.*, 
              u_assigned.full_name as assigned_to_name,
              u_reporter.full_name as reporter_name
       FROM issues i
       LEFT JOIN users u_assigned ON i.assigned_to_user_id = u_assigned.id
       LEFT JOIN users u_reporter ON i.reporter_user_id = u_reporter.id
       WHERE i.id = ? AND i.organization_id = ?`,
      [id, organizationId]
    );

    if (issues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    const issue = issues[0];
    res.status(200).json({
      success: true,
      issue: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        assignedToUserId: issue.assigned_to_user_id,
        reporterUserId: issue.reporter_user_id,
        jiraProjectKey: issue.jira_project_key,
        jiraTicketId: issue.jira_ticket_id,
        jiraUrl: issue.jira_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at
      }
    });

  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching issue.',
      error: error.message
    });
  }
};

// Create issue
const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'open',
      priority = 'medium',
      assignedToUserId,
      dealId,
      jiraProjectKey
    } = req.body;

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    const role = req.user.role;

    // Check permission: Only owner, admin, manager, agent can create issues
    if (!hasPermission(role, 'CREATE_ISSUE')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to create issues.'
      });
    }

    // Agents can only assign issues to themselves
    if (role === 'agent' && assignedToUserId && parseInt(assignedToUserId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Agents can only assign issues to themselves.'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.'
      });
    }

    // Validate deal_id if provided
    if (dealId) {
      const [deals] = await db.query(
        'SELECT id FROM deals WHERE id = ? AND organization_id = ?',
        [dealId, organizationId]
      );
      if (deals.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deal ID.'
        });
      }
    }

    let jiraTicketId = null;
    let jiraUrl = null;
    let finalJiraProjectKey = jiraProjectKey;

    // Create JIRA ticket if JIRA is configured
    if (jiraService.isConfigured()) {
      try {
        // Get assignee email if provided
        let assigneeEmail = null;
        if (assignedToUserId) {
          const [assignedUsers] = await db.query(
            'SELECT email FROM users WHERE id = ?',
            [assignedToUserId]
          );
          if (assignedUsers.length > 0) {
            assigneeEmail = assignedUsers[0].email;
          }
        }

        const jiraResult = await jiraService.createTicket({
          title,
          description,
          priority,
          projectKey: jiraProjectKey,
          assigneeEmail,
          dealId,
          issueType: 'Task'
        });

        if (jiraResult.success) {
          jiraTicketId = jiraResult.ticketId;
          jiraUrl = jiraResult.ticketUrl;
          finalJiraProjectKey = jiraProjectKey || process.env.JIRA_PROJECT_KEY;
        }
      } catch (jiraError) {
        console.error('JIRA ticket creation failed:', jiraError.message);
        // Continue without JIRA - don't fail the whole operation
      }
    }

    const [result] = await db.query(
      `INSERT INTO issues (organization_id, deal_id, title, description, status, priority, assigned_to_user_id, reporter_user_id, jira_project_key, jira_ticket_id, jira_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, dealId || null, title, description || null, status, priority, assignedToUserId || null, userId, finalJiraProjectKey || null, jiraTicketId || null, jiraUrl || null]
    );

    const [newIssues] = await db.query(
      'SELECT * FROM issues WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: jiraTicketId 
        ? `Issue created successfully and synced to JIRA (${jiraTicketId})`
        : 'Issue created successfully.',
      issue: newIssues[0],
      jiraTicket: jiraTicketId ? {
        ticketId: jiraTicketId,
        url: jiraUrl
      } : null
    });

  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating issue.',
      error: error.message
    });
  }
};

// Update issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignedToUserId,
      jiraProjectKey,
      jiraTicketId,
      jiraUrl
    } = req.body;

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    const role = req.user.role;

    // Check if issue exists and belongs to organization
    const [existingIssues] = await db.query(
      'SELECT id, assigned_to_user_id, reporter_user_id, jira_ticket_id FROM issues WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (existingIssues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    const existingIssue = existingIssues[0];

    // Check permission: Only owner, admin, manager, agent can update issues
    if (!hasPermission(role, 'UPDATE_ISSUE')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update issues.'
      });
    }

    // Agents can only update issues assigned to them or reported by them
    if (role === 'agent' && existingIssue.assigned_to_user_id !== userId && existingIssue.reporter_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Agents can only update issues assigned to them or reported by them.'
      });
    }

    // Only managers and above can assign issues to others
    if (assignedToUserId !== undefined && role === 'agent' && parseInt(assignedToUserId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Agents can only assign issues to themselves.'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (assignedToUserId !== undefined) {
      updates.push('assigned_to_user_id = ?');
      values.push(assignedToUserId);
    }
    if (jiraProjectKey !== undefined) {
      updates.push('jira_project_key = ?');
      values.push(jiraProjectKey);
    }
    if (jiraTicketId !== undefined) {
      updates.push('jira_ticket_id = ?');
      values.push(jiraTicketId);
    }
    if (jiraUrl !== undefined) {
      updates.push('jira_url = ?');
      values.push(jiraUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    values.push(id, organizationId);
    await db.query(
      `UPDATE issues SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`,
      values
    );

    // Sync with JIRA if ticket exists
    if (existingIssue.jira_ticket_id && jiraService.isConfigured()) {
      try {
        const jiraUpdates = {};
        if (title !== undefined) jiraUpdates.title = title;
        if (description !== undefined) jiraUpdates.description = description;
        if (status !== undefined) jiraUpdates.status = status;
        if (priority !== undefined) jiraUpdates.priority = priority;
        
        await jiraService.updateTicket(existingIssue.jira_ticket_id, jiraUpdates);
      } catch (jiraError) {
        console.error('JIRA sync failed:', jiraError.message);
        // Continue without failing the update
      }
    }

    const [updatedIssues] = await db.query(
      'SELECT * FROM issues WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Issue updated successfully.',
      issue: updatedIssues[0]
    });

  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating issue.',
      error: error.message
    });
  }
};

// Delete issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const role = req.user.role;

    // Check permission: Only owner, admin, manager can delete issues
    if (!hasPermission(role, 'DELETE_ISSUE')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete issues.'
      });
    }

    const [result] = await db.query(
      'DELETE FROM issues WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully.'
    });

  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting issue.',
      error: error.message
    });
  }
};

module.exports = {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue
};

