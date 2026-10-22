-- Add source message IDs so replies can be mapped back to the original message
-- in the other participant's private chat.
-- Back up the database and run this migration exactly once, after chat_messages exists.
ALTER TABLE chat_messages ADD COLUMN source_message_id INTEGER;
