/**
 * HudHud Chatbot Service
 * MCP-powered AI assistant for Tawasol CRM (Web Interface)
 * Mirrors the Telegram bot functionality with automatic mode detection
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const { sessionStore } = require('../chatbot/sessionStore');
const db = require('../db/connection');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000';
const MCP_CLIENT_SSE_URL = `${MCP_BASE_URL}/mcp/client/sse`;
const MCP_ORG_SSE_URL = `${MCP_BASE_URL}/mcp/org/sse`;

// Initialize Gemini
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
} else {
  console.warn('⚠️  GEMINI_API_KEY not configured. HudHud chatbot will not work.');
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Extract text from Gemini response
 */
const extractModelText = (response, fallback = '') => {
  if (!response) {
    return fallback;
  }
  try {
    if (typeof response.text === 'function') {
      const text = response.text();
      if (typeof text === 'string' && text.trim()) {
        return text.trim();
      }
    }
  } catch (error) {
    console.warn('Failed to extract Gemini text output:', error);
  }
  return fallback;
};

/**
 * Create MCP client connection
 */
async function createMcpClient(sseUrl) {
  const baseUrl = new URL(sseUrl);
  const client = new Client({
    name: 'tawasol-hudhud-web',
    version: '1.0.0'
  });
  const transport = new SSEClientTransport(baseUrl);
  await client.connect(transport);
  return { client, transport };
}

/**
 * Strip unsupported JSON schema keywords for Gemini
 */
function stripUnsupportedKeywords(schema) {
  if (Array.isArray(schema)) {
    return schema.map(stripUnsupportedKeywords);
  }
  if (schema && typeof schema === 'object') {
    const filtered = {};
    for (const [key, value] of Object.entries(schema)) {
      if (
        key === 'exclusiveMinimum' ||
        key === 'exclusiveMaximum' ||
        key === 'definitions'
      ) {
        continue;
      }
      filtered[key] = stripUnsupportedKeywords(value);
    }
    return filtered;
  }
  return schema;
}

/**
 * Map MCP tools to Gemini function declarations
 */
function mapTools(tools = []) {
  if (!tools.length) {
    return undefined;
  }
  return [
    {
      functionDeclarations: tools.map(tool => {
        const sanitizedSchema =
          tool.inputSchema ||
          {
            type: 'object',
            properties: {},
            additionalProperties: false
          };
        return {
          name: tool.name,
          description: tool.description,
          parameters: stripUnsupportedKeywords(sanitizedSchema)
        };
      })
    }
  ];
}

/**
 * Flatten MCP tool response content
 */
function flattenToolContent(content = []) {
  return content
    .map(item => {
      if (item.type === 'text') {
        return item.text;
      }
      return JSON.stringify(item);
    })
    .join('\n');
}

// ============================================================
// SYSTEM INSTRUCTIONS
// ============================================================

function buildClientSystemInstruction(userId) {
  return `
You are HudHud, Tawasol CRM's friendly client assistant. Always keep responses concise (<= 6 sentences).
You help clients view their deals and issues across organizations where they are listed as contacts.
The user ID is ${userId}. Always pass userId=${userId} to all tool calls.
Be helpful and provide actionable information about their deals and support requests.
Use a warm, professional tone. Format responses with clear structure when listing items.
`;
}

function buildOrgSystemInstruction(organizationId, organizationName, role) {
  return `
You are HudHud, Tawasol CRM's intelligent assistant for ${organizationName}. Always keep responses concise (<= 6 sentences).
You have deterministic SQL tools and must scope every call to organization_id=${organizationId}.
Never leak other tenant data. The user's role is "${role}".
Return actionable summaries referencing deal/contact/issue names and highlight blockers when present.
Use a warm, professional tone. Format responses with clear structure when listing items.
`;
}

// ============================================================
// CONTEXT HELPERS
// ============================================================

/**
 * Get organization details for context
 */
async function getOrganizationContext(organizationId, userId) {
  try {
    // Get organization name
    const [orgs] = await db.query(
      'SELECT name FROM organizations WHERE id = ?',
      [organizationId]
    );
    
    // Get user's role in org
    const [memberships] = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      [userId, organizationId]
    );

    return {
      organizationName: orgs[0]?.name || 'Unknown Organization',
      role: memberships[0]?.role || 'member'
    };
  } catch (error) {
    console.error('Error getting organization context:', error);
    return {
      organizationName: 'Organization',
      role: 'member'
    };
  }
}

// ============================================================
// MCP AGENT
// ============================================================

/**
 * Run the MCP agent with Gemini
 */
async function runAgent(userId, organizationId, userContext, userText) {
  if (!model) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const isClientMode = !organizationId;
  const sseUrl = isClientMode ? MCP_CLIENT_SSE_URL : MCP_ORG_SSE_URL;

  // Get or create session context
  let orgContext = { organizationName: null, role: null };
  if (!isClientMode) {
    orgContext = await getOrganizationContext(organizationId, userId);
    sessionStore.setContext(userId, organizationId, orgContext);
  }

  // Try to connect to MCP server
  let client, transport;
  try {
    const connection = await createMcpClient(sseUrl);
    client = connection.client;
    transport = connection.transport;
  } catch (error) {
    console.error('MCP connection error:', error);
    // Clear potentially corrupted history on connection failure
    sessionStore.clearHistory(userId, organizationId);
    throw new Error('CONNECTION_FAILED');
  }

  try {
    const { tools } = await client.listTools();
    const geminiTools = mapTools(tools);
    
    // Get and clean history
    const rawHistory = sessionStore.getHistory(userId, organizationId);
    const history = sessionStore.cleanHistory(rawHistory);

    const systemInstruction = isClientMode
      ? buildClientSystemInstruction(userId)
      : buildOrgSystemInstruction(
          organizationId,
          orgContext.organizationName,
          orgContext.role
        );

    const chat = model.startChat({
      tools: geminiTools,
      history,
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }]
      }
    });

    const initial = await chat.sendMessage(userText);
    const response = await initial.response;
    const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : undefined;

    if (functionCalls && functionCalls.length > 0) {
      const toolResults = await Promise.all(
        functionCalls.map(async call => {
          const args = { ...(call.args || {}) };
          
          // Inject context-specific parameters
          if (isClientMode) {
            args.userId = userId;
          } else {
            args.organizationId = organizationId;
            // Inject creator/requestor email for mutations
            if (userContext.email && args.creatorEmail === undefined) {
              args.creatorEmail = userContext.email.toLowerCase();
            }
            if (userContext.email && args.requestorEmail === undefined) {
              args.requestorEmail = userContext.email.toLowerCase();
            }
          }

          const toolResult = await client.callTool({
            name: call.name,
            arguments: args
          });
          return {
            name: call.name,
            result: flattenToolContent(toolResult.content)
          };
        })
      );

      const responseParts = toolResults.map(result => ({
        functionResponse: {
          name: result.name,
          response: { result: result.result }
        }
      }));

      const finalMessage = await chat.sendMessage(responseParts);
      const finalResponse = await finalMessage.response;
      const finalText =
        extractModelText(finalResponse) ||
        toolResults.map(r => r.result).join('\n') ||
        'I was unable to compose a reply.';

      sessionStore.append(userId, organizationId, 'user', userText);
      sessionStore.append(userId, organizationId, 'model', finalText);

      return finalText;
    }

    const text = extractModelText(response, 'I did not find anything to share yet.');
    sessionStore.append(userId, organizationId, 'user', userText);
    sessionStore.append(userId, organizationId, 'model', text);
    return text;
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Send a message to HudHud chatbot
 * @param {number} userId - User ID from JWT
 * @param {number|null} organizationId - Organization ID from JWT (null for client mode)
 * @param {string} message - User message
 * @param {object} userContext - Additional user context { email }
 * @returns {Promise<string>} Bot response
 */
const chat = async (userId, organizationId, message, userContext = {}) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Message is required');
  }

  try {
    const response = await runAgent(userId, organizationId, userContext, message.trim());
    return response;
  } catch (error) {
    console.error('HudHud chatbot error:', error);
    
    if (error.message === 'CONNECTION_FAILED') {
      throw new Error('Unable to connect to CRM services. Please try again.');
    }
    
    if (error.message === 'GEMINI_NOT_CONFIGURED') {
      throw new Error('AI service is not configured. Please contact support.');
    }

    // Handle Gemini history validation errors
    if (error.message && error.message.includes('First content should be with role')) {
      // Clear corrupted history
      sessionStore.clearHistory(userId, organizationId);
      throw new Error('Session reset. Please try your request again.');
    }

    throw new Error('Failed to get AI response. Please try again.');
  }
};

/**
 * Reset chat session
 * @param {number} userId
 * @param {number|null} organizationId
 */
const resetSession = (userId, organizationId) => {
  sessionStore.reset(userId, organizationId);
};

/**
 * Get session info
 * @param {number} userId
 * @param {number|null} organizationId
 */
const getSessionInfo = (userId, organizationId) => {
  const context = sessionStore.getContext(userId, organizationId);
  const history = sessionStore.getHistory(userId, organizationId);
  
  return {
    mode: organizationId ? 'organization' : 'client',
    organizationId: organizationId || null,
    organizationName: context?.organizationName || null,
    role: context?.role || null,
    messageCount: history.length
  };
};

module.exports = {
  chat,
  resetSession,
  getSessionInfo
};
