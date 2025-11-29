// Migration script to make telegram_chat_id nullable
require('dotenv').config();
const db = require('../db/connection');

async function runMigration() {
  console.log('Running migration: Make telegram_chat_id nullable...');
  
  try {
    await db.query('ALTER TABLE user_telegram_links MODIFY telegram_chat_id BIGINT NULL');
    console.log('✅ Migration successful: telegram_chat_id is now nullable');
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('⚠️  Column does not exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  }
  
  process.exit(0);
}

runMigration();


