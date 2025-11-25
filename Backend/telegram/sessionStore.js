class SessionStore {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 15 * 60 * 1000;
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

  getHistory(chatId) {
    this._purgeExpired();
    const entry = this.sessions.get(this._key(chatId));
    return entry ? entry.history : [];
  }

  append(chatId, role, text) {
    if (!text) {
      return;
    }
    const key = this._key(chatId);
    const historyEntry =
      this.sessions.get(key) ||
      {
        history: [],
        updatedAt: Date.now()
      };
    historyEntry.history.push({
      role,
      parts: [{ text }]
    });
    if (historyEntry.history.length > this.maxEntries) {
      historyEntry.history = historyEntry.history.slice(-this.maxEntries);
    }
    historyEntry.updatedAt = Date.now();
    this.sessions.set(key, historyEntry);
  }

  reset(chatId) {
    this.sessions.delete(this._key(chatId));
  }
}

module.exports = {
  SessionStore
};

