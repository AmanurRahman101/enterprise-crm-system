/**
 * MCP Server hookup for Tawasol CRM.
 * Exposes deterministic SQL tools over SSE for the Telegram host.
 * 
 * Two separate endpoints:
 * - /mcp/client/sse - Client mode tools (limited)
 * - /mcp/org/sse - Organization mode tools (full CRUD)
 */
const express = require('express');
const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const db = require('../db/connection');

// Endpoint paths
const MCP_CLIENT_SSE_PATH = '/mcp/client/sse';
const MCP_CLIENT_MESSAGES_PATH = '/mcp/client/messages';
const MCP_ORG_SSE_PATH = '/mcp/org/sse';
const MCP_ORG_MESSAGES_PATH = '/mcp/org/messages';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const baseUserSchema = {
  userId: z.number().int().positive().describe('User ID making the request')
};

const baseOrgSchema = {
  organizationId: z.number().int().positive().describe('Organization ID to scope the query')
};

// Role schema for permission checks
const roleSchema = z.enum(['owner', 'admin', 'manager', 'agent', 'viewer']).optional();

// Permission levels (higher = more access)
const ROLE_LEVELS = {
  viewer: 1,
  agent: 2,
  manager: 3,
  admin: 4,
  owner: 5
};

/**
 * Check if a role has permission to perform an action
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
function hasPermission(userRole, requiredRole = 'agent') {
  const userLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Format permission denied error
 */
function formatPermissionError(action, userRole) {
  return {
    content: [
      {
        type: 'text',
        text: `🚫 Permission denied: Your role (${userRole || 'unknown'}) cannot ${action}. Please contact an admin for access.`
      }
    ]
  };
}

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_LIMIT)
  .describe(`Maximum number of rows to return (1-${MAX_LIMIT})`)
  .optional();

const CURRENCY_REGEX = /^[A-Z]{3}$/;
const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const sanitizeCurrency = (value) => {
  if (!value) return 'USD';
  const upper = value.toUpperCase();
  return CURRENCY_REGEX.test(upper) ? upper : 'USD';
};

// ============================================================
// CLIENT MODE MCP SERVER
// Limited tools for clients viewing their deals/issues
// ============================================================

function createClientMcpServer() {
  const server = new McpServer(
    {
      name: 'tawasol-crm-client-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  registerClientTools(server);
  return server;
}

function registerClientTools(server) {
  // List organizations (for creating issues)
  server.tool(
    'listOrganizations',
    'List all organizations available for reporting issues. Use this to find organization IDs when creating issues.',
    {
      ...baseUserSchema,
      search: z.string().max(100).describe('Optional search term to filter by name').optional()
    },
    async ({ userId, search }) => {
      try {
        let sql = 'SELECT id, name FROM organizations';
        const params = [];
        
        if (search) {
          sql += ' WHERE name LIKE ?';
          params.push(`%${search.trim()}%`);
        }
        
        sql += ' ORDER BY name LIMIT 20';
        
        const [rows] = await db.query(sql, params);
        
        return formatTableResult(
          `Organizations (${rows.length})`,
          rows,
          ['id', 'name']
        );
      } catch (error) {
        return formatError(`Failed to list organizations: ${error.message}`);
      }
    }
  );

  // Query deals where user is a contact
  server.tool(
    'queryMyDeals',
    'List deals where you are listed as a contact. Shows deals from all organizations where you are a client.',
    {
      ...baseUserSchema,
      status: z.enum(['all', 'active', 'won', 'lost']).describe('Filter by deal status').optional(),
      limit: limitSchema
    },
    async ({ userId, status, limit }) => {
      try {
        const limitValue = clampLimit(limit);
        
        // Get user email for contact lookup
        const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
          return formatError('User not found.');
        }
        const userEmail = users[0].email;

        // Find contact IDs linked to this user's email
        const [contactPeople] = await db.query(
          'SELECT id, organization_id FROM contacts_people WHERE email = ?',
          [userEmail]
        );
        const [contactOrgs] = await db.query(
          'SELECT id, organization_id FROM contacts_organizations WHERE email = ?',
          [userEmail]
        );

        const contactPersonIds = contactPeople.map(cp => cp.id);
        const contactOrgIds = contactOrgs.map(co => co.id);

        if (contactPersonIds.length === 0 && contactOrgIds.length === 0) {
          return formatTableResult('My Deals (0)', [], ['id', 'title', 'value', 'stage', 'organization']);
        }

        let whereClause = `(
          d.contact_person_id IN (${contactPersonIds.length > 0 ? contactPersonIds.join(',') : 'NULL'})
          OR d.contact_org_id IN (${contactOrgIds.length > 0 ? contactOrgIds.join(',') : 'NULL'})
        )`;

        // Status filter
        if (status === 'won') {
          whereClause += ` AND ds.name = 'Won'`;
        } else if (status === 'lost') {
          whereClause += ` AND ds.name = 'Lost'`;
        } else if (status === 'active') {
          whereClause += ` AND ds.name NOT IN ('Won', 'Lost')`;
        }

        const [rows] = await db.query(
          `
            SELECT
              d.id,
              d.title,
              d.value,
              d.currency,
              ds.name AS stage,
              d.probability,
              o.name AS organizationName,
              DATE_FORMAT(d.updated_at, '%Y-%m-%d') AS updatedAt
            FROM deals d
            INNER JOIN deal_stages ds ON d.stage_id = ds.id
            INNER JOIN organizations o ON d.organization_id = o.id
            WHERE ${whereClause}
            ORDER BY d.updated_at DESC
            LIMIT ?
          `,
          [limitValue]
        );

        return formatTableResult(
          `My Deals (${rows.length})`,
          rows,
          ['id', 'title', 'value', 'currency', 'stage', 'probability', 'organizationName', 'updatedAt']
        );
      } catch (error) {
        return formatError(`Failed to query deals: ${error.message}`);
      }
    }
  );

  // Query issues reported by user
  server.tool(
    'queryMyIssues',
    'List issues you have reported. Shows issues from all organizations.',
    {
      ...baseUserSchema,
      status: z.enum(['all', ...ISSUE_STATUSES]).describe('Filter by issue status: all, open, in_progress, resolved, or closed').optional(),
      limit: limitSchema
    },
    async ({ userId, status, limit }) => {
      try {
        const limitValue = clampLimit(limit);
        const clauses = ['i.reporter_user_id = ?'];
        const params = [userId];

        if (status && status !== 'all') {
          clauses.push('i.status = ?');
          params.push(status);
        }

        const [rows] = await db.query(
          `
            SELECT
              i.id,
              i.title,
              i.status,
              i.priority,
              o.name AS organizationName,
              u.full_name AS assignedTo,
              DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updatedAt
            FROM issues i
            INNER JOIN organizations o ON i.organization_id = o.id
            LEFT JOIN users u ON i.assigned_to_user_id = u.id
            WHERE ${clauses.join(' AND ')}
            ORDER BY i.updated_at DESC
            LIMIT ?
          `,
          [...params, limitValue]
        );

        return formatTableResult(
          `My Issues (${rows.length})`,
          rows,
          ['id', 'title', 'status', 'priority', 'organizationName', 'assignedTo', 'updatedAt']
        );
      } catch (error) {
        return formatError(`Failed to query issues: ${error.message}`);
      }
    }
  );

  // Create issue as client
  server.tool(
    'createIssue',
    'Report a new issue or support request to an organization. IMPORTANT: Before creating, ask the user if this issue is related to a specific deal or is a general support request. If deal-related, ask for the deal ID. If general, leave dealId empty. Use listOrganizations first to find the organization ID.',
    {
      ...baseUserSchema,
      organizationId: z.number().int().positive().describe('Organization ID to report to (use listOrganizations to find)'),
      title: z.string().min(3).max(200).describe('Issue title'),
      description: z.string().max(5000).describe('Detailed description of the issue').optional(),
      priority: z.enum(ISSUE_PRIORITIES).describe('Issue priority').optional(),
      dealId: z.number().int().positive().describe('Related deal ID if this is a deal-based issue. Leave empty/null if this is a general support request.').optional()
    },
    async ({ userId, organizationId, title, description, priority = 'medium', dealId }) => {
      try {
        // Verify organization exists
        const [orgs] = await db.query('SELECT id, name FROM organizations WHERE id = ?', [organizationId]);
        if (orgs.length === 0) {
          return formatError('Organization not found. Use listOrganizations to find valid organization IDs.');
        }

        // If dealId provided, verify user has access to it
        if (dealId) {
          const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
          if (users.length === 0) {
            return formatError('User not found.');
          }
          const userEmail = users[0].email;

          const [deals] = await db.query(
            `SELECT d.id FROM deals d
             LEFT JOIN contacts_people cp ON d.contact_person_id = cp.id
             LEFT JOIN contacts_organizations co ON d.contact_org_id = co.id
             WHERE d.id = ? AND d.organization_id = ?
             AND (cp.email = ? OR co.email = ?)`,
            [dealId, organizationId, userEmail, userEmail]
          );

          if (deals.length === 0) {
            return formatError('You do not have access to this deal.');
          }
        }

        const [result] = await db.query(
          `INSERT INTO issues (organization_id, deal_id, title, description, status, priority, reporter_user_id)
           VALUES (?, ?, ?, ?, 'open', ?, ?)`,
          [organizationId, dealId || null, title.trim(), description || null, priority, userId]
        );

        return {
          content: [
            {
              type: 'text',
              text: `✅ Issue "${title}" created with ID ${result.insertId} for ${orgs[0].name}. The organization will be notified.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to create issue: ${error.message}`);
      }
    }
  );

  // Get issue details
  server.tool(
    'getIssueDetails',
    'Get detailed information about one of your issues.',
    {
      ...baseUserSchema,
      issueId: z.number().int().positive().describe('Issue ID to view')
    },
    async ({ userId, issueId }) => {
      try {
        const [rows] = await db.query(
          `SELECT i.*, o.name AS organization_name, u.full_name AS assigned_to_name
           FROM issues i
           INNER JOIN organizations o ON i.organization_id = o.id
           LEFT JOIN users u ON i.assigned_to_user_id = u.id
           WHERE i.id = ? AND i.reporter_user_id = ?`,
          [issueId, userId]
        );

        if (rows.length === 0) {
          return formatError('Issue not found or you do not have access to it.');
        }

        const issue = rows[0];
        const lines = [
          `📋 Issue #${issue.id}: ${issue.title}`,
          `Organization: ${issue.organization_name}`,
          `Status: ${issue.status}`,
          `Priority: ${issue.priority}`,
          `Assigned To: ${issue.assigned_to_name || 'Unassigned'}`,
          `Created: ${new Date(issue.created_at).toLocaleDateString()}`,
          `Updated: ${new Date(issue.updated_at).toLocaleDateString()}`,
          '',
          `Description: ${issue.description || 'No description provided.'}`
        ];

        return {
          content: [{ type: 'text', text: lines.join('\n') }]
        };
      } catch (error) {
        return formatError(`Failed to get issue details: ${error.message}`);
      }
    }
  );

  // Get client overview stats
  server.tool(
    'getMyStats',
    'Get an overview of your deals and issues across all organizations.',
    {
      ...baseUserSchema
    },
    async ({ userId }) => {
      try {
        const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
          return formatError('User not found.');
        }
        const userEmail = users[0].email;

        // Count deals
        const [contactPeople] = await db.query(
          'SELECT id FROM contacts_people WHERE email = ?',
          [userEmail]
        );
        const [contactOrgs] = await db.query(
          'SELECT id FROM contacts_organizations WHERE email = ?',
          [userEmail]
        );

        const contactPersonIds = contactPeople.map(cp => cp.id);
        const contactOrgIds = contactOrgs.map(co => co.id);

        let dealsCount = 0;
        let activeDealsCount = 0;
        let wonDealsValue = 0;

        if (contactPersonIds.length > 0 || contactOrgIds.length > 0) {
          const [dealStats] = await db.query(
            `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN ds.name NOT IN ('Won', 'Lost') THEN 1 ELSE 0 END) as active,
              SUM(CASE WHEN ds.name = 'Won' THEN d.value ELSE 0 END) as wonValue
             FROM deals d
             INNER JOIN deal_stages ds ON d.stage_id = ds.id
             WHERE d.contact_person_id IN (${contactPersonIds.length > 0 ? contactPersonIds.join(',') : 'NULL'})
                OR d.contact_org_id IN (${contactOrgIds.length > 0 ? contactOrgIds.join(',') : 'NULL'})`
          );
          dealsCount = dealStats[0].total || 0;
          activeDealsCount = dealStats[0].active || 0;
          wonDealsValue = dealStats[0].wonValue || 0;
        }

        // Count issues
        const [issueStats] = await db.query(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as open
           FROM issues WHERE reporter_user_id = ?`,
          [userId]
        );

        const lines = [
          '📊 Your Overview',
          '',
          `💼 Deals: ${dealsCount} total (${activeDealsCount} active)`,
          `💰 Won Value: ${formatCurrency(wonDealsValue)}`,
          `🎫 Issues: ${issueStats[0].total || 0} total (${issueStats[0].open || 0} open)`
        ];

        return {
          content: [{ type: 'text', text: lines.join('\n') }]
        };
      } catch (error) {
        return formatError(`Failed to get stats: ${error.message}`);
      }
    }
  );
}

// ============================================================
// ORGANIZATION MODE MCP SERVER
// Full CRUD tools for organization members
// ============================================================

function createOrgMcpServer() {
  const server = new McpServer(
    {
      name: 'tawasol-crm-org-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  registerOrgTools(server);
  return server;
}

function registerOrgTools(server) {
  // ==================== QUERY TOOLS ====================

  server.tool(
    'queryDeals',
    'List deals for the organization. Supports stage and value filters.',
    {
      ...baseOrgSchema,
      stageId: z.number().int().positive().describe('Optional stage ID filter').optional(),
      minValue: z.number().nonnegative().describe('Filter deals with value >= this amount').optional(),
      maxValue: z.number().nonnegative().describe('Filter deals with value <= this amount').optional(),
      limit: limitSchema,
      order: z
        .enum(['recent', 'value', 'probability'])
        .describe('Sort by latest updates, deal value, or probability')
        .optional()
    },
    async ({ organizationId, stageId, minValue, maxValue, limit, order }) => {
      try {
        const filters = ['organization_id = ?'];
        const params = [organizationId];

        if (typeof stageId === 'number') {
          filters.push('stage_id = ?');
          params.push(stageId);
        }
        if (typeof minValue === 'number') {
          filters.push('value >= ?');
          params.push(minValue);
        }
        if (typeof maxValue === 'number') {
          filters.push('value <= ?');
          params.push(maxValue);
        }

        const limitValue = clampLimit(limit);
        const orderBy =
          order === 'value'
            ? 'value DESC'
            : order === 'probability'
            ? 'probability DESC'
            : 'updated_at DESC';

        const [rows] = await db.query(
          `
            SELECT
              id,
              title,
              value,
              currency,
              stage_id AS stageId,
              probability,
              assigned_to_user_id AS ownerId,
              DATE_FORMAT(updated_at, '%Y-%m-%d') AS updatedAt
            FROM deals
            WHERE ${filters.join(' AND ')}
            ORDER BY ${orderBy}
            LIMIT ?
          `,
          [...params, limitValue]
        );

        return formatTableResult(
          `Deals (${rows.length})`,
          rows,
          ['id', 'title', 'value', 'currency', 'stageId', 'probability', 'ownerId', 'updatedAt']
        );
      } catch (error) {
        return formatError(`Failed to query deals: ${error.message}`);
      }
    }
  );

  server.tool(
    'queryContacts',
    'List contacts (people or organizations) for the org. Supports filtering by system/general contacts.',
    {
      ...baseOrgSchema,
      type: z
        .enum(['all', 'people', 'organizations'])
        .describe('Choose which contact set to return')
        .default('all'),
      contactCategory: z
        .enum(['all', 'system', 'general'])
        .describe('Filter by contact category: system (linked to user accounts) or general (external contacts)')
        .default('all'),
      search: z.string().min(1).max(255).describe('Case-insensitive search term').optional(),
      limit: limitSchema
    },
    async ({ organizationId, type, contactCategory, search, limit }) => {
      try {
        const limitValue = clampLimit(limit);
        const searchTerm = search ? `%${search.trim()}%` : null;
        const results = [];

        if (type !== 'organizations') {
          const peopleParams = [organizationId];
          let peopleSql = `
            SELECT
              cp.id,
              CONCAT(cp.first_name, ' ', cp.last_name) AS name,
              cp.email,
              cp.phone,
              cp.job_title AS extra,
              'person' AS contactType,
              CASE WHEN cp.user_id IS NOT NULL THEN 'system' ELSE 'general' END AS category,
              u.full_name AS linkedUserName,
              DATE_FORMAT(cp.updated_at, '%Y-%m-%d') AS updatedAt
            FROM contacts_people cp
            LEFT JOIN users u ON cp.user_id = u.id
            WHERE cp.organization_id = ?
          `;
          
          // Category filter
          if (contactCategory === 'system') {
            peopleSql += ' AND cp.user_id IS NOT NULL';
          } else if (contactCategory === 'general') {
            peopleSql += ' AND cp.user_id IS NULL';
          }
          
          if (searchTerm) {
            peopleSql += ` AND (cp.first_name LIKE ? OR cp.last_name LIKE ? OR cp.email LIKE ? OR cp.phone LIKE ?)`;
            peopleParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
          }
          peopleSql += ' ORDER BY cp.updated_at DESC LIMIT ?';
          peopleParams.push(limitValue);
          const [peopleRows] = await db.query(peopleSql, peopleParams);
          results.push(...peopleRows);
        }

        if (type !== 'people') {
          const orgParams = [organizationId];
          let orgSql = `
            SELECT
              co.id,
              co.name,
              co.email,
              co.phone,
              co.address AS extra,
              'organization' AS contactType,
              CASE WHEN co.linked_organization_id IS NOT NULL THEN 'system' ELSE 'general' END AS category,
              lo.name AS linkedOrgName,
              DATE_FORMAT(co.updated_at, '%Y-%m-%d') AS updatedAt
            FROM contacts_organizations co
            LEFT JOIN organizations lo ON co.linked_organization_id = lo.id
            WHERE co.organization_id = ?
          `;
          
          // Category filter
          if (contactCategory === 'system') {
            orgSql += ' AND co.linked_organization_id IS NOT NULL';
          } else if (contactCategory === 'general') {
            orgSql += ' AND co.linked_organization_id IS NULL';
          }
          
          if (searchTerm) {
            orgSql += ` AND (co.name LIKE ? OR co.email LIKE ? OR co.phone LIKE ?)`;
            orgParams.push(searchTerm, searchTerm, searchTerm);
          }
          orgSql += ' ORDER BY co.updated_at DESC LIMIT ?';
          orgParams.push(limitValue);
          const [orgRows] = await db.query(orgSql, orgParams);
          results.push(...orgRows);
        }

        const trimmed = results.slice(0, limitValue);
        return formatTableResult(
          `Contacts (${trimmed.length})`,
          trimmed,
          ['contactType', 'category', 'id', 'name', 'email', 'phone', 'extra', 'updatedAt']
        );
      } catch (error) {
        return formatError(`Failed to query contacts: ${error.message}`);
      }
    }
  );

  // Search system users (for linking contacts)
  server.tool(
    'searchSystemUsers',
    'Search for registered users in the system to link as contacts.',
    {
      ...baseOrgSchema,
      search: z.string().min(1).max(255).describe('Search by email or name'),
      limit: limitSchema
    },
    async ({ organizationId, search, limit }) => {
      try {
        const limitValue = clampLimit(limit);
        const searchTerm = `%${search.trim()}%`;

        const [rows] = await db.query(
          `SELECT id, email, full_name AS name, phone
           FROM users
           WHERE (email LIKE ? OR full_name LIKE ?)
           ORDER BY full_name
           LIMIT ?`,
          [searchTerm, searchTerm, limitValue]
        );

        return formatTableResult(
          `System Users (${rows.length})`,
          rows,
          ['id', 'name', 'email', 'phone']
        );
      } catch (error) {
        return formatError(`Failed to search users: ${error.message}`);
      }
    }
  );

  server.tool(
    'queryIssues',
    'List issues filtered by status/priority for the organization.',
    {
      ...baseOrgSchema,
      status: z.enum(['all', ...ISSUE_STATUSES]).describe('Filter by status: all, open, in_progress, resolved, or closed').optional(),
      priority: z.enum(['all', ...ISSUE_PRIORITIES]).describe('Filter by priority: all, low, medium, high, or critical').optional(),
      limit: limitSchema
    },
    async ({ organizationId, status, priority, limit }) => {
      try {
        const clauses = ['organization_id = ?'];
        const params = [organizationId];
        if (status && status !== 'all') {
          clauses.push('status = ?');
          params.push(status);
        }
        if (priority && priority !== 'all') {
          clauses.push('priority = ?');
          params.push(priority);
        }
        const limitValue = clampLimit(limit);
        const [rows] = await db.query(
          `
            SELECT
              id,
              title,
              status,
              priority,
              assigned_to_user_id AS ownerId,
              DATE_FORMAT(updated_at, '%Y-%m-%d') AS updatedAt
            FROM issues
            WHERE ${clauses.join(' AND ')}
            ORDER BY updated_at DESC
            LIMIT ?
          `,
          [...params, limitValue]
        );
        return formatTableResult(
          `Issues (${rows.length})`,
          rows,
          ['id', 'title', 'status', 'priority', 'ownerId', 'updatedAt']
        );
      } catch (error) {
        return formatError(`Failed to query issues: ${error.message}`);
      }
    }
  );

  server.tool(
    'getOrganizationStats',
    'Return pipeline totals, counts, and open work for the organization.',
    {
      ...baseOrgSchema
    },
    async ({ organizationId }) => {
      try {
        const [[dealStats]] = await db.query(
          `
            SELECT
              COUNT(*) AS totalDeals,
              SUM(value) AS totalValue,
              SUM(CASE WHEN probability >= 50 THEN value ELSE 0 END) AS forecastedValue
            FROM deals
            WHERE organization_id = ?
          `,
          [organizationId]
        );

        const [[issueStats]] = await db.query(
          `
            SELECT
              SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) AS openIssues,
              SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) AS criticalIssues
            FROM issues
            WHERE organization_id = ?
          `,
          [organizationId]
        );

        const [[contactStats]] = await db.query(
          `
            SELECT
              (SELECT COUNT(*) FROM contacts_people WHERE organization_id = ?) AS peopleCount,
              (SELECT COUNT(*) FROM contacts_people WHERE organization_id = ? AND user_id IS NOT NULL) AS systemPeopleCount,
              (SELECT COUNT(*) FROM contacts_organizations WHERE organization_id = ?) AS orgCount
          `,
          [organizationId, organizationId, organizationId]
        );

        const generalPeopleCount = (contactStats.peopleCount || 0) - (contactStats.systemPeopleCount || 0);

        const responseLines = [
          `Deals: ${dealStats.totalDeals || 0} (value ${formatCurrency(dealStats.totalValue)})`,
          `Forecast >=50%: ${formatCurrency(dealStats.forecastedValue)}`,
          `Contacts: ${contactStats.peopleCount || 0} people (${contactStats.systemPeopleCount || 0} system, ${generalPeopleCount} general) / ${contactStats.orgCount || 0} orgs`,
          `Issues: ${issueStats.openIssues || 0} open (${issueStats.criticalIssues || 0} critical)`
        ];

        return {
          content: [
            {
              type: 'text',
              text: responseLines.join('\n')
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to gather stats: ${error.message}`);
      }
    }
  );

  server.tool(
    'getDealStages',
    'List deal stages (with deal counts) for the organization.',
    {
      ...baseOrgSchema
    },
    async ({ organizationId }) => {
      try {
        const [rows] = await db.query(
          `
            SELECT
              ds.id,
              ds.name,
              ds.order_index AS orderIndex,
              ds.default_probability AS defaultProbability,
              COUNT(d.id) AS dealCount
            FROM deal_stages ds
            LEFT JOIN deals d
              ON d.stage_id = ds.id AND d.organization_id = ?
            GROUP BY ds.id, ds.name, ds.order_index, ds.default_probability
            ORDER BY ds.order_index ASC
          `,
          [organizationId]
        );

        return formatTableResult(
          `Deal Stages (${rows.length})`,
          rows,
          ['id', 'name', 'orderIndex', 'defaultProbability', 'dealCount']
        );
      } catch (error) {
        return formatError(`Failed to list stages: ${error.message}`);
      }
    }
  );

  // ==================== DEAL MUTATIONS ====================

  server.tool(
    'createDeal',
    'Create a new deal for this organization. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      creatorEmail: z.string().email().describe('Email of the user creating the deal'),
      title: z.string().min(3).max(150).describe('Deal title'),
      stageId: z.number().int().positive().describe('Deal stage ID'),
      value: z.number().nonnegative().describe('Deal value').optional(),
      currency: z.string().min(3).max(3).describe('Currency (ISO code)').optional(),
      contactPersonId: z.number().int().positive().describe('Existing contact person ID').optional(),
      contactOrgId: z.number().int().positive().describe('Existing contact organization ID').optional(),
      assignedToEmail: z.string().email().describe('Email of user to assign the deal to').optional(),
      expectedCloseDate: z.string().describe('Expected close date (YYYY-MM-DD)').optional(),
      probability: z.number().int().min(0).max(100).describe('Probability in percent').optional(),
      notes: z.string().max(2000).describe('Internal notes').optional()
    },
    async (args) => {
      try {
        const {
          organizationId,
          userRole,
          creatorEmail,
          title,
          stageId,
          value,
          currency,
          contactPersonId,
          contactOrgId,
          assignedToEmail,
          expectedCloseDate,
          probability,
          notes
        } = args;

        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('create deals', userRole);
        }

        // Verify creator is in org
        await resolveOrgUser(organizationId, { email: creatorEmail });

        const stage = await ensureStage(stageId);
        if (contactPersonId) {
          await ensureContactPerson(organizationId, contactPersonId);
        }
        if (contactOrgId) {
          await ensureContactOrg(organizationId, contactOrgId);
        }

        let assignedUserId = null;
        if (assignedToEmail) {
          const assignedUser = await resolveOrgUser(organizationId, {
            email: assignedToEmail,
            required: false
          });
          assignedUserId = assignedUser?.id || null;
        }

        if (expectedCloseDate) {
          const parsed = Date.parse(expectedCloseDate);
          if (Number.isNaN(parsed)) {
            throw new Error('Expected close date must be a valid date (YYYY-MM-DD).');
          }
        }

        const finalProbability = normalizeProbability(probability, stage.default_probability || 0);
        const finalCurrency = sanitizeCurrency(currency || 'USD');

        const [result] = await db.query(
          `INSERT INTO deals (organization_id, title, value, currency, stage_id, contact_person_id, contact_org_id, assigned_to_user_id, expected_close_date, probability, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            organizationId,
            title.trim(),
            value ?? null,
            finalCurrency,
            stageId,
            contactPersonId || null,
            contactOrgId || null,
            assignedUserId,
            expectedCloseDate || null,
            finalProbability,
            notes || null
          ]
        );

        return {
          content: [
            {
              type: 'text',
              text: `✅ Deal "${title}" created with ID ${result.insertId} (probability ${finalProbability}%).`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to create deal: ${error.message}`);
      }
    }
  );

  server.tool(
    'updateDeal',
    'Update fields on an existing deal. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      dealId: z.number().int().positive().describe('Deal ID to update'),
      title: z.string().min(3).max(150).optional(),
      value: z.number().nonnegative().optional(),
      currency: z.string().min(3).max(3).optional(),
      stageId: z.number().int().positive().optional(),
      contactPersonId: z.number().int().positive().optional(),
      contactOrgId: z.number().int().positive().optional(),
      assignedToEmail: z.string().email().optional(),
      expectedCloseDate: z.string().optional(),
      probability: z.number().int().min(0).max(100).optional(),
      notes: z.string().max(2000).optional()
    },
    async (args) => {
      try {
        const {
          organizationId,
          userRole,
          dealId,
          title,
          value,
          currency,
          stageId,
          contactPersonId,
          contactOrgId,
          assignedToEmail,
          expectedCloseDate,
          probability,
          notes
        } = args;

        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('update deals', userRole);
        }

        const existingDeal = await ensureDeal(organizationId, dealId);
        let finalProbability = existingDeal.probability;
        const updates = [];
        const params = [];

        if (title !== undefined) {
          updates.push('title = ?');
          params.push(title.trim());
        }
        if (value !== undefined) {
          updates.push('value = ?');
          params.push(value ?? null);
        }
        if (currency !== undefined) {
          updates.push('currency = ?');
          params.push(sanitizeCurrency(currency));
        }
        if (stageId !== undefined) {
          const stage = await ensureStage(stageId);
          updates.push('stage_id = ?');
          params.push(stageId);
          finalProbability = normalizeProbability(
            probability !== undefined ? probability : stage.default_probability,
            stage.default_probability || existingDeal.probability
          );
          updates.push('probability = ?');
          params.push(finalProbability);
        } else if (probability !== undefined) {
          finalProbability = normalizeProbability(probability, existingDeal.probability);
          updates.push('probability = ?');
          params.push(finalProbability);
        }
        if (contactPersonId !== undefined) {
          if (contactPersonId) {
            await ensureContactPerson(organizationId, contactPersonId);
          }
          updates.push('contact_person_id = ?');
          params.push(contactPersonId || null);
        }
        if (contactOrgId !== undefined) {
          if (contactOrgId) {
            await ensureContactOrg(organizationId, contactOrgId);
          }
          updates.push('contact_org_id = ?');
          params.push(contactOrgId || null);
        }
        if (assignedToEmail !== undefined) {
          if (assignedToEmail) {
            const assigned = await resolveOrgUser(organizationId, {
              email: assignedToEmail,
              required: false
            });
            updates.push('assigned_to_user_id = ?');
            params.push(assigned?.id || null);
          } else {
            updates.push('assigned_to_user_id = ?');
            params.push(null);
          }
        }
        if (expectedCloseDate !== undefined) {
          if (expectedCloseDate) {
            const parsed = Date.parse(expectedCloseDate);
            if (Number.isNaN(parsed)) {
              throw new Error('Expected close date must be a valid date (YYYY-MM-DD).');
            }
          }
          updates.push('expected_close_date = ?');
          params.push(expectedCloseDate || null);
        }
        if (notes !== undefined) {
          updates.push('notes = ?');
          params.push(notes || null);
        }

        if (updates.length === 0) {
          throw new Error('No fields were provided to update.');
        }

        params.push(dealId, organizationId);
        await db.query(
          `UPDATE deals SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`,
          params
        );

        return {
          content: [
            {
              type: 'text',
              text: `✅ Deal ${dealId} updated successfully.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to update deal: ${error.message}`);
      }
    }
  );

  server.tool(
    'deleteDeal',
    'Delete a deal from this organization. Requires manager role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      dealId: z.number().int().positive().describe('Deal ID to delete')
    },
    async ({ organizationId, userRole, dealId }) => {
      try {
        // Permission check - require at least manager role for deletion
        if (!hasPermission(userRole, 'manager')) {
          return formatPermissionError('delete deals', userRole);
        }

        await ensureDeal(organizationId, dealId);
        await db.query(
          'DELETE FROM deals WHERE id = ? AND organization_id = ?',
          [dealId, organizationId]
        );
        return {
          content: [
            {
              type: 'text',
              text: `🗑️ Deal ${dealId} deleted.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to delete deal: ${error.message}`);
      }
    }
  );

  // ==================== ISSUE MUTATIONS ====================
  // Note: createIssue is NOT available in organization mode
  // Issues can only be created by clients in Client Portal mode

  server.tool(
    'updateIssue',
    'Update fields on an existing issue. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      issueId: z.number().int().positive().describe('Issue ID to update'),
      title: z.string().min(3).max(200).optional(),
      description: z.string().max(5000).optional(),
      status: z.enum(ISSUE_STATUSES).optional(),
      priority: z.enum(ISSUE_PRIORITIES).optional(),
      assignedToEmail: z.string().email().optional()
    },
    async ({ organizationId, userRole, issueId, title, description, status, priority, assignedToEmail }) => {
      try {
        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('update issues', userRole);
        }

        await ensureIssue(organizationId, issueId);
        const updates = [];
        const params = [];
        if (title !== undefined) {
          updates.push('title = ?');
          params.push(title.trim());
        }
        if (description !== undefined) {
          updates.push('description = ?');
          params.push(description || null);
        }
        if (status !== undefined) {
          updates.push('status = ?');
          params.push(status);
        }
        if (priority !== undefined) {
          updates.push('priority = ?');
          params.push(priority);
        }
        if (assignedToEmail !== undefined) {
          if (assignedToEmail) {
            const assigned = await resolveOrgUser(organizationId, {
              email: assignedToEmail,
              required: false
            });
            updates.push('assigned_to_user_id = ?');
            params.push(assigned?.id || null);
          } else {
            updates.push('assigned_to_user_id = ?');
            params.push(null);
          }
        }
        if (updates.length === 0) {
          throw new Error('No fields were provided to update.');
        }
        params.push(issueId, organizationId);
        await db.query(`UPDATE issues SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`, params);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Issue ${issueId} updated successfully.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to update issue: ${error.message}`);
      }
    }
  );

  server.tool(
    'deleteIssue',
    'Delete an issue from this organization. Requires manager role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      issueId: z.number().int().positive().describe('Issue ID to delete')
    },
    async ({ organizationId, userRole, issueId }) => {
      try {
        // Permission check - require at least manager role for deletion
        if (!hasPermission(userRole, 'manager')) {
          return formatPermissionError('delete issues', userRole);
        }

        await ensureIssue(organizationId, issueId);
        await db.query(
          'DELETE FROM issues WHERE id = ? AND organization_id = ?',
          [issueId, organizationId]
        );
        return {
          content: [
            { type: 'text', text: `🗑️ Issue ${issueId} deleted.` }
          ]
        };
      } catch (error) {
        return formatError(`Failed to delete issue: ${error.message}`);
      }
    }
  );

  // ==================== CONTACT MUTATIONS ====================

  server.tool(
    'createContactPerson',
    'Create a new person contact. Can be a general contact (external) or linked to a system user. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      creatorEmail: z.string().email().describe('Email of the CRM user creating this contact'),
      firstName: z.string().min(1).max(100).describe('Contact first name'),
      lastName: z.string().max(100).describe('Contact last name').optional(),
      email: z.string().email().describe('Contact email address'),
      phone: z.string().max(50).describe('Contact phone number').optional(),
      jobTitle: z.string().max(150).describe('Contact job title').optional(),
      notes: z.string().max(2000).describe('Notes about the contact').optional(),
      linkToSystemUser: z.boolean().describe('If true, automatically link to system user if email matches').optional()
    },
    async ({ organizationId, userRole, creatorEmail, firstName, lastName, email, phone, jobTitle, notes, linkToSystemUser }) => {
      try {
        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('create contacts', userRole);
        }

        const creator = await resolveOrgUser(organizationId, { email: creatorEmail });
        const cleanedEmail = email.toLowerCase();
        
        // Check if contact already exists in this org
        const [existing] = await db.query(
          'SELECT id FROM contacts_people WHERE organization_id = ? AND email = ?',
          [organizationId, cleanedEmail]
        );
        if (existing.length > 0) {
          throw new Error('A contact with this email already exists in the organization.');
        }

        // Check if we should link to a system user
        let linkedUserId = null;
        let linkedUserName = null;
        if (linkToSystemUser !== false) {
          // By default, try to link if email matches a system user
          const [systemUsers] = await db.query(
            'SELECT id, full_name FROM users WHERE LOWER(email) = ?',
            [cleanedEmail]
          );
          if (systemUsers.length > 0) {
            linkedUserId = systemUsers[0].id;
            linkedUserName = systemUsers[0].full_name;
          }
        }

        const [result] = await db.query(
          `INSERT INTO contacts_people (organization_id, user_id, first_name, last_name, email, phone, job_title, notes, created_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            organizationId,
            linkedUserId,
            firstName.trim(),
            lastName?.trim() || '',
            cleanedEmail,
            phone || null,
            jobTitle || null,
            notes || null,
            creator.id
          ]
        );

        const categoryText = linkedUserId 
          ? `system contact (linked to ${linkedUserName})`
          : 'general contact (external)';

        return {
          content: [
            {
              type: 'text',
              text: `✅ Contact "${firstName} ${lastName || ''}" created with ID ${result.insertId} as ${categoryText}.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to create contact person: ${error.message}`);
      }
    }
  );

  server.tool(
    'linkContactToUser',
    'Link an existing general contact to a system user account. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      contactPersonId: z.number().int().positive().describe('Contact person ID to link'),
      systemUserId: z.number().int().positive().describe('System user ID to link to (use searchSystemUsers to find)')
    },
    async ({ organizationId, userRole, contactPersonId, systemUserId }) => {
      try {
        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('link contacts to users', userRole);
        }

        // Verify contact exists
        const contact = await ensureContactPerson(organizationId, contactPersonId);
        
        if (contact.user_id) {
          throw new Error('This contact is already linked to a system user.');
        }

        // Verify system user exists
        const [users] = await db.query('SELECT id, full_name, email FROM users WHERE id = ?', [systemUserId]);
        if (users.length === 0) {
          throw new Error('System user not found.');
        }

        const systemUser = users[0];

        // Link the contact
        await db.query(
          'UPDATE contacts_people SET user_id = ? WHERE id = ? AND organization_id = ?',
          [systemUserId, contactPersonId, organizationId]
        );

        return {
          content: [
            {
              type: 'text',
              text: `✅ Contact ${contactPersonId} linked to system user "${systemUser.full_name}" (${systemUser.email}).`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to link contact: ${error.message}`);
      }
    }
  );

  server.tool(
    'unlinkContactFromUser',
    'Unlink a system contact, converting it to a general contact. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      contactPersonId: z.number().int().positive().describe('Contact person ID to unlink')
    },
    async ({ organizationId, userRole, contactPersonId }) => {
      try {
        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('unlink contacts from users', userRole);
        }

        const contact = await ensureContactPerson(organizationId, contactPersonId);
        
        if (!contact.user_id) {
          throw new Error('This contact is not linked to a system user.');
        }

        await db.query(
          'UPDATE contacts_people SET user_id = NULL WHERE id = ? AND organization_id = ?',
          [contactPersonId, organizationId]
        );

        return {
          content: [
            {
              type: 'text',
              text: `✅ Contact ${contactPersonId} unlinked from system user. It is now a general contact.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to unlink contact: ${error.message}`);
      }
    }
  );

  server.tool(
    'updateContactPerson',
    'Update an existing contact person. Requires agent role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      contactPersonId: z.number().int().positive().describe('Contact person ID'),
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      jobTitle: z.string().max(150).optional(),
      notes: z.string().max(2000).optional()
    },
    async ({ organizationId, userRole, contactPersonId, firstName, lastName, email, phone, jobTitle, notes }) => {
      try {
        // Permission check - require at least agent role
        if (!hasPermission(userRole, 'agent')) {
          return formatPermissionError('update contacts', userRole);
        }

        await ensureContactPerson(organizationId, contactPersonId);
        const updates = [];
        const params = [];
        if (firstName !== undefined) {
          updates.push('first_name = ?');
          params.push(firstName.trim());
        }
        if (lastName !== undefined) {
          updates.push('last_name = ?');
          params.push(lastName?.trim() || '');
        }
        if (email !== undefined) {
          const cleaned = email.toLowerCase();
          const [existing] = await db.query(
            'SELECT id FROM contacts_people WHERE organization_id = ? AND email = ? AND id <> ?',
            [organizationId, cleaned, contactPersonId]
          );
          if (existing.length > 0) {
            throw new Error('Another contact already uses that email.');
          }
          updates.push('email = ?');
          params.push(cleaned);
        }
        if (phone !== undefined) {
          updates.push('phone = ?');
          params.push(phone || null);
        }
        if (jobTitle !== undefined) {
          updates.push('job_title = ?');
          params.push(jobTitle || null);
        }
        if (notes !== undefined) {
          updates.push('notes = ?');
          params.push(notes || null);
        }
        if (updates.length === 0) {
          throw new Error('No fields were provided to update.');
        }
        params.push(contactPersonId, organizationId);
        await db.query(
          `UPDATE contacts_people SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`,
          params
        );
        return {
          content: [
            {
              type: 'text',
              text: `✅ Contact person ${contactPersonId} updated.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to update contact person: ${error.message}`);
      }
    }
  );

  server.tool(
    'deleteContactPerson',
    'Delete a contact person from this organization. Requires manager role or higher.',
    {
      ...baseOrgSchema,
      userRole: roleSchema.describe('Role of the user making the request'),
      contactPersonId: z.number().int().positive().describe('Contact person ID')
    },
    async ({ organizationId, userRole, contactPersonId }) => {
      try {
        // Permission check - require at least manager role for deletion
        if (!hasPermission(userRole, 'manager')) {
          return formatPermissionError('delete contacts', userRole);
        }

        await ensureContactPerson(organizationId, contactPersonId);
        await db.query(
          'DELETE FROM contacts_people WHERE id = ? AND organization_id = ?',
          [contactPersonId, organizationId]
        );
        return {
          content: [
            {
              type: 'text',
              text: `🗑️ Contact person ${contactPersonId} deleted.`
            }
          ]
        };
      } catch (error) {
        return formatError(`Failed to delete contact person: ${error.message}`);
      }
    }
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function clampLimit(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(value)));
}

function formatCurrency(value) {
  if (!value) {
    return '$0.00';
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return `$${numeric.toFixed(2)}`;
}

function formatTableResult(title, rows, fields) {
  if (!rows || rows.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `${title}: no data found.`
        }
      ]
    };
  }

  const headers = fields.map(key => key);
  const lines = [headers.join(' | ')];
  rows.forEach(row => {
    const cells = fields.map(field => {
      const value = row[field];
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      return String(value);
    });
    lines.push(cells.join(' | '));
  });

  return {
    content: [
      {
        type: 'text',
        text: `${title}\n${lines.join('\n')}`
      }
    ]
  };
}

function formatError(message) {
  return {
    content: [
      {
        type: 'text',
        text: `❌ Error: ${message}`
      }
    ],
    isError: true
  };
}

async function ensureStage(stageId) {
  const [rows] = await db.query(
    'SELECT id, default_probability FROM deal_stages WHERE id = ?',
    [stageId]
  );
  if (rows.length === 0) {
    throw new Error('Invalid deal stage.');
  }
  return rows[0];
}

async function ensureDeal(organizationId, dealId) {
  const [rows] = await db.query(
    'SELECT * FROM deals WHERE id = ? AND organization_id = ?',
    [dealId, organizationId]
  );
  if (rows.length === 0) {
    throw new Error('Deal not found in this organization.');
  }
  return rows[0];
}

async function ensureIssue(organizationId, issueId) {
  const [rows] = await db.query(
    'SELECT * FROM issues WHERE id = ? AND organization_id = ?',
    [issueId, organizationId]
  );
  if (rows.length === 0) {
    throw new Error('Issue not found in this organization.');
  }
  return rows[0];
}

async function ensureContactPerson(organizationId, contactPersonId) {
  const [rows] = await db.query(
    'SELECT * FROM contacts_people WHERE id = ? AND organization_id = ?',
    [contactPersonId, organizationId]
  );
  if (rows.length === 0) {
    throw new Error('Contact person not found in this organization.');
  }
  return rows[0];
}

async function ensureContactOrg(organizationId, contactOrgId) {
  const [rows] = await db.query(
    'SELECT id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
    [contactOrgId, organizationId]
  );
  if (rows.length === 0) {
    throw new Error('Contact organization not found in this organization.');
  }
  return rows[0];
}

async function resolveOrgUser(organizationId, { email, required = true }) {
  if (!email) {
    if (required) {
      throw new Error('Please provide a user email for this action.');
    }
    return null;
  }
  const normalized = email.toLowerCase();
  const [rows] = await db.query(
    'SELECT u.id, u.email, u.full_name FROM users u INNER JOIN user_organizations uo ON u.id = uo.user_id WHERE LOWER(u.email) = ? AND uo.organization_id = ?',
    [normalized, organizationId]
  );
  if (rows.length === 0) {
    if (required) {
      throw new Error('No user with that email belongs to this organization.');
    }
    return null;
  }
  return rows[0];
}

function normalizeProbability(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    throw new Error('Probability must be a number.');
  }
  if (numeric < 0 || numeric > 100) {
    throw new Error('Probability must be between 0 and 100.');
  }
  return Math.round(numeric);
}

// ============================================================
// MOUNT MCP SERVERS
// ============================================================

/**
 * Mount both Client and Org MCP SSE + message endpoints onto an existing Express app.
 */
function mountMcpServer(app) {
  if (!app || typeof app.get !== 'function') {
    throw new Error('mountMcpServer expects an Express application instance.');
  }

  const clientSessions = new Map();
  const orgSessions = new Map();

  // CLIENT MODE ENDPOINT
  app.get(MCP_CLIENT_SSE_PATH, async (req, res) => {
    const transport = new SSEServerTransport(MCP_CLIENT_MESSAGES_PATH, res);
    const server = createClientMcpServer();
    const sessionId = transport.sessionId;
    clientSessions.set(sessionId, { transport, server });

    transport.onclose = () => {
      // Just clean up the session - don't call server.close() as it would trigger transport.close() again (infinite loop)
      clientSessions.delete(sessionId);
      console.log(`[MCP-Client] SSE session closed (${sessionId})`);
    };

    try {
      await server.connect(transport);
      console.log(`[MCP-Client] SSE session established (${sessionId})`);
    } catch (error) {
      clientSessions.delete(sessionId);
      console.error('[MCP-Client] Failed to start SSE session:', error);
      if (!res.headersSent) {
        res.status(500).end('Failed to start MCP session');
      }
    }
  });

  app.post(MCP_CLIENT_MESSAGES_PATH, async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const session = clientSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error(`[MCP-Client] Failed to handle POST for session ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to handle MCP message' });
      }
    }
  });

  // ORGANIZATION MODE ENDPOINT
  app.get(MCP_ORG_SSE_PATH, async (req, res) => {
    const transport = new SSEServerTransport(MCP_ORG_MESSAGES_PATH, res);
    const server = createOrgMcpServer();
    const sessionId = transport.sessionId;
    orgSessions.set(sessionId, { transport, server });

    transport.onclose = () => {
      // Just clean up the session - don't call server.close() as it would trigger transport.close() again (infinite loop)
      orgSessions.delete(sessionId);
      console.log(`[MCP-Org] SSE session closed (${sessionId})`);
    };

    try {
      await server.connect(transport);
      console.log(`[MCP-Org] SSE session established (${sessionId})`);
    } catch (error) {
      orgSessions.delete(sessionId);
      console.error('[MCP-Org] Failed to start SSE session:', error);
      if (!res.headersSent) {
        res.status(500).end('Failed to start MCP session');
      }
    }
  });

  app.post(MCP_ORG_MESSAGES_PATH, async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const session = orgSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error(`[MCP-Org] Failed to handle POST for session ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to handle MCP message' });
      }
    }
  });

  const shutdown = async () => {
    // Close client sessions
    for (const [sessionId, session] of clientSessions.entries()) {
      clientSessions.delete(sessionId);
      try {
        await session.transport.close?.();
      } catch (error) {
        console.warn(`[MCP-Client] Failed to close transport ${sessionId}:`, error.message);
      }
      try {
        await session.server.close();
      } catch (error) {
        console.warn(`[MCP-Client] Failed to close server ${sessionId}:`, error.message);
      }
    }

    // Close org sessions
    for (const [sessionId, session] of orgSessions.entries()) {
      orgSessions.delete(sessionId);
      try {
        await session.transport.close?.();
      } catch (error) {
        console.warn(`[MCP-Org] Failed to close transport ${sessionId}:`, error.message);
      }
      try {
        await session.server.close();
      } catch (error) {
        console.warn(`[MCP-Org] Failed to close server ${sessionId}:`, error.message);
      }
    }
  };

  console.log(`[MCP] Client endpoint mounted at GET ${MCP_CLIENT_SSE_PATH}`);
  console.log(`[MCP] Org endpoint mounted at GET ${MCP_ORG_SSE_PATH}`);
  return { shutdown };
}

module.exports = {
  mountMcpServer,
  createClientMcpServer,
  createOrgMcpServer,
  MCP_CLIENT_SSE_PATH,
  MCP_ORG_SSE_PATH
};

/**
 * Allow `node mcp/server.js` to run a lightweight standalone server for testing.
 */
if (require.main === module) {
  require('dotenv').config();
  const app = express();
  app.use(express.json());
  const { shutdown } = mountMcpServer(app);
  const port = process.env.MCP_PORT || 3030;

  const server = app.listen(port, () => {
    console.log(`MCP server listening on http://localhost:${port}`);
    console.log(`  Client endpoint: ${MCP_CLIENT_SSE_PATH}`);
    console.log(`  Org endpoint: ${MCP_ORG_SSE_PATH}`);
  });

  const graceful = async () => {
    console.log('Shutting down MCP server...');
    await shutdown();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', graceful);
  process.on('SIGTERM', graceful);
}
