/**
 * Session Store for Telegram Bot
 * Stores conversation history and user context (client/org mode)
 */

class SessionStore {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 30 * 60 * 1000; // 30 minutes default
    this.maxEntries = options.maxEntries || 20;
    this.sessions = new Map();
  }

  _key(chatId) {
    return String(chatId);
  }

  _purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.sessions.entries()) {
      if (now - entry.updatedAt > this.ttlMs) {
        this.sessions.delete(key);
      }
    }
  }

  _getOrCreate(chatId) {
    const key = this._key(chatId);
    let entry = this.sessions.get(key);
    if (!entry) {
      entry = {
        history: [],
        context: null, // { mode: 'client' | 'org', organizationId?: number, organizationName?: string, role?: string }
        updatedAt: Date.now()
      };
      this.sessions.set(key, entry);
    }
    return entry;
  }

  // ==================== CONTEXT MANAGEMENT ====================

  /**
   * Get the current context for a chat
   * @returns {object|null} { mode, organizationId?, organizationName?, role? }
   */
  getContext(chatId) {
    this._purgeExpired();
    const entry = this.sessions.get(this._key(chatId));
    return entry?.context || null;
  }

  /**
   * Set the context for a chat
   * @param {string|number} chatId 
   * @param {object} context { mode: 'client' | 'org', organizationId?, organizationName?, role? }
   */
  setContext(chatId, context) {
    const entry = this._getOrCreate(chatId);
    entry.context = context;
    entry.updatedAt = Date.now();
    // Clear history when switching context
    entry.history = [];
  }

  /**
   * Check if user has selected a context
   */
  hasContext(chatId) {
    const context = this.getContext(chatId);
    return context !== null;
  }

  /**
   * Clear the context (for /switch command)
   */
  clearContext(chatId) {
    const entry = this.sessions.get(this._key(chatId));
    if (entry) {
      entry.context = null;
      entry.history = [];
      entry.updatedAt = Date.now();
    }
  }

  // ==================== HISTORY MANAGEMENT ====================

  getHistory(chatId) {
    this._purgeExpired();
    const entry = this.sessions.get(this._key(chatId));
    return entry ? entry.history : [];
  }

  append(chatId, role, text) {
    if (!text) {
      return;
    }
    const entry = this._getOrCreate(chatId);
    entry.history.push({
      role,
      parts: [{ text }]
    });
    if (entry.history.length > this.maxEntries) {
      entry.history = entry.history.slice(-this.maxEntries);
    }
    entry.updatedAt = Date.now();
  }

  reset(chatId) {
    this.sessions.delete(this._key(chatId));
  }

  // ==================== PENDING SELECTION STATE ====================
  // Used to track multi-step selection (e.g., waiting for org selection)

  /**
   * Set pending state (e.g., 'awaiting_org_selection')
   */
  setPendingState(chatId, state, data = {}) {
    const entry = this._getOrCreate(chatId);
    entry.pendingState = state;
    entry.pendingData = data;
    entry.updatedAt = Date.now();
  }

  /**
   * Get pending state
   */
  getPendingState(chatId) {
    const entry = this.sessions.get(this._key(chatId));
    if (!entry) return null;
    return {
      state: entry.pendingState || null,
      data: entry.pendingData || {}
    };
  }

  /**
   * Clear pending state
   */
  clearPendingState(chatId) {
    const entry = this.sessions.get(this._key(chatId));
    if (entry) {
      entry.pendingState = null;
      entry.pendingData = {};
      entry.updatedAt = Date.now();
    }
  }
}

module.exports = {
  SessionStore
};
