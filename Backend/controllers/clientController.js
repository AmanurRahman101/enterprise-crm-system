// Client Portal Controller (for user_type='client')
const db = require('../db/connection');
const { verifyToken, isClient } = require('../middleware/auth');

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

    if (contactPersonIds.length === 0 && contactOrgIds.length === 0) {
      return res.status(200).json({
        success: true,
        deals: []
      });
    }

    // Build query to get deals where client is a contact
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
      WHERE (d.contact_person_id IN (${contactPersonIds.length > 0 ? contactPersonIds.join(',') : 'NULL'})
             OR d.contact_org_id IN (${contactOrgIds.length > 0 ? contactOrgIds.join(',') : 'NULL'}))
    `;

    const [deals] = await db.query(dealsQuery);

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

module.exports = {
  getClientDeals,
  getClientIssues,
  getClientOverview
};

