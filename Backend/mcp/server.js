/**
 * MCP Server hookup for Tawasol CRM.
 * Exposes deterministic SQL tools over SSE for the Telegram host.
 */
const express = require('express');
const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const db = require('../db/connection');

const MCP_SSE_PATH = process.env.MCP_SSE_PATH || '/mcp/sse';
const MCP_MESSAGES_PATH = process.env.MCP_MESSAGES_PATH || '/mcp/messages';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const baseOrgSchema = {
  organizationId: z.number().int().positive().describe('Organization ID to scope the query')
};

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_LIMIT)
  .describe(`Maximum number of rows to return (1-${MAX_LIMIT})`)
  .optional();

/**
 * Register all CRM tools on a new MCP server instance.
 */
function createMcpServer() {
  const server = new McpServer(
    {
      name: 'tawasol-crm-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  registerTools(server);
  return server;
}

function registerTools(server) {
  server.tool(
    'queryDeals',
    'List deals for an organization. Supports stage and value filters.',
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
        return server.createToolError(`Failed to query deals: ${error.message}`);
      }
    }
  );

  server.tool(
    'queryContacts',
    'List contacts (people or organizations) for an org with optional search.',
    {
      ...baseOrgSchema,
      type: z
        .enum(['all', 'people', 'organizations'])
        .describe('Choose which contact set to return')
        .default('all'),
      search: z.string().min(1).max(255).describe('Case-insensitive search term').optional(),
      limit: limitSchema
    },
    async ({ organizationId, type, search, limit }) => {
      try {
        const limitValue = clampLimit(limit);
        const searchTerm = search ? `%${search.trim()}%` : null;
        const results = [];

        if (type !== 'organizations') {
          const peopleParams = [organizationId];
          let peopleSql = `
            SELECT
              id,
              CONCAT(first_name, ' ', last_name) AS name,
              email,
              phone,
              job_title AS extra,
              'person' AS contactType,
              DATE_FORMAT(updated_at, '%Y-%m-%d') AS updatedAt
            FROM contacts_people
            WHERE organization_id = ?
          `;
          if (searchTerm) {
            peopleSql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
            peopleParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
          }
          peopleSql += ' ORDER BY updated_at DESC LIMIT ?';
          peopleParams.push(limitValue);
          const [peopleRows] = await db.query(peopleSql, peopleParams);
          results.push(...peopleRows);
        }

        if (type !== 'people') {
          const orgParams = [organizationId];
          let orgSql = `
            SELECT
              id,
              name,
              email,
              phone,
              address AS extra,
              'organization' AS contactType,
              DATE_FORMAT(updated_at, '%Y-%m-%d') AS updatedAt
            FROM contacts_organizations
            WHERE organization_id = ?
          `;
          if (searchTerm) {
            orgSql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
            orgParams.push(searchTerm, searchTerm, searchTerm);
          }
          orgSql += ' ORDER BY updated_at DESC LIMIT ?';
          orgParams.push(limitValue);
          const [orgRows] = await db.query(orgSql, orgParams);
          results.push(...orgRows);
        }

        const trimmed = results.slice(0, limitValue);
        return formatTableResult(
          `Contacts (${trimmed.length})`,
          trimmed,
          ['contactType', 'id', 'name', 'email', 'phone', 'extra', 'updatedAt']
        );
      } catch (error) {
        return server.createToolError(`Failed to query contacts: ${error.message}`);
      }
    }
  );

  server.tool(
    'queryIssues',
    'List issues filtered by status/priority for an organization.',
    {
      ...baseOrgSchema,
      status: z
        .enum(['open', 'in_progress', 'resolved', 'closed'])
        .describe('Optional status filter')
        .optional(),
      priority: z
        .enum(['low', 'medium', 'high', 'critical'])
        .describe('Optional priority filter')
        .optional(),
      limit: limitSchema
    },
    async ({ organizationId, status, priority, limit }) => {
      try {
        const clauses = ['organization_id = ?'];
        const params = [organizationId];
        if (status) {
          clauses.push('status = ?');
          params.push(status);
        }
        if (priority) {
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
        return server.createToolError(`Failed to query issues: ${error.message}`);
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
              (SELECT COUNT(*) FROM contacts_organizations WHERE organization_id = ?) AS orgCount
          `,
          [organizationId, organizationId]
        );

        const responseLines = [
          `Deals: ${dealStats.totalDeals || 0} (value ${formatCurrency(dealStats.totalValue)})`,
          `Forecast >=50%: ${formatCurrency(dealStats.forecastedValue)}`,
          `Contacts: ${contactStats.peopleCount || 0} people / ${contactStats.orgCount || 0} orgs`,
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
        return server.createToolError(`Failed to gather stats: ${error.message}`);
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
        return server.createToolError(`Failed to list stages: ${error.message}`);
      }
    }
  );
}

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

/**
 * Mount MCP SSE + message endpoints onto an existing Express app.
 */
function mountMcpServer(app) {
  if (!app || typeof app.get !== 'function') {
    throw new Error('mountMcpServer expects an Express application instance.');
  }

  const sessions = new Map();

  app.get(MCP_SSE_PATH, async (req, res) => {
    const transport = new SSEServerTransport(MCP_MESSAGES_PATH, res);
    const server = createMcpServer();
    const sessionId = transport.sessionId;
    sessions.set(sessionId, { transport, server });

    transport.onclose = () => {
      sessions.delete(sessionId);
      server.close().catch(err => {
        console.warn(`[MCP] Error closing server for session ${sessionId}:`, err.message);
      });
    };

    try {
      await server.connect(transport);
      console.log(`[MCP] SSE session established (${sessionId})`);
    } catch (error) {
      sessions.delete(sessionId);
      console.error('[MCP] Failed to start SSE session:', error);
      if (!res.headersSent) {
        res.status(500).end('Failed to start MCP session');
      }
    }
  });

  app.post(MCP_MESSAGES_PATH, async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error(`[MCP] Failed to handle POST for session ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to handle MCP message' });
      }
    }
  });

  const shutdown = async () => {
    for (const [sessionId, session] of sessions.entries()) {
      sessions.delete(sessionId);
      try {
        await session.transport.close?.();
      } catch (error) {
        console.warn(`[MCP] Failed to close transport ${sessionId}:`, error.message);
      }
      try {
        await session.server.close();
      } catch (error) {
        console.warn(`[MCP] Failed to close server ${sessionId}:`, error.message);
      }
    }
  };

  console.log(`[MCP] Mounted at GET ${MCP_SSE_PATH} and POST ${MCP_MESSAGES_PATH}`);
  return { shutdown };
}

module.exports = {
  mountMcpServer,
  createMcpServer
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
    console.log(`MCP server listening on http://localhost:${port}${MCP_SSE_PATH}`);
  });

  const graceful = async () => {
    console.log('Shutting down MCP server...');
    await shutdown();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', graceful);
  process.on('SIGTERM', graceful);
}

