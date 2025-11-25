const db = require('../db/connection');

const CODE_REGEX = /^\d{6}$/;

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function resolveUserContext(chatId) {
  const [linked] = await db.query(
    'SELECT user_id FROM user_telegram_links WHERE telegram_chat_id = ? AND verified_at IS NOT NULL LIMIT 1',
    [chatId]
  );

  if (linked.length === 0) {
    return null;
  }

  const userId = linked[0].user_id;
  const [orgs] = await db.query(
    `
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = ?
      ORDER BY joined_at ASC
      LIMIT 1
    `,
    [userId]
  );

  if (orgs.length === 0) {
    const error = new Error('User has no organization membership');
    error.code = 'NO_ORG';
    throw error;
  }

  return {
    userId,
    organizationId: orgs[0].organization_id
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

module.exports = {
  resolveUserContext,
  tryVerifyLink,
  createVerificationCodeForUser,
  getLinkStatusForUser,
  CODE_REGEX
};

