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

const CURRENCY_REGEX = /^[A-Z]{3}$/;
const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const sanitizeCurrency = (value) => {
  if (!value) return 'USD';
  const upper = value.toUpperCase();
  return CURRENCY_REGEX.test(upper) ? upper : 'USD';
};

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

  // Deal mutations
  server.tool(
    'createDeal',
    'Create a new deal for this organization.',
    {
      ...baseOrgSchema,
      title: z.string().min(3).max(150).describe('Deal title'),
      stageId: z.number().int().positive().describe('Deal stage ID'),
      value: z.number().nonnegative().describe('Deal value').optional(),
      currency: z.string().min(3).max(3).describe('Currency (ISO code)').optional(),
      contactPersonId: z.number().int().positive().describe('Existing contact person ID').optional(),
      contactOrgId: z.number().int().positive().describe('Existing contact organization ID').optional(),
      assignedToEmail: z.string().email().describe('Email of user to assign the deal to').optional(),
      assignedToUserId: z.number().int().positive().describe('Legacy user ID for assignment').optional(),
      expectedCloseDate: z.string().describe('Expected close date (YYYY-MM-DD)').optional(),
      probability: z.number().int().min(0).max(100).describe('Probability in percent').optional(),
      notes: z.string().max(2000).describe('Internal notes').optional()
    },
    async (args) => {
      try {
        const {
          organizationId,
          title,
          stageId,
          value,
          currency,
          contactPersonId,
          contactOrgId,
          assignedToEmail,
          assignedToUserId,
          expectedCloseDate,
          probability,
          notes
        } = args;

        const stage = await ensureStage(stageId);
        if (contactPersonId) {
          await ensureContactPerson(organizationId, contactPersonId);
        }
        if (contactOrgId) {
          const [rows] = await db.query(
            'SELECT id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
            [contactOrgId, organizationId]
          );
          if (rows.length === 0) {
            throw new Error('Contact organization not found in this organization.');
          }
        }
        let assignedUserId = null;
        if (assignedToEmail || assignedToUserId) {
          const assignedUser = await resolveOrgUser(organizationId, {
            userId: assignedToUserId,
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

        const finalProbability = normalizeProbability(
          probability,
          stage.default_probability || 0
        );
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
        return server.createToolError(`Failed to create deal: ${error.message}`);
      }
    }
  );

  server.tool(
    'updateDeal',
    'Update fields on an existing deal.',
    {
      ...baseOrgSchema,
      dealId: z.number().int().positive().describe('Deal ID to update'),
      title: z.string().min(3).max(150).optional(),
      value: z.number().nonnegative().optional(),
      currency: z.string().min(3).max(3).optional(),
      stageId: z.number().int().positive().optional(),
      contactPersonId: z.number().int().positive().optional(),
      contactOrgId: z.number().int().positive().optional(),
      assignedToEmail: z.string().email().optional(),
      assignedToUserId: z.number().int().positive().optional(),
      expectedCloseDate: z.string().optional(),
      probability: z.number().int().min(0).max(100).optional(),
      notes: z.string().max(2000).optional()
    },
    async (args) => {
      try {
        const {
          organizationId,
          dealId,
          title,
          value,
          currency,
          stageId,
          contactPersonId,
          contactOrgId,
          assignedToEmail,
          assignedToUserId,
          expectedCloseDate,
          probability,
          notes
        } = args;

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
            const [rows] = await db.query(
              'SELECT id FROM contacts_organizations WHERE id = ? AND organization_id = ?',
              [contactOrgId, organizationId]
            );
            if (rows.length === 0) {
              throw new Error('Contact organization not found in this organization.');
            }
          }
          updates.push('contact_org_id = ?');
          params.push(contactOrgId || null);
        }
        if (assignedToEmail !== undefined || assignedToUserId !== undefined) {
          if (assignedToEmail || assignedToUserId) {
            const assigned = await resolveOrgUser(organizationId, {
              userId: assignedToUserId,
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
        return server.createToolError(`Failed to update deal: ${error.message}`);
      }
    }
  );

  server.tool(
    'deleteDeal',
    'Delete a deal from this organization.',
    {
      ...baseOrgSchema,
      dealId: z.number().int().positive().describe('Deal ID to delete')
    },
    async ({ organizationId, dealId }) => {
      try {
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
        return server.createToolError(`Failed to delete deal: ${error.message}`);
      }
    }
  );

  // Issue mutations
  server.tool(
    'createIssue',
    'Create a new issue/ticket inside this organization.',
    {
      ...baseOrgSchema,
      requestorEmail: z.string().email().describe('Email of the reporter creating the issue'),
      requestorUserId: z.number().int().positive().describe('Legacy reporter user ID').optional(),
      title: z.string().min(3).max(200).describe('Issue title'),
      description: z.string().max(5000).optional(),
      priority: z.enum(ISSUE_PRIORITIES).describe('Issue priority').optional(),
      assignedToEmail: z.string().email().optional(),
      assignedToUserId: z.number().int().positive().optional(),
      dealId: z.number().int().positive().describe('Related deal ID').optional()
    },
    async ({
      organizationId,
      requestorEmail,
      requestorUserId,
      title,
      description,
      priority = 'medium',
      assignedToEmail,
      assignedToUserId,
      dealId
    }) => {
      try {
        const reporter = await resolveOrgUser(organizationId, {
          userId: requestorUserId,
          email: requestorEmail
        });
        let assignedUser = null;
        if (assignedToEmail || assignedToUserId) {
          assignedUser = await resolveOrgUser(organizationId, {
            userId: assignedToUserId,
            email: assignedToEmail,
            required: false
          });
        }
        if (dealId) {
          await ensureDeal(organizationId, dealId);
        }

        const [result] = await db.query(
          `INSERT INTO issues (organization_id, deal_id, title, description, status, priority, assigned_to_user_id, reporter_user_id)
           VALUES (?, ?, ?, ?, 'open', ?, ?, ?)`,
          [
            organizationId,
            dealId || null,
            title.trim(),
            description || null,
            priority,
            assignedUser?.id || null,
            reporter.id
          ]
        );

        return {
          content: [
            {
              type: 'text',
              text: `✅ Issue "${title}" created with ID ${result.insertId}${assignedUser ? ` and assigned to ${assignedUser.full_name}` : ''}.`
            }
          ]
        };
      } catch (error) {
        return server.createToolError(`Failed to create issue: ${error.message}`);
      }
    }
  );

  server.tool(
    'updateIssue',
    'Update fields on an existing issue.',
    {
      ...baseOrgSchema,
      issueId: z.number().int().positive().describe('Issue ID to update'),
      title: z.string().min(3).max(200).optional(),
      description: z.string().max(5000).optional(),
      status: z.enum(ISSUE_STATUSES).optional(),
      priority: z.enum(ISSUE_PRIORITIES).optional(),
      assignedToEmail: z.string().email().optional(),
      assignedToUserId: z.number().int().positive().optional()
    },
    async ({ organizationId, issueId, title, description, status, priority, assignedToEmail, assignedToUserId }) => {
      try {
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
        if (assignedToEmail !== undefined || assignedToUserId !== undefined) {
          if (assignedToEmail || assignedToUserId) {
            const assigned = await resolveOrgUser(organizationId, {
              userId: assignedToUserId,
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
        return server.createToolError(`Failed to update issue: ${error.message}`);
      }
    }
  );

  server.tool(
    'deleteIssue',
    'Delete an issue from this organization.',
    {
      ...baseOrgSchema,
      issueId: z.number().int().positive().describe('Issue ID to delete')
    },
    async ({ organizationId, issueId }) => {
      try {
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
        return server.createToolError(`Failed to delete issue: ${error.message}`);
      }
    }
  );

  // Contact mutations
  server.tool(
    'createContactPerson',
    'Create a new person contact linked to this organization.',
    {
      ...baseOrgSchema,
      creatorEmail: z.string().email().describe('Email of the CRM user creating this contact'),
      creatorUserId: z.number().int().positive().describe('Legacy creator user ID').optional(),
      firstName: z.string().min(1).max(100),
      lastName: z.string().max(100).optional(),
      email: z.string().email(),
      phone: z.string().max(50).optional(),
      jobTitle: z.string().max(150).optional(),
      notes: z.string().max(2000).optional()
    },
    async ({ organizationId, creatorEmail, creatorUserId, firstName, lastName, email, phone, jobTitle, notes }) => {
      try {
        const creator = await resolveOrgUser(organizationId, {
          userId: creatorUserId,
          email: creatorEmail
        });
        const cleanedEmail = email.toLowerCase();
        const [existing] = await db.query(
          'SELECT id FROM contacts_people WHERE organization_id = ? AND email = ?',
          [organizationId, cleanedEmail]
        );
        if (existing.length > 0) {
          throw new Error('A contact with this email already exists in the organization.');
        }
        const [result] = await db.query(
          `INSERT INTO contacts_people (organization_id, user_id, first_name, last_name, email, phone, job_title, notes, created_by_user_id)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
          [
            organizationId,
            firstName.trim(),
            lastName?.trim() || '',
            cleanedEmail,
            phone || null,
            jobTitle || null,
            notes || null,
            creator.id
          ]
        );
        return {
          content: [
            {
              type: 'text',
              text: `✅ Contact person "${firstName} ${lastName || ''}" created with ID ${result.insertId}.`
            }
          ]
        };
      } catch (error) {
        return server.createToolError(`Failed to create contact person: ${error.message}`);
      }
    }
  );

  server.tool(
    'updateContactPerson',
    'Update an existing contact person.',
    {
      ...baseOrgSchema,
      contactPersonId: z.number().int().positive().describe('Contact person ID'),
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      jobTitle: z.string().max(150).optional(),
      notes: z.string().max(2000).optional()
    },
    async ({ organizationId, contactPersonId, firstName, lastName, email, phone, jobTitle, notes }) => {
      try {
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
        return server.createToolError(`Failed to update contact person: ${error.message}`);
      }
    }
  );

  server.tool(
    'deleteContactPerson',
    'Delete a contact person from this organization.',
    {
      ...baseOrgSchema,
      contactPersonId: z.number().int().positive().describe('Contact person ID')
    },
    async ({ organizationId, contactPersonId }) => {
      try {
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
        return server.createToolError(`Failed to delete contact person: ${error.message}`);
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

async function ensureOrgUserById(organizationId, userId) {
  if (!userId) return null;
  const [rows] = await db.query(
    'SELECT u.id, u.email, u.full_name FROM users u INNER JOIN user_organizations uo ON u.id = uo.user_id WHERE u.id = ? AND uo.organization_id = ?',
    [userId, organizationId]
  );
  if (rows.length === 0) {
    throw new Error('User not found in this organization.');
  }
  return rows[0];
}

async function ensureOrgUserByEmail(organizationId, email) {
  if (!email) return null;
  const normalized = email.toLowerCase();
  const [rows] = await db.query(
    'SELECT u.id, u.email, u.full_name FROM users u INNER JOIN user_organizations uo ON u.id = uo.user_id WHERE LOWER(u.email) = ? AND uo.organization_id = ?',
    [normalized, organizationId]
  );
  if (rows.length === 0) {
    throw new Error('No user with that email belongs to this organization.');
  }
  return rows[0];
}

async function resolveOrgUser(organizationId, { userId, email, required = true }) {
  if (email) {
    return ensureOrgUserByEmail(organizationId, email);
  }
  if (userId) {
    return ensureOrgUserById(organizationId, userId);
  }
  if (required) {
    throw new Error('Please provide a user email for this action.');
  }
  return null;
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

