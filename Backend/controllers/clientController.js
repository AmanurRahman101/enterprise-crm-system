// Client Portal Controller (for user_type='client')
const db = require('../db/connection');
const jiraService = require('../services/jiraService');
const { verifyToken, isClient } = require('../middleware/auth');
const { validateClientIssuePayload, validateIssuePayload } = require('../utils/validation');

// Get Client's Deals (across all organizations where client is a contact)
const getClientDeals = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all contact_people records linked to this user's email
    const [contactPeople] = await db.query(
      `SELECT cp.id, cp.organization_id 
       FROM contacts_people cp
       WHERE cp.email = (SELECT email FROM users WHERE id = ?)`,
      [userId]
    );

    // Find all contact_organizations records linked to this user's email
    const [contactOrgs] = await db.query(
      `SELECT co.id, co.organization_id 
       FROM contacts_organizations co
       WHERE co.email = (SELECT email FROM users WHERE id = ?)`,
      [userId]
    );

    const contactPersonIds = contactPeople.map(cp => cp.id);
    const contactOrgIds = contactOrgs.map(co => co.id);

    // Build query to get deals where:
    // 1. Client is a contact (existing behavior)
    // 2. Deal is assigned to this user AND stage is "Won"
    let dealsQuery = `
      SELECT d.*, 
             ds.name as stage_name, ds.color as stage_color,
             cp.first_name as contact_first_name, cp.last_name as contact_last_name,
             co.name as contact_org_name,
             u.full_name as assigned_to_name,
             o.name as organization_name
      FROM deals d
      INNER JOIN deal_stages ds ON d.stage_id = ds.id
      LEFT JOIN contacts_people cp ON d.contact_person_id = cp.id
      LEFT JOIN contacts_organizations co ON d.contact_org_id = co.id
      LEFT JOIN users u ON d.assigned_to_user_id = u.id
      INNER JOIN organizations o ON d.organization_id = o.id
      WHERE (
    `;

    // Add contact-based filter
    if (contactPersonIds.length > 0 || contactOrgIds.length > 0) {
      dealsQuery += `(d.contact_person_id IN (${contactPersonIds.length > 0 ? contactPersonIds.join(',') : 'NULL'})
             OR d.contact_org_id IN (${contactOrgIds.length > 0 ? contactOrgIds.join(',') : 'NULL'}))`;
    } else {
      dealsQuery += `(1 = 0)`; // No contacts, so only assigned deals
    }

    // Add assigned user filter (show won deals assigned to user)
    dealsQuery += ` OR (d.assigned_to_user_id = ? AND ds.name = 'Won')`;
    dealsQuery += `)`;

    const [deals] = await db.query(dealsQuery, [userId]);

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
          color: deal.stage_color
        },
        contact: deal.contact_first_name && deal.contact_last_name
          ? `${deal.contact_first_name} ${deal.contact_last_name}`
          : deal.contact_org_name || 'Unknown',
        assignedTo: deal.assigned_to_name,
        expectedCloseDate: deal.expected_close_date,
        probability: deal.probability,
        notes: deal.notes,
        organizationName: deal.organization_name,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }))
    });

  } catch (error) {
    console.error('Get client deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching client deals.',
      error: error.message
    });
  }
};

// Get Client's Issues (where client is reporter)
const getClientIssues = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [issues] = await db.query(
      `SELECT i.*, 
              u.full_name as assigned_to_name,
              o.name as organization_name
       FROM issues i
       LEFT JOIN users u ON i.assigned_to_user_id = u.id
       INNER JOIN organizations o ON i.organization_id = o.id
       WHERE i.reporter_user_id = ?
       ORDER BY i.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      issues: issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        assignedTo: issue.assigned_to_name,
        organizationName: issue.organization_name,
        jiraProjectKey: issue.jira_project_key,
        jiraTicketId: issue.jira_ticket_id,
        jiraUrl: issue.jira_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at
      }))
    });

  } catch (error) {
    console.error('Get client issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching client issues.',
      error: error.message
    });
  }
};

// Get All Organizations (for client to raise general issues)
const getClientOrganizations = async (req, res) => {
  try {
    // Return all organizations so clients can raise issues against any company
    const [organizations] = await db.query(
      `SELECT id, name, email as org_email
       FROM organizations
       ORDER BY name`
    );

    res.status(200).json({
      success: true,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        email: org.org_email
      }))
    });

  } catch (error) {
    console.error('Get client organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organizations.',
      error: error.message
    });
  }
};

// Get Client Overview Stats
const getClientOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user email for contact lookup
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const userEmail = users[0].email;

    // Count deals
    const [contactPeople] = await db.query(
      `SELECT cp.id FROM contacts_people cp WHERE cp.email = ?`,
      [userEmail]
    );
    const [contactOrgs] = await db.query(
      `SELECT co.id FROM contacts_organizations co WHERE co.email = ?`,
      [userEmail]
    );

    const contactPersonIds = contactPeople.map(cp => cp.id);
    const contactOrgIds = contactOrgs.map(co => co.id);

    let dealsCount = 0;
    if (contactPersonIds.length > 0 || contactOrgIds.length > 0) {
      const [dealsResult] = await db.query(
        `SELECT COUNT(*) as count FROM deals 
         WHERE contact_person_id IN (${contactPersonIds.length > 0 ? contactPersonIds.join(',') : 'NULL'})
            OR contact_org_id IN (${contactOrgIds.length > 0 ? contactOrgIds.join(',') : 'NULL'})`
      );
      dealsCount = dealsResult[0].count;
    }

    // Count issues
    const [issuesResult] = await db.query(
      'SELECT COUNT(*) as count FROM issues WHERE reporter_user_id = ?',
      [userId]
    );
    const issuesCount = issuesResult[0].count;

    res.status(200).json({
      success: true,
      stats: {
        dealsCount,
        issuesCount
      }
    });

  } catch (error) {
    console.error('Get client overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching client overview.',
      error: error.message
    });
  }
};

// Create Issue from Client Portal
const createClientIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      dealId,
      organizationId: requestedOrgId,
      jiraProjectKey
    } = req.body;

    const userId = req.user.userId;

    // Validate basic issue fields (without requiring dealId)
    const { isValid, errors } = validateIssuePayload({ title, description, priority, jiraProjectKey }, { partial: false });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the highlighted fields.',
        errors
      });
    }

    // Get user email for contact verification
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    const userEmail = users[0].email;

    let organizationId = null;
    let finalDealId = null;

    if (dealId) {
      // Deal-based issue: Validate deal exists and user has access to it
      const [deals] = await db.query(
        `SELECT d.id, d.organization_id, d.title, ds.name as stage_name
         FROM deals d
         INNER JOIN deal_stages ds ON d.stage_id = ds.id
         LEFT JOIN contacts_people cp ON d.contact_person_id = cp.id
         LEFT JOIN contacts_organizations co ON d.contact_org_id = co.id
         WHERE d.id = ? 
         AND (
           d.assigned_to_user_id = ? 
           OR cp.email = ?
           OR co.email = ?
         )`,
        [dealId, userId, userEmail, userEmail]
      );

      if (deals.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this deal or deal not found.',
          errors: {
            dealId: 'Select a valid deal you have access to.'
          }
        });
      }

      const deal = deals[0];

      // Check if deal is won
      if (deal.stage_name !== 'Won') {
        return res.status(400).json({
          success: false,
          message: 'Issues can only be created for won deals.',
          errors: {
            dealId: 'Issues can only be created for deals marked as Won.'
          }
        });
      }

      organizationId = deal.organization_id;
      finalDealId = dealId;
    } else if (requestedOrgId) {
      // General issue: Validate organization exists
      const [orgCheck] = await db.query(
        `SELECT id, name FROM organizations WHERE id = ?`,
        [requestedOrgId]
      );

      if (orgCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found.',
          errors: {
            organizationId: 'Select a valid organization.'
          }
        });
      }

      organizationId = requestedOrgId;
      finalDealId = null; // General issue - no deal
    } else {
      // Neither dealId nor organizationId provided
      return res.status(400).json({
        success: false,
        message: 'Please select a deal or an organization for the issue.',
        errors: {
          organizationId: 'Either a deal or an organization is required.'
        }
      });
    }

    let jiraTicketId = null;
    let jiraUrl = null;
    let finalJiraProjectKey = jiraProjectKey;

    // Create JIRA ticket if JIRA is configured
    if (jiraService.isConfigured()) {
      try {
        const jiraResult = await jiraService.createTicket({
          title,
          description,
          priority,
          projectKey: jiraProjectKey,
          dealId: finalDealId,
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

    // Create issue in database
    const [result] = await db.query(
      `INSERT INTO issues (organization_id, deal_id, title, description, status, priority, reporter_user_id, jira_project_key, jira_ticket_id, jira_url)
       VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`,
      [organizationId, finalDealId, title, description || null, priority, userId, finalJiraProjectKey || null, jiraTicketId || null, jiraUrl || null]
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
    console.error('Create client issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating issue.',
      error: error.message
    });
  }
};

module.exports = {
  getClientDeals,
  getClientIssues,
  getClientOverview,
  getClientOrganizations,
  createClientIssue
};

