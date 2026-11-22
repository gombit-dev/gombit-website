-- Add column "session_id" to table: "refresh_tokens"
ALTER TABLE `refresh_tokens` ADD COLUMN `session_id` text NULL;
-- Add column "user_agent" to table: "refresh_tokens"
ALTER TABLE `refresh_tokens` ADD COLUMN `user_agent` text NULL;
-- Add column "client_address" to table: "refresh_tokens"
ALTER TABLE `refresh_tokens` ADD COLUMN `client_address` text NULL;
-- Add column "location" to table: "refresh_tokens"
ALTER TABLE `refresh_tokens` ADD COLUMN `location` text NULL;
-- Create index "idx_refresh_tokens_session_id" to table: "refresh_tokens"
CREATE INDEX `idx_refresh_tokens_session_id` ON `refresh_tokens` (`session_id`);
