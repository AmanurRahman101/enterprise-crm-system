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

// Detect protocol (HTTPS if certificates exist, otherwise HTTP)
const fs = require('fs');
const path = require('path');
const certPath = path.join(__dirname, '../cert');
const certFile = path.join(certPath, 'localhost.crt');
const hasSSL = fs.existsSync(certFile);
const protocol = hasSSL ? 'https' : 'http';
const MCP_BASE_URL = process.env.MCP_BASE_URL || `${protocol}://localhost:3000`;
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
  
  // For HTTPS with self-signed certificates in development, temporarily disable
  // certificate validation for internal MCP connections
  const isHTTPS = baseUrl.protocol === 'https:';
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isLocalhost = baseUrl.hostname === 'localhost' || baseUrl.hostname === '127.0.0.1' || baseUrl.hostname.startsWith('192.168.');
  
  let originalRejectUnauthorized = null;
  if (isHTTPS && isDevelopment && isLocalhost) {
    // Temporarily disable SSL verification for self-signed certs in development
    const https = require('https');
    originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  try {
    const transport = new SSEClientTransport(baseUrl);
    await client.connect(transport);
    return { client, transport };
  } finally {
    // Restore original setting
    if (originalRejectUnauthorized !== null) {
      if (originalRejectUnauthorized === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
      }
    }
  }
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
 * Filter tools based on user role
 * Viewers can only use query tools, not mutations
 */
function filterToolsByRole(tools = [], userRole) {
  if (!userRole || userRole === 'viewer') {
    // Mutation tools that viewers cannot use
    const mutationTools = [
      'createDeal',
      'updateDeal',
      'deleteDeal',
      'createIssue',
      'updateIssue',
      'deleteIssue',
      'createContactPerson',
      'updateContactPerson',
      'deleteContactPerson',
      'linkContactToUser',
      'unlinkContactFromUser'
    ];
    return tools.filter(tool => !mutationTools.includes(tool.name));
  }
  // All other roles (agent, manager, admin, owner) get all tools
  return tools;
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

function buildClientSystemInstruction(userId, fullName, email) {
  return `
You are HudHud, Tawasol CRM's friendly client assistant. Always keep responses concise (<= 6 sentences).
You are speaking with ${fullName} (${email}). The user ID is ${userId}. Always pass userId=${userId} to all tool calls.
You help clients view their deals and issues across organizations where they are listed as contacts.
When creating issues, always ask if the issue is related to a specific deal or is a general support request. If deal-related, ask for the deal ID.
Be helpful and provide actionable information about their deals and support requests.
Use a warm, professional tone. Format responses with clear structure when listing items.
`;
}

function buildOrgSystemInstruction(organizationId, organizationName, role, fullName, email) {
  const isViewer = role === 'viewer';
  const permissionNote = isViewer 
    ? `\nIMPORTANT: The user has "${role}" role (viewer). You can ONLY use query/view tools. You CANNOT create, update, or delete any data. If the user asks to create, update, or delete anything, politely explain that their role only allows viewing data and they need to contact an admin for changes.`
    : `\nThe user's role is "${role}" which allows creating and updating data.`;
  
  return `
You are HudHud, Tawasol CRM's intelligent assistant for ${organizationName}. Always keep responses concise (<= 6 sentences).
You are speaking with ${fullName} (${email}).
You have deterministic SQL tools and must scope every call to organization_id=${organizationId}.
Never leak other tenant data.${permissionNote}
IMPORTANT: Issues can only be created in Client Portal, not in Organization Portal. If the user asks to create an issue, politely explain they need to switch to Client Portal mode.
Return actionable summaries referencing deal/contact/issue names and highlight blockers when present.
Use a warm, professional tone. Format responses with clear structure when listing items.
`;
}

// ============================================================
// CONTEXT HELPERS
// ============================================================

/**
 * Get user details (full name and email)
 */
async function getUserDetails(userId) {
  try {
    const [users] = await db.query(
      'SELECT full_name, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return { fullName: 'User', email: 'unknown@example.com' };
    }
    
    return {
      fullName: users[0].full_name || 'User',
      email: users[0].email || 'unknown@example.com'
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return { fullName: 'User', email: 'unknown@example.com' };
  }
}

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

  // Get user details for identification
  const userDetails = await getUserDetails(userId);
  
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
    
    // Filter tools based on user role (viewers can't use mutation tools)
    // Also remove createIssue from org mode (issues can only be created in client mode)
    let filteredTools = isClientMode 
      ? tools 
      : filterToolsByRole(tools, orgContext.role);
    
    // Remove createIssue from org mode entirely
    if (!isClientMode) {
      filteredTools = filteredTools.filter(tool => tool.name !== 'createIssue');
    }
    
    const geminiTools = mapTools(filteredTools);
    
    // Get and clean history
    const rawHistory = sessionStore.getHistory(userId, organizationId);
    const history = sessionStore.cleanHistory(rawHistory);

    const systemInstruction = isClientMode
      ? buildClientSystemInstruction(userId, userDetails.fullName, userDetails.email)
      : buildOrgSystemInstruction(
          organizationId,
          orgContext.organizationName,
          orgContext.role,
          userDetails.fullName,
          userDetails.email
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
            // Inject user role for permission checks
            args.userRole = orgContext.role;
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

// ============================================================
// THREAD MANAGEMENT
// ============================================================

/**
 * Generate a chat title from the first user message
 * @param {string} message - First user message
 * @returns {string} Generated title
 */
function generateChatTitle(message) {
  if (!message || typeof message !== 'string') {
    return 'New chat';
  }

  // Strip whitespace and newlines
  let title = message.trim().replace(/\s+/g, ' ');

  // Remove emoji-only content or very short messages
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  if (emojiRegex.test(title) || title.length < 3) {
    return 'New chat';
  }

  // Truncate to 48 characters
  if (title.length > 48) {
    title = title.substring(0, 45) + '...';
  }

  return title;
}

/**
 * Create a new chat thread
 * @param {number} userId
 * @param {number|null} organizationId
 * @returns {Promise<string>} Thread ID
 */
async function createThread(userId, organizationId) {
  const { v4: uuidv4 } = require('uuid');
  const threadId = uuidv4();

  await db.query(
    'INSERT INTO chat_threads (id, user_id, organization_id, title) VALUES (?, ?, ?, ?)',
    [threadId, userId, organizationId, 'New chat']
  );

  return threadId;
}

/**
 * Get user's chat threads
 * @param {number} userId
 * @param {number|null} organizationId
 * @returns {Promise<Array>} List of threads
 */
async function getThreads(userId, organizationId) {
  const [threads] = await db.query(
    `SELECT id, title, created_at, updated_at 
     FROM chat_threads 
     WHERE user_id = ? AND (organization_id <=> ?) AND deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 50`,
    [userId, organizationId]
  );

  return threads;
}

/**
 * Get messages for a specific thread
 * @param {number} userId
 * @param {string} threadId
 * @returns {Promise<Array>} List of messages
 */
async function getThreadMessages(userId, threadId) {
  // Verify thread ownership
  const [threads] = await db.query(
    'SELECT id FROM chat_threads WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [threadId, userId]
  );

  if (threads.length === 0) {
    throw new Error('THREAD_NOT_FOUND');
  }

  // Get messages
  const [messages] = await db.query(
    `SELECT id, role, content, created_at 
     FROM chat_messages 
     WHERE thread_id = ?
     ORDER BY created_at ASC`,
    [threadId]
  );

  return messages;
}

/**
 * Soft-delete a chat thread
 * @param {number} userId
 * @param {string} threadId
 */
async function deleteThread(userId, threadId) {
  // Verify thread ownership
  const [threads] = await db.query(
    'SELECT id FROM chat_threads WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [threadId, userId]
  );

  if (threads.length === 0) {
    throw new Error('THREAD_NOT_FOUND');
  }

  // Soft delete
  await db.query(
    'UPDATE chat_threads SET deleted_at = NOW() WHERE id = ?',
    [threadId]
  );
}

/**
 * Load thread history for Gemini
 * @param {string} threadId
 * @param {number} maxMessages - Maximum number of messages to load
 * @returns {Promise<Array>} Gemini history format
 */
async function loadThreadHistory(threadId, maxMessages = 20) {
  const [messages] = await db.query(
    `SELECT role, content 
     FROM chat_messages 
     WHERE thread_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [threadId, maxMessages]
  );

  // Reverse to get chronological order and convert to Gemini format
  return messages.reverse().map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
}

/**
 * Save a message to thread
 * @param {string} threadId
 * @param {string} role - 'user' or 'model'
 * @param {string} content
 */
async function saveThreadMessage(threadId, role, content) {
  const { v4: uuidv4 } = require('uuid');
  const messageId = uuidv4();

  await db.query(
    'INSERT INTO chat_messages (id, thread_id, role, content) VALUES (?, ?, ?, ?)',
    [messageId, threadId, role, content]
  );

  // Update thread's updated_at
  await db.query(
    'UPDATE chat_threads SET updated_at = NOW() WHERE id = ?',
    [threadId]
  );
}

/**
 * Update thread title based on first message
 * @param {string} threadId
 * @param {string} firstMessage
 */
async function updateThreadTitle(threadId, firstMessage) {
  // Check if thread still has default title
  const [threads] = await db.query(
    'SELECT title FROM chat_threads WHERE id = ?',
    [threadId]
  );

  if (threads.length > 0 && threads[0].title === 'New chat') {
    const title = generateChatTitle(firstMessage);
    await db.query(
      'UPDATE chat_threads SET title = ? WHERE id = ?',
      [title, threadId]
    );
  }
}

/**
 * Send a message to a specific thread
 * @param {number} userId
 * @param {number|null} organizationId
 * @param {string} threadId
 * @param {string} message
 * @param {object} userContext
 * @returns {Promise<string>} Bot response
 */
async function sendThreadMessage(userId, organizationId, threadId, message, userContext = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Verify thread ownership and mode match
  const [threads] = await db.query(
    'SELECT id FROM chat_threads WHERE id = ? AND user_id = ? AND (organization_id <=> ?) AND deleted_at IS NULL',
    [threadId, userId, organizationId]
  );

  if (threads.length === 0) {
    throw new Error('THREAD_NOT_FOUND');
  }

  // Save user message
  await saveThreadMessage(threadId, 'user', message);

  // Update thread title if this is the first message
  const [messageCount] = await db.query(
    'SELECT COUNT(*) as count FROM chat_messages WHERE thread_id = ?',
    [threadId]
  );
  
  if (messageCount[0].count === 1) {
    await updateThreadTitle(threadId, message);
  }

  // Load thread history
  const history = await loadThreadHistory(threadId);

  // Get user details for identification
  const userDetails = await getUserDetails(userId);
  
  // Get or create session context
  let orgContext = { organizationName: null, role: null };
  if (organizationId) {
    orgContext = await getOrganizationContext(organizationId, userId);
    sessionStore.setContext(userId, organizationId, orgContext);
  }

  const isClientMode = !organizationId;
  const sseUrl = isClientMode ? MCP_CLIENT_SSE_URL : MCP_ORG_SSE_URL;

  // Try to connect to MCP server
  let client, transport;
  try {
    const connection = await createMcpClient(sseUrl);
    client = connection.client;
    transport = connection.transport;
  } catch (error) {
    console.error('MCP connection error:', error);
    throw new Error('CONNECTION_FAILED');
  }

  try {
    const { tools } = await client.listTools();
    
    // Filter tools based on user role and mode
    let filteredTools = isClientMode 
      ? tools 
      : filterToolsByRole(tools, orgContext.role);
    
    if (!isClientMode) {
      filteredTools = filteredTools.filter(tool => tool.name !== 'createIssue');
    }
    
    const geminiTools = mapTools(filteredTools);
    
    // Clean history for Gemini
    const cleanedHistory = sessionStore.cleanHistory(history);

    const systemInstruction = isClientMode
      ? buildClientSystemInstruction(userId, userDetails.fullName, userDetails.email)
      : buildOrgSystemInstruction(
          organizationId,
          orgContext.organizationName,
          orgContext.role,
          userDetails.fullName,
          userDetails.email
        );

    const chat = model.startChat({
      tools: geminiTools,
      history: cleanedHistory,
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }]
      }
    });

    const initial = await chat.sendMessage(message);
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
            args.userRole = orgContext.role;
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

      // Save model response
      await saveThreadMessage(threadId, 'model', finalText);

      return finalText;
    }

    const text = extractModelText(response, 'I did not find anything to share yet.');
    
    // Save model response
    await saveThreadMessage(threadId, 'model', text);
    
    return text;
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

module.exports = {
  chat,
  resetSession,
  getSessionInfo,
  createThread,
  getThreads,
  getThreadMessages,
  deleteThread,
  sendThreadMessage
};
