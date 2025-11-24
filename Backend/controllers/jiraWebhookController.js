// JIRA Webhook Controller
const db = require('../db/connection');
const jiraService = require('../services/jiraService');

/**
 * Handle JIRA webhook events
 * This endpoint receives webhooks from JIRA when issues are updated
 */
const handleJiraWebhook = async (req, res) => {
  try {
    const { webhookEvent, issue, changelog } = req.body;

    if (!issue || !issue.key) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload'
      });
    }

    const jiraTicketId = issue.key;

    // Find the corresponding issue in our database
    const [issues] = await db.query(
      'SELECT id, organization_id, status FROM issues WHERE jira_ticket_id = ?',
      [jiraTicketId]
    );

    if (issues.length === 0) {
      // Issue not found in our database, ignore
      return res.status(200).json({
        success: true,
        message: 'Issue not found in CRM'
      });
    }

    const localIssue = issues[0];
    const updates = [];
    const values = [];

    // Handle different webhook events
    switch (webhookEvent) {
      case 'jira:issue_updated':
        // Check what changed
        if (changelog && changelog.items) {
          for (const item of changelog.items) {
            switch (item.field) {
              case 'status':
                const newStatus = jiraService.mapStatusFromJira(item.toString);
                if (newStatus && newStatus !== localIssue.status) {
                  updates.push('status = ?');
                  values.push(newStatus);
                }
                break;
              
              case 'priority':
                updates.push('priority = ?');
                values.push(item.toString.toLowerCase());
                break;

              case 'summary':
                if (issue.fields && issue.fields.summary) {
                  updates.push('title = ?');
                  values.push(issue.fields.summary);
                }
                break;

              case 'description':
                if (issue.fields && issue.fields.description) {
                  // Extract plain text from JIRA ADF format
                  const description = extractTextFromADF(issue.fields.description);
                  updates.push('description = ?');
                  values.push(description);
                }
                break;
            }
          }
        }
        break;

      case 'jira:issue_deleted':
        // Optionally handle ticket deletion
        updates.push('jira_ticket_id = NULL, jira_url = NULL');
        break;
    }

    // Update the issue if there are changes
    if (updates.length > 0) {
      values.push(localIssue.id);
      await db.query(
        `UPDATE issues SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
      );

      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`org_${localIssue.organization_id}`).emit('issue_updated', {
          issueId: localIssue.id,
          jiraTicketId,
          changes: updates
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('JIRA webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

/**
 * Extract plain text from JIRA's Atlassian Document Format (ADF)
 * @param {Object} adf - Atlassian Document Format object
 * @returns {String} Plain text
 */
function extractTextFromADF(adf) {
  if (!adf || !adf.content) {
    return '';
  }

  let text = '';
  
  function traverse(node) {
    if (node.type === 'text') {
      text += node.text;
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  adf.content.forEach(traverse);
  return text.trim();
}

module.exports = {
  handleJiraWebhook
};
