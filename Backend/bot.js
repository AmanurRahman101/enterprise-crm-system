require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const {
  resolveUserContext,
  tryVerifyLink,
  getUserAccessSummary,
  unlinkTelegramByChatId
} = require('./telegram/auth');
const { SessionStore } = require('./telegram/sessionStore');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000';
const MCP_CLIENT_SSE_URL = `${MCP_BASE_URL}/mcp/client/sse`;
const MCP_ORG_SSE_URL = `${MCP_BASE_URL}/mcp/org/sse`;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN is not configured. Telegram host will not start.');
  module.exports = { startBot: () => Promise.resolve() };
  return;
}

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not configured. Telegram host will not start.');
  module.exports = { startBot: () => Promise.resolve() };
  return;
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const sessionStore = new SessionStore();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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

async function createMcpClient(sseUrl) {
  const baseUrl = new URL(sseUrl);
  const client = new Client({
    name: 'tawasol-telegram-host',
    version: '1.0.0'
  });
  const transport = new SSEClientTransport(baseUrl);
  await client.connect(transport);
  return { client, transport };
}

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

function buildClientSystemInstruction(userId, fullName, email) {
  return `
You are Tawasol CRM's client assistant. Always keep responses concise (<= 6 sentences).
You are speaking with ${fullName} (${email}). The user ID is ${userId}. Always pass userId=${userId} to all tool calls.
You help clients view their deals and issues across organizations where they are listed as contacts.
When creating issues, always ask if the issue is related to a specific deal or is a general support request. If deal-related, ask for the deal ID.
Be helpful and provide actionable information about their deals and support requests.
`;
}

function buildOrgSystemInstruction(organizationId, organizationName, role, fullName, email) {
  const isViewer = role === 'viewer';
  const permissionNote = isViewer 
    ? `\nIMPORTANT: The user has "${role}" role (viewer). You can ONLY use query/view tools. You CANNOT create, update, or delete any data. If the user asks to create, update, or delete anything, politely explain that their role only allows viewing data and they need to contact an admin for changes.`
    : `\nThe user's role is "${role}" which allows creating and updating data.`;
  
  return `
You are Tawasol CRM's assistant for ${organizationName}. Always keep responses concise (<= 6 sentences).
You are speaking with ${fullName} (${email}).
You have deterministic SQL tools and must scope every call to organization_id=${organizationId}.
Never leak other tenant data.${permissionNote}
IMPORTANT: Issues can only be created in Client Portal, not in Organization Portal. If the user asks to create an issue, politely explain they need to switch to Client Portal mode.
Return actionable summaries referencing deal/contact/issue names and highlight blockers when present.
`;
}

// ============================================================
// CONTEXT SELECTION HELPERS
// ============================================================

function buildContextSelectionMessage(accessSummary) {
  let message = '🎯 *How would you like to interact?*\n\n';

  // Client mode is always available for all users
  message += `👤 *Client Mode*\n`;
  if (accessSummary.hasClientAccess) {
    message += `View your deals and issues, report new issues.\n\n`;
  } else {
    message += `Report issues to organizations, track your requests.\n\n`;
  }

  // Organization options (only if member)
  if (accessSummary.hasMemberAccess) {
    message += `🏢 *Organization Mode*\n`;
    message += `Manage CRM data for an organization:\n`;
    for (const org of accessSummary.memberOrganizations) {
      message += `  • ${org.name} (${org.role})\n`;
    }
    message += '\n';
  }

  message += 'Select your mode below:';
  
  return message;
}

function buildContextKeyboard(accessSummary) {
  const buttons = [];

  // Client mode button - always available for all users
  buttons.push([Markup.button.callback('👤 Client Mode', 'ctx:client')]);

  // Organization buttons (only if member)
  if (accessSummary.hasMemberAccess) {
    for (const org of accessSummary.memberOrganizations) {
      buttons.push([
        Markup.button.callback(
          `🏢 ${org.name} (${org.role})`,
          `ctx:org:${org.id}`
        )
      ]);
    }
  }

  return Markup.inlineKeyboard(buttons);
}

async function promptContextSelection(ctx, userContext, forceShowMenu = false) {
  const accessSummary = await getUserAccessSummary(userContext.userId);

  // If user has no organization memberships, auto-select client mode
  if (!accessSummary.hasMemberAccess) {
    sessionStore.setContext(ctx.chat.id, { mode: 'client' });
    
    let welcomeMessage = '✅ *Client Mode activated*\n\n';
    if (accessSummary.hasClientAccess) {
      welcomeMessage += 'You can ask me about your deals and issues.\n';
    } else {
      welcomeMessage += 'You can:\n';
      welcomeMessage += '• Report issues to any organization\n';
      welcomeMessage += '• Track your submitted issues\n';
      welcomeMessage += '• View your overview stats\n\n';
      welcomeMessage += '_Tip: Create or join an organization in the CRM web app to unlock Organization Mode._\n';
    }
    welcomeMessage += '\nType /switch anytime to change modes.';
    
    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    return;
  }

  // If forceShowMenu is false (initial login) and user has exactly one org, auto-select
  // But if forceShowMenu is true (/switch command), always show the menu
  if (!forceShowMenu && accessSummary.memberOrganizations.length === 1 && !accessSummary.hasClientAccess) {
    const org = accessSummary.memberOrganizations[0];
    sessionStore.setContext(ctx.chat.id, {
      mode: 'org',
      organizationId: org.id,
      organizationName: org.name,
      role: org.role
    });
    await ctx.reply(
      `✅ *${org.name}* selected\n\n` +
      `You're now managing ${org.name} as ${org.role}.\n` +
      'Ask me about deals, contacts, issues, or stats.\n' +
      'Type /switch anytime to change modes.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Show selection menu
  const message = buildContextSelectionMessage(accessSummary);
  const keyboard = buildContextKeyboard(accessSummary);

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    ...keyboard
  });
}

// ============================================================
// MCP AGENT
// ============================================================

/**
 * Validate and clean conversation history for Gemini
 * Gemini requires history to start with 'user' role
 */
function cleanHistory(history) {
  if (!history || history.length === 0) {
    return [];
  }
  
  // Filter out any entries that aren't proper user/model messages
  const cleaned = history.filter(entry => {
    if (!entry || !entry.role || !entry.parts) return false;
    // Only keep user and model roles
    if (entry.role !== 'user' && entry.role !== 'model') return false;
    // Ensure parts have text content
    return entry.parts.some(part => part.text && typeof part.text === 'string');
  });
  
  // If history doesn't start with user, clear it
  if (cleaned.length > 0 && cleaned[0].role !== 'user') {
    return [];
  }
  
  return cleaned;
}

async function runAgent(chatId, context, userText) {
  const sessionContext = sessionStore.getContext(chatId);
  if (!sessionContext) {
    throw new Error('No context selected');
  }

  const isClientMode = sessionContext.mode === 'client';
  const sseUrl = isClientMode ? MCP_CLIENT_SSE_URL : MCP_ORG_SSE_URL;

  // Try to connect to MCP server with better error handling
  let client, transport;
  try {
    const connection = await createMcpClient(sseUrl);
    client = connection.client;
    transport = connection.transport;
  } catch (error) {
    console.error('MCP connection error:', error);
    // Clear potentially corrupted history on connection failure
    sessionStore.reset(chatId);
    sessionStore.setContext(chatId, sessionContext); // Restore context but clear history
    throw new Error('CONNECTION_FAILED');
  }

  try {
    const { tools } = await client.listTools();
    
    // Filter tools based on user role (viewers can't use mutation tools)
    // Also remove createIssue from org mode (issues can only be created in client mode)
    let filteredTools = isClientMode 
      ? tools 
      : filterToolsByRole(tools, sessionContext.role);
    
    // Remove createIssue from org mode entirely
    if (!isClientMode) {
      filteredTools = filteredTools.filter(tool => tool.name !== 'createIssue');
    }
    
    const geminiTools = mapTools(filteredTools);
    
    // Get and clean history to prevent Gemini errors
    const rawHistory = sessionStore.getHistory(chatId);
    const history = cleanHistory(rawHistory);

    const systemInstruction = isClientMode
      ? buildClientSystemInstruction(context.userId, context.fullName || 'User', context.email || 'unknown@example.com')
      : buildOrgSystemInstruction(
          sessionContext.organizationId,
          sessionContext.organizationName,
          sessionContext.role,
          context.fullName || 'User',
          context.email || 'unknown@example.com'
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
            args.userId = context.userId;
          } else {
            args.organizationId = sessionContext.organizationId;
            // Inject user role for permission checks
            args.userRole = sessionContext.role;
            // Inject creator/requestor email for mutations
            if (context.email && args.creatorEmail === undefined) {
              args.creatorEmail = context.email.toLowerCase();
            }
            if (context.email && args.requestorEmail === undefined) {
              args.requestorEmail = context.email.toLowerCase();
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

      sessionStore.append(chatId, 'user', userText);
      sessionStore.append(chatId, 'model', finalText);

      return finalText;
    }

    const text = extractModelText(response, 'I did not find anything to share yet.');
    sessionStore.append(chatId, 'user', userText);
    sessionStore.append(chatId, 'model', text);
    return text;
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

// ============================================================
// BOT HANDLERS
// ============================================================

bot.start(async ctx => {
  await ctx.reply(
    '👋 *Welcome to Tawasol CRM Bot!*\n\n' +
    'I can help you manage your CRM data right from Telegram.\n\n' +
    '*To get started:*\n' +
    '1. Link your account with a 6-digit code from CRM Settings\n' +
    '2. Choose to interact as Client or Organization member\n' +
    '3. Ask me anything about deals, contacts, or issues!\n\n' +
    '*Commands:*\n' +
    '/switch - Change between Client/Organization mode\n' +
    '/status - Show current mode\n' +
    '/unlink - Disconnect your CRM account\n' +
    '/help - Show this help message',
    { parse_mode: 'Markdown' }
  );
});

bot.command('help', async ctx => {
  await ctx.reply(
    '📚 *Tawasol CRM Bot Help*\n\n' +
    '*Commands:*\n' +
    '/switch - Change mode (Client ↔ Organization)\n' +
    '/status - Show your current mode\n' +
    '/unlink - Disconnect your CRM account\n' +
    '/help - Show this message\n\n' +
    '*Client Mode:*\n' +
    '• View deals where you\'re a contact\n' +
    '• View and create support issues\n' +
    '• Check your overview stats\n\n' +
    '*Organization Mode:*\n' +
    '• Full CRM access (deals, contacts, issues)\n' +
    '• Create, update, delete records\n' +
    '• View organization stats\n\n' +
    '*Examples:*\n' +
    '• "Show my open deals"\n' +
    '• "Create a deal for $5000"\n' +
    '• "What are the critical issues?"\n' +
    '• "Add contact John at john@example.com"',
    { parse_mode: 'Markdown' }
  );
});

bot.command('switch', async ctx => {
  const chatId = ctx.chat.id;
  
  try {
    const userContext = await resolveUserContext(chatId);
    if (!userContext) {
      await ctx.reply(
        '🔐 Please link your CRM account first:\n' +
        '1. Open CRM Settings → Telegram\n' +
        '2. Generate a 6-digit code\n' +
        '3. Send the code here to link this chat.'
      );
      return;
    }

    // Clear current context
    sessionStore.clearContext(chatId);
    
    // Prompt for new selection - force show menu so user can choose
    await promptContextSelection(ctx, userContext, true);
  } catch (error) {
    console.error('Switch command error:', error);
    await ctx.reply('⚠️ Something went wrong. Please try again.');
  }
});

bot.command('status', async ctx => {
  const chatId = ctx.chat.id;
  const context = sessionStore.getContext(chatId);

  if (!context) {
    await ctx.reply(
      '❓ No mode selected yet.\n' +
      'Use /switch to choose Client or Organization mode.'
    );
    return;
  }

  if (context.mode === 'client') {
    await ctx.reply(
      '👤 *Current Mode: Client*\n\n' +
      'You can view your deals and issues across all organizations.\n' +
      'Use /switch to change modes.',
      { parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply(
      `🏢 *Current Mode: Organization*\n\n` +
      `Organization: ${context.organizationName}\n` +
      `Your Role: ${context.role}\n\n` +
      'Use /switch to change modes.',
      { parse_mode: 'Markdown' }
    );
  }
});

bot.command('unlink', async ctx => {
  const chatId = ctx.chat.id;

  try {
    const userId = await unlinkTelegramByChatId(chatId);
    
    if (!userId) {
      await ctx.reply(
        '❓ No linked account found.\n\n' +
        'Your Telegram is not currently connected to any CRM account.\n' +
        'Send a 6-digit code from CRM Settings to link your account.'
      );
      return;
    }

    // Clear session data
    sessionStore.reset(chatId);

    await ctx.reply(
      '✅ *Account Disconnected*\n\n' +
      'Your CRM account has been unlinked from this Telegram chat.\n\n' +
      'To reconnect:\n' +
      '1. Go to CRM Settings → Telegram\n' +
      '2. Generate a new 6-digit code\n' +
      '3. Send it here to link again',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Unlink command error:', error);
    await ctx.reply('⚠️ Something went wrong. Please try again.');
  }
});

// Handle context selection callbacks
bot.action(/^ctx:(.+)$/, async ctx => {
  const chatId = ctx.chat.id;
  const data = ctx.match[1];

  try {
    const userContext = await resolveUserContext(chatId);
    if (!userContext) {
      await ctx.answerCbQuery('Session expired. Please start over.');
      return;
    }

    if (data === 'client') {
      sessionStore.setContext(chatId, { mode: 'client' });
      await ctx.answerCbQuery('Client mode activated!');
      await ctx.editMessageText(
        '✅ *Client Mode activated*\n\n' +
        'You can now:\n' +
        '• View deals where you\'re a contact\n' +
        '• Report issues to any organization\n' +
        '• Track your submitted issues\n\n' +
        '*Try:*\n' +
        '• "Show my deals"\n' +
        '• "What are my open issues?"\n' +
        '• "Create an issue for [organization name]"\n' +
        '• "List organizations"\n\n' +
        'Type /switch anytime to change modes.',
        { parse_mode: 'Markdown' }
      );
    } else if (data.startsWith('org:')) {
      const orgId = parseInt(data.split(':')[1], 10);
      const accessSummary = await getUserAccessSummary(userContext.userId);
      const org = accessSummary.memberOrganizations.find(o => o.id === orgId);

      if (!org) {
        await ctx.answerCbQuery('Organization not found.');
        return;
      }

      sessionStore.setContext(chatId, {
        mode: 'org',
        organizationId: org.id,
        organizationName: org.name,
        role: org.role
      });

      await ctx.answerCbQuery(`${org.name} selected!`);
      await ctx.editMessageText(
        `✅ *${org.name}* selected\n\n` +
        `You're now managing ${org.name} as *${org.role}*.\n\n` +
        '*Try:*\n' +
        '• "Show all deals"\n' +
        '• "Create a deal for $10,000"\n' +
        '• "What are the open issues?"\n' +
        '• "Add contact Sarah at sarah@example.com"\n\n' +
        'Type /switch anytime to change modes.',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Context selection error:', error);
    await ctx.answerCbQuery('Something went wrong. Please try again.');
  }
});

// Main text handler
bot.on('text', async ctx => {
  const chatId = ctx.chat.id;
  const text = (ctx.message.text || '').trim();
  if (!text) {
    return;
  }

  try {
    const userContext = await resolveUserContext(chatId);
    
    // Not linked yet - check for verification code
    if (!userContext) {
      const verified = await tryVerifyLink(chatId, text);
      if (verified) {
        await ctx.reply('✅ Account linked successfully!');
        
        // Get fresh context after linking
        const newContext = await resolveUserContext(chatId);
        if (newContext) {
          await promptContextSelection(ctx, newContext);
        }
      } else {
        await ctx.reply(
          '🔐 Please link your CRM account first:\n' +
          '1. Open CRM Settings → Telegram\n' +
          '2. Generate a 6-digit code\n' +
          '3. Send the code here to link this chat.'
        );
      }
      return;
    }

    // Linked but no context selected
    if (!sessionStore.hasContext(chatId)) {
      await promptContextSelection(ctx, userContext);
      return;
    }

    // Context selected - run the agent
    const reply = await runAgent(chatId, userContext, text);
    await ctx.reply(reply);
  } catch (error) {
    console.error('Telegram bot error:', error);
    
    if (error.message === 'No context selected') {
      await ctx.reply(
        '❓ Please select a mode first.\n' +
        'Use /switch to choose Client or Organization mode.'
      );
      return;
    }

    if (error.message === 'CONNECTION_FAILED') {
      await ctx.reply(
        '🔌 Unable to connect to CRM server.\n\n' +
        'Please make sure the backend server is running and try again.'
      );
      return;
    }

    // Handle Gemini history validation errors
    if (error.message && error.message.includes('First content should be with role')) {
      // Clear corrupted history and retry
      const sessionContext = sessionStore.getContext(chatId);
      sessionStore.reset(chatId);
      if (sessionContext) {
        sessionStore.setContext(chatId, sessionContext);
      }
      await ctx.reply(
        '🔄 Session reset due to an error. Please try your request again.'
      );
      return;
    }

    await ctx.reply('⚠️ Something went wrong while processing your request. Please try again in a moment.');
  }
});

// ============================================================
// BOT STARTUP
// ============================================================

async function startBot() {
  await bot.launch();
  console.log('🤖 Telegram MCP host is running.');
  console.log('   Client endpoint:', MCP_CLIENT_SSE_URL);
  console.log('   Org endpoint:', MCP_ORG_SSE_URL);
  process.once('SIGINT', () => {
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
  });
}

if (require.main === module) {
  startBot().catch(error => {
    console.error('Failed to start Telegram bot:', error);
    process.exit(1);
  });
}

module.exports = {
  startBot
};
