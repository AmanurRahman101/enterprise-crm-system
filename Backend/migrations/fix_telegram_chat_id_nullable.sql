-- Migration: Make telegram_chat_id nullable
-- This allows pending verification codes to be created without a telegram_chat_id
-- The chat_id is only set when the user verifies their code in Telegram

ALTER TABLE user_telegram_links MODIFY telegram_chat_id BIGINT NULL;


