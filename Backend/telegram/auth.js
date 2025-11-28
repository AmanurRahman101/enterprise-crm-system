const db = require('../db/connection');

const CODE_REGEX = /^\d{6}$/;

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Resolve user context from Telegram chat ID
 * Returns basic user info without requiring organization
 */
async function resolveUserContext(chatId) {
  const [linked] = await db.query(
    'SELECT user_id FROM user_telegram_links WHERE telegram_chat_id = ? AND verified_at IS NOT NULL LIMIT 1',
    [chatId]
  );

  if (linked.length === 0) {
    return null;
  }

  const userId = linked[0].user_id;
  
  const [users] = await db.query('SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1', [userId]);
  if (users.length === 0) {
    const error = new Error('Linked user account no longer exists');
    error.code = 'USER_MISSING';
    throw error;
  }

  return {
    userId,
    email: users[0].email,
    fullName: users[0].full_name
  };
}

/**
 * Get organizations the user is a MEMBER of
 * @returns {Array} [{ id, name, role }]
 */
async function getUserOrganizations(userId) {
  const [orgs] = await db.query(
    `SELECT o.id, o.name, uo.role
     FROM organizations o
     INNER JOIN user_organizations uo ON o.id = uo.organization_id
     WHERE uo.user_id = ?
     ORDER BY uo.joined_at ASC`,
    [userId]
  );
  return orgs;
}

/**
 * Get organizations where user is a CLIENT (listed as contact by email)
 * @returns {Array} [{ id, name }]
 */
async function getUserClientOrganizations(userId) {
  // Get user email
  const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
  if (users.length === 0) {
    return [];
  }
  const userEmail = users[0].email;

  // Find orgs where user's email is in contacts_people (excluding orgs they're a member of)
  const [contactPeopleOrgs] = await db.query(
    `SELECT DISTINCT o.id, o.name
     FROM organizations o
     INNER JOIN contacts_people cp ON o.id = cp.organization_id
     WHERE cp.email = ?
     AND o.id NOT IN (
       SELECT organization_id FROM user_organizations WHERE user_id = ?
     )`,
    [userEmail, userId]
  );

  // Find orgs where user's email is in contacts_organizations
  const [contactOrgsOrgs] = await db.query(
    `SELECT DISTINCT o.id, o.name
     FROM organizations o
     INNER JOIN contacts_organizations co ON o.id = co.organization_id
     WHERE co.email = ?
     AND o.id NOT IN (
       SELECT organization_id FROM user_organizations WHERE user_id = ?
     )`,
    [userEmail, userId]
  );

  // Combine and dedupe
  const orgMap = new Map();
  for (const org of [...contactPeopleOrgs, ...contactOrgsOrgs]) {
    if (!orgMap.has(org.id)) {
      orgMap.set(org.id, { id: org.id, name: org.name });
    }
  }

  return Array.from(orgMap.values());
}

/**
 * Check if user has any organizations (either as member or client)
 */
async function getUserAccessSummary(userId) {
  const memberOrgs = await getUserOrganizations(userId);
  const clientOrgs = await getUserClientOrganizations(userId);

  return {
    memberOrganizations: memberOrgs,
    clientOrganizations: clientOrgs,
    hasMemberAccess: memberOrgs.length > 0,
    hasClientAccess: clientOrgs.length > 0,
    hasAnyAccess: memberOrgs.length > 0 || clientOrgs.length > 0
  };
}

async function tryVerifyLink(chatId, text) {
  const normalized = (text || '').trim();
  if (!CODE_REGEX.test(normalized)) {
    return false;
  }

  const [pending] = await db.query(
    'SELECT id, user_id FROM user_telegram_links WHERE verification_code = ? AND verified_at IS NULL LIMIT 1',
    [normalized]
  );

  if (pending.length === 0) {
    return false;
  }

  await db.query(
    `
      UPDATE user_telegram_links
      SET telegram_chat_id = ?, verified_at = NOW()
      WHERE verification_code = ? AND verified_at IS NULL
    `,
    [chatId, normalized]
  );

  return true;
}

async function createVerificationCodeForUser(userId) {
  const code = generateSixDigitCode();
  await db.query(
    'DELETE FROM user_telegram_links WHERE user_id = ? AND verified_at IS NULL',
    [userId]
  );
  await db.query(
    'INSERT INTO user_telegram_links (user_id, verification_code) VALUES (?, ?)',
    [userId, code]
  );
  const [rows] = await db.query(
    `
      SELECT verification_code, created_at
      FROM user_telegram_links
      WHERE user_id = ? AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  const entry = rows[0];
  return {
    verificationCode: code,
    generatedAt: entry?.created_at || new Date()
  };
}

async function getLinkStatusForUser(userId) {
  const [pending] = await db.query(
    `
      SELECT verification_code, created_at, telegram_chat_id, verified_at
      FROM user_telegram_links
      WHERE user_id = ? AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  if (pending.length > 0) {
    return {
      state: 'pending',
      entry: pending[0]
    };
  }

  const [linked] = await db.query(
    `
      SELECT verification_code, created_at, telegram_chat_id, verified_at
      FROM user_telegram_links
      WHERE user_id = ? AND verified_at IS NOT NULL
      ORDER BY verified_at DESC
      LIMIT 1
    `,
    [userId]
  );

  if (linked.length > 0) {
    return {
      state: 'linked',
      entry: linked[0]
    };
  }

  return {
    state: 'not_linked',
    entry: null
  };
}

/**
 * Unlink Telegram account for a user
 * Removes all telegram links (both pending and verified) for the user
 */
async function unlinkTelegramForUser(userId) {
  const [result] = await db.query(
    'DELETE FROM user_telegram_links WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows > 0;
}

/**
 * Unlink Telegram account by chat ID (for bot /unlink command)
 * Returns the user ID that was unlinked, or null if not found
 */
async function unlinkTelegramByChatId(chatId) {
  const [linked] = await db.query(
    'SELECT user_id FROM user_telegram_links WHERE telegram_chat_id = ? AND verified_at IS NOT NULL LIMIT 1',
    [chatId]
  );

  if (linked.length === 0) {
    return null;
  }

  const userId = linked[0].user_id;
  await db.query(
    'DELETE FROM user_telegram_links WHERE telegram_chat_id = ?',
    [chatId]
  );

  return userId;
}

module.exports = {
  resolveUserContext,
  getUserOrganizations,
  getUserClientOrganizations,
  getUserAccessSummary,
  tryVerifyLink,
  createVerificationCodeForUser,
  getLinkStatusForUser,
  unlinkTelegramForUser,
  unlinkTelegramByChatId,
  CODE_REGEX
};
