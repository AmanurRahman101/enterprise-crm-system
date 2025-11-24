// JIRA Integration Service
const axios = require('axios');

class JiraService {
  constructor() {
    this.jiraUrl = process.env.JIRA_URL || 'https://your-domain.atlassian.net';
    this.jiraEmail = process.env.JIRA_EMAIL;
    this.jiraApiToken = process.env.JIRA_API_TOKEN;
    this.jiraProjectKey = process.env.JIRA_PROJECT_KEY || 'CRM';
    
    // Base64 encode credentials for Basic Auth
    if (this.jiraEmail && this.jiraApiToken) {
      this.authHeader = `Basic ${Buffer.from(`${this.jiraEmail}:${this.jiraApiToken}`).toString('base64')}`;
    }
  }

  /**
   * Check if JIRA is configured
   */
  isConfigured() {
    return !!(this.jiraUrl && this.jiraEmail && this.jiraApiToken);
  }

  /**
   * Create a JIRA ticket
   * @param {Object} issueData - Issue data from CRM
   * @returns {Promise<Object>} JIRA ticket details
   */
  async createTicket(issueData) {
    if (!this.isConfigured()) {
      throw new Error('JIRA is not configured. Please set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN in environment variables.');
    }

    try {
      const payload = {
        fields: {
          project: {
            key: issueData.projectKey || this.jiraProjectKey
          },
          summary: issueData.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: issueData.description || 'No description provided'
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: issueData.issueType || 'Bug'
          },
          priority: {
            name: this.mapPriority(issueData.priority)
          }
        }
      };

      // Add assignee if provided
      if (issueData.assigneeEmail) {
        payload.fields.assignee = {
          emailAddress: issueData.assigneeEmail
        };
      }

      // Add custom fields if needed
      if (issueData.dealId) {
        payload.fields.customfield_10000 = `Deal ID: ${issueData.dealId}`;
      }

      const response = await axios.post(
        `${this.jiraUrl}/rest/api/3/issue`,
        payload,
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        ticketId: response.data.key,
        ticketUrl: `${this.jiraUrl}/browse/${response.data.key}`,
        jiraId: response.data.id,
        data: response.data
      };

    } catch (error) {
      console.error('JIRA create ticket error:', error.response?.data || error.message);
      throw new Error(`Failed to create JIRA ticket: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Update a JIRA ticket
   * @param {String} ticketKey - JIRA ticket key (e.g., CRM-123)
   * @param {Object} updates - Fields to update
   */
  async updateTicket(ticketKey, updates) {
    if (!this.isConfigured()) {
      throw new Error('JIRA is not configured.');
    }

    try {
      const payload = {
        fields: {}
      };

      if (updates.title) {
        payload.fields.summary = updates.title;
      }

      if (updates.description) {
        payload.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description
                }
              ]
            }
          ]
        };
      }

      if (updates.status) {
        // Use transitions API for status changes
        await this.transitionTicket(ticketKey, updates.status);
      }

      if (updates.priority) {
        payload.fields.priority = {
          name: this.mapPriority(updates.priority)
        };
      }

      if (Object.keys(payload.fields).length > 0) {
        await axios.put(
          `${this.jiraUrl}/rest/api/3/issue/${ticketKey}`,
          payload,
          {
            headers: {
              'Authorization': this.authHeader,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      return { success: true };

    } catch (error) {
      console.error('JIRA update ticket error:', error.response?.data || error.message);
      throw new Error(`Failed to update JIRA ticket: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Transition a JIRA ticket to a new status
   * @param {String} ticketKey - JIRA ticket key
   * @param {String} status - CRM status
   */
  async transitionTicket(ticketKey, status) {
    if (!this.isConfigured()) {
      return;
    }

    try {
      // Get available transitions
      const transitionsResponse = await axios.get(
        `${this.jiraUrl}/rest/api/3/issue/${ticketKey}/transitions`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json'
          }
        }
      );

      const transitions = transitionsResponse.data.transitions;
      const targetTransitionName = this.mapStatusToJira(status);
      
      const transition = transitions.find(t => 
        t.name.toLowerCase() === targetTransitionName.toLowerCase()
      );

      if (transition) {
        await axios.post(
          `${this.jiraUrl}/rest/api/3/issue/${ticketKey}/transitions`,
          {
            transition: {
              id: transition.id
            }
          },
          {
            headers: {
              'Authorization': this.authHeader,
              'Content-Type': 'application/json'
            }
          }
        );
      }

    } catch (error) {
      console.error('JIRA transition error:', error.response?.data || error.message);
    }
  }

  /**
   * Get JIRA ticket details
   * @param {String} ticketKey - JIRA ticket key
   */
  async getTicket(ticketKey) {
    if (!this.isConfigured()) {
      throw new Error('JIRA is not configured.');
    }

    try {
      const response = await axios.get(
        `${this.jiraUrl}/rest/api/3/issue/${ticketKey}`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        ticket: response.data
      };

    } catch (error) {
      console.error('JIRA get ticket error:', error.response?.data || error.message);
      throw new Error(`Failed to get JIRA ticket: ${error.message}`);
    }
  }

  /**
   * Map CRM priority to JIRA priority
   * @param {String} priority - CRM priority (low, medium, high, critical)
   * @returns {String} JIRA priority
   */
  mapPriority(priority) {
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Highest'
    };
    return priorityMap[priority?.toLowerCase()] || 'Medium';
  }

  /**
   * Map CRM status to JIRA status
   * @param {String} status - CRM status
   * @returns {String} JIRA status
   */
  mapStatusToJira(status) {
    const statusMap = {
      'open': 'To Do',
      'in_progress': 'In Progress',
      'resolved': 'Done',
      'closed': 'Done'
    };
    return statusMap[status] || 'To Do';
  }

  /**
   * Map JIRA status to CRM status
   * @param {String} jiraStatus - JIRA status
   * @returns {String} CRM status
   */
  mapStatusFromJira(jiraStatus) {
    const statusMap = {
      'to do': 'open',
      'in progress': 'in_progress',
      'done': 'resolved',
      'closed': 'closed'
    };
    return statusMap[jiraStatus?.toLowerCase()] || 'open';
  }
}

module.exports = new JiraService();
