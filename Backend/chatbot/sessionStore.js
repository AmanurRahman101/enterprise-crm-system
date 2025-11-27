/**
 * Session Store for Web Chatbot (HudHud)
 * Stores conversation history and user context
 * Similar to telegram/sessionStore.js but keyed by userId + organizationId
 */

class WebChatbotSessionStore {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 30 * 60 * 1000; // 30 minutes default
    this.maxEntries = options.maxEntries || 20;
    this.sessions = new Map();
  }

  /**
   * Generate session key from user context
   * Key format: "userId:organizationId" or "userId:client" for client mode
   */
  _key(userId, organizationId) {
    if (organizationId) {
      return `${userId}:${organizationId}`;
    }
    return `${userId}:client`;
  }

  _purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.sessions.entries()) {
      if (now - entry.updatedAt > this.ttlMs) {
        this.sessions.delete(key);
      }
    }
  }

  _getOrCreate(userId, organizationId) {
    const key = this._key(userId, organizationId);
    let entry = this.sessions.get(key);
    if (!entry) {
      entry = {
        history: [],
        context: {
          mode: organizationId ? 'org' : 'client',
          organizationId: organizationId || null,
          organizationName: null,
          role: null
        },
        updatedAt: Date.now()
      };
      this.sessions.set(key, entry);
    }
    return entry;
  }

  // ==================== CONTEXT MANAGEMENT ====================

  /**
   * Get the current context for a session
   * @returns {object|null} { mode, organizationId?, organizationName?, role? }
   */
  getContext(userId, organizationId) {
    this._purgeExpired();
    const key = this._key(userId, organizationId);
    const entry = this.sessions.get(key);
    return entry?.context || null;
  }

  /**
   * Set/update the context for a session
   * @param {number} userId 
   * @param {number|null} organizationId
   * @param {object} contextData { organizationName?, role? }
   */
  setContext(userId, organizationId, contextData = {}) {
    const entry = this._getOrCreate(userId, organizationId);
    entry.context = {
      mode: organizationId ? 'org' : 'client',
      organizationId: organizationId || null,
      organizationName: contextData.organizationName || null,
      role: contextData.role || null
    };
    entry.updatedAt = Date.now();
  }

  /**
   * Check if session exists
   */
  hasSession(userId, organizationId) {
    const key = this._key(userId, organizationId);
    return this.sessions.has(key);
  }

  // ==================== HISTORY MANAGEMENT ====================

  /**
   * Get conversation history for Gemini
   * @returns {Array} Array of { role: 'user'|'model', parts: [{ text }] }
   */
  getHistory(userId, organizationId) {
    this._purgeExpired();
    const key = this._key(userId, organizationId);
    const entry = this.sessions.get(key);
    return entry ? entry.history : [];
  }

  /**
   * Append a message to history
   * @param {number} userId
   * @param {number|null} organizationId
   * @param {string} role 'user' or 'model'
   * @param {string} text Message text
   */
  append(userId, organizationId, role, text) {
    if (!text) {
      return;
    }
    const entry = this._getOrCreate(userId, organizationId);
    entry.history.push({
      role,
      parts: [{ text }]
    });
    // Keep history limited
    if (entry.history.length > this.maxEntries) {
      entry.history = entry.history.slice(-this.maxEntries);
    }
    entry.updatedAt = Date.now();
  }

  /**
   * Clear history but keep context
   */
  clearHistory(userId, organizationId) {
    const key = this._key(userId, organizationId);
    const entry = this.sessions.get(key);
    if (entry) {
      entry.history = [];
      entry.updatedAt = Date.now();
    }
  }

  /**
   * Reset entire session (history + context)
   */
  reset(userId, organizationId) {
    const key = this._key(userId, organizationId);
    this.sessions.delete(key);
  }

  /**
   * Validate and clean conversation history for Gemini
   * Gemini requires history to start with 'user' role
   */
  cleanHistory(history) {
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
}

// Singleton instance
const sessionStore = new WebChatbotSessionStore();

module.exports = {
  WebChatbotSessionStore,
  sessionStore
};
