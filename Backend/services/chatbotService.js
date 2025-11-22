// Chatbot Service (Gemini AI Integration)
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db/connection');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not configured. Chatbot will not work.');
}

// Session storage (in-memory, use Redis in production)
const sessions = new Map();

// Get or create session
const getSession = (userId, organizationId) => {
  const key = `${userId}:${organizationId}`;
  if (!sessions.has(key)) {
    sessions.set(key, {
      history: [],
      createdAt: new Date()
    });
  }
  return sessions.get(key);
};

// Chat with AI
const chat = async (userId, organizationId, message) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Validate organization membership
  const [memberships] = await db.query(
    'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
    [userId, organizationId]
  );

  if (memberships.length === 0) {
    throw new Error('User is not a member of this organization');
  }

  const session = getSession(userId, organizationId);
  
  // Get organization context (deals, contacts, issues)
  const [deals] = await db.query(
    'SELECT title, value, stage_id FROM deals WHERE organization_id = ? LIMIT 10',
    [organizationId]
  );

  const [contacts] = await db.query(
    `SELECT first_name, last_name, email FROM contacts_people WHERE organization_id = ? LIMIT 10
     UNION
     SELECT name as first_name, '' as last_name, email FROM contacts_organizations WHERE organization_id = ? LIMIT 10`,
    [organizationId, organizationId]
  );

  const [issues] = await db.query(
    'SELECT title, status, priority FROM issues WHERE organization_id = ? LIMIT 10',
    [organizationId]
  );

  // Build context prompt
  const context = `
You are an AI assistant for a CRM system. The user is asking about their organization's data.

Organization Context:
- Deals: ${deals.length} deals (${deals.map(d => d.title).join(', ')})
- Contacts: ${contacts.length} contacts
- Issues: ${issues.length} issues

Answer questions about deals, contacts, issues, and general CRM operations. Be helpful and concise.
  `;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build conversation history
    const conversationHistory = session.history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add system context
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: context }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will help you with your CRM data.' }]
        },
        ...conversationHistory
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Save to session history
    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'assistant', content: text });

    // Keep history limited to last 20 messages
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    return text;
  } catch (error) {
    console.error('Chatbot error:', error);
    throw new Error('Failed to get AI response');
  }
};

module.exports = {
  chat,
  getSession
};

