require('dotenv').config();
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const {
  resolveUserContext,
  tryVerifyLink
} = require('./telegram/auth');
const { SessionStore } = require('./telegram/sessionStore');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MCP_SSE_URL = process.env.MCP_SSE_URL || 'http://localhost:3000/mcp/sse';

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

async function createMcpClient() {
  const baseUrl = new URL(MCP_SSE_URL);
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

function buildSystemInstruction(organizationId) {
  return `
You are Tawasol CRM's assistant. Always keep responses concise (<= 6 sentences).
You have deterministic SQL tools and must scope every call to organization_id=${organizationId}.
Never leak other tenant data. If the model forgets the organization_id, inject {"organizationId": ${organizationId}} yourself.
Return actionable summaries referencing deal/contact/issue names and highlight blockers when present.
`;
}

async function runAgent(chatId, { organizationId }, userText) {
  const { client, transport } = await createMcpClient();
  try {
    const { tools } = await client.listTools();
    const geminiTools = mapTools(tools);
    const history = sessionStore.getHistory(chatId);

    const chat = model.startChat({
      tools: geminiTools,
      history,
      systemInstruction: {
        role: 'system',
        parts: [{ text: buildSystemInstruction(organizationId) }]
      }
    });

    const initial = await chat.sendMessage(userText);
    const response = await initial.response;
    const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : undefined;

    if (functionCalls && functionCalls.length > 0) {
      const toolResults = await Promise.all(
        functionCalls.map(async call => {
          const args = { ...(call.args || {}) };
          args.organizationId = organizationId;
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
          response: { content: result.result }
        }
      }));

      const finalMessage = await chat.sendMessage(responseParts);
      const finalResponse = await finalMessage.response;
      const finalText = finalResponse.text?.() || finalResponse.text || 'I was unable to compose a reply.';

      sessionStore.append(chatId, 'user', userText);
      sessionStore.append(chatId, 'model', finalText);

      return finalText;
    }

    const text = response.text?.() || response.text || 'I did not find anything to share yet.';
    sessionStore.append(chatId, 'user', userText);
    sessionStore.append(chatId, 'model', text);
    return text;
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

bot.start(ctx =>
  ctx.reply(
    '👋 Hi! I am your Tawasol CRM assistant. Ask me about deals, contacts, or issues once your account is linked.'
  )
);

bot.on('text', async ctx => {
  const chatId = ctx.chat.id;
  const text = (ctx.message.text || '').trim();
  if (!text) {
    return;
  }

  try {
    const context = await resolveUserContext(chatId);
    if (!context) {
      const verified = await tryVerifyLink(chatId, text);
      if (verified) {
        await ctx.reply('✅ Account linked successfully! Ask me about your CRM data any time.');
      } else {
        await ctx.reply(
          '🔐 Please link your CRM account first:\n1. Open CRM Settings → Telegram\n2. Generate a 6-digit code\n3. Send the code here to link this chat.'
        );
      }
      return;
    }

    const reply = await runAgent(chatId, context, text);
    await ctx.reply(reply);
  } catch (error) {
    console.error('Telegram bot error:', error);
    if (error.code === 'NO_ORG') {
      await ctx.reply('❌ Your account is not part of any organization yet. Please join one and try again.');
      return;
    }
    await ctx.reply('⚠️ Something went wrong while processing your request. Please try again in a moment.');
  }
});

async function startBot() {
  await bot.launch();
  console.log('🤖 Telegram MCP host is running.');
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

