-- Add Telegram notification support to settings
alter table settings
  add column if not exists alert_recipient_telegram_chat_id text;
