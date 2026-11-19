-- Add column "disabled_at" to table: "users"
ALTER TABLE `users` ADD COLUMN `disabled_at` datetime NULL;
-- Add column "email_verified_at" to table: "users"
ALTER TABLE `users` ADD COLUMN `email_verified_at` datetime NULL;
-- Add column "verified_email" to table: "users"
ALTER TABLE `users` ADD COLUMN `verified_email` text NOT NULL DEFAULT '';
-- Create "auth_one_time_tokens" table
CREATE TABLE `auth_one_time_tokens` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `purpose` text NOT NULL,
  `token_hash` text NOT NULL,
  `email` text NOT NULL,
  `from_email` text NOT NULL DEFAULT '',
  `expires_at` datetime NOT NULL,
  `sent_at` datetime NULL,
  `used_at` datetime NULL,
  `created_at` datetime NULL
);
-- Create index "idx_auth_one_time_tokens_expires_at" to table: "auth_one_time_tokens"
CREATE INDEX `idx_auth_one_time_tokens_expires_at` ON `auth_one_time_tokens` (`expires_at`);
-- Create index "idx_auth_one_time_tokens_token_hash" to table: "auth_one_time_tokens"
CREATE UNIQUE INDEX `idx_auth_one_time_tokens_token_hash` ON `auth_one_time_tokens` (`token_hash`);
-- Create index "idx_auth_one_time_tokens_user_purpose" to table: "auth_one_time_tokens"
CREATE INDEX `idx_auth_one_time_tokens_user_purpose` ON `auth_one_time_tokens` (`user_id`, `purpose`);
-- Create "auth_audit_events" table
CREATE TABLE `auth_audit_events` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `occurred_at` datetime NOT NULL,
  `action` text NOT NULL,
  `actor_user_id` integer NULL,
  `target_user_id` integer NULL,
  `target_type` text NULL,
  `target_id` text NULL,
  `request_id` text NULL,
  `ip` text NULL,
  `user_agent` text NULL,
  `details` text NULL
);
-- Create index "idx_auth_audit_events_request_id" to table: "auth_audit_events"
CREATE INDEX `idx_auth_audit_events_request_id` ON `auth_audit_events` (`request_id`);
-- Create index "idx_auth_audit_events_target_user_id" to table: "auth_audit_events"
CREATE INDEX `idx_auth_audit_events_target_user_id` ON `auth_audit_events` (`target_user_id`);
-- Create index "idx_auth_audit_events_actor_user_id" to table: "auth_audit_events"
CREATE INDEX `idx_auth_audit_events_actor_user_id` ON `auth_audit_events` (`actor_user_id`);
-- Create index "idx_auth_audit_events_action" to table: "auth_audit_events"
CREATE INDEX `idx_auth_audit_events_action` ON `auth_audit_events` (`action`);
-- Create index "idx_auth_audit_events_occurred_at" to table: "auth_audit_events"
CREATE INDEX `idx_auth_audit_events_occurred_at` ON `auth_audit_events` (`occurred_at`);
-- Create "auth_totp_factors" table
CREATE TABLE `auth_totp_factors` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `secret` text NOT NULL,
  `confirmed_at` datetime NULL,
  `last_step` integer NOT NULL DEFAULT 0,
  `created_at` datetime NULL,
  `updated_at` datetime NULL
);
-- Create index "idx_auth_totp_factors_user_id" to table: "auth_totp_factors"
CREATE UNIQUE INDEX `idx_auth_totp_factors_user_id` ON `auth_totp_factors` (`user_id`);
-- Create "auth_recovery_codes" table
CREATE TABLE `auth_recovery_codes` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `code_hash` text NOT NULL,
  `used_at` datetime NULL,
  `created_at` datetime NULL
);
-- Create index "idx_auth_recovery_codes_code_hash" to table: "auth_recovery_codes"
CREATE UNIQUE INDEX `idx_auth_recovery_codes_code_hash` ON `auth_recovery_codes` (`code_hash`);
-- Create index "idx_auth_recovery_codes_user_id" to table: "auth_recovery_codes"
CREATE INDEX `idx_auth_recovery_codes_user_id` ON `auth_recovery_codes` (`user_id`);
-- Create "auth_identity_links" table
CREATE TABLE `auth_identity_links` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `provider` text NOT NULL,
  `subject_key` text NOT NULL,
  `subject` text NOT NULL,
  `email` text NOT NULL DEFAULT '',
  `last_used_at` datetime NULL,
  `created_at` datetime NULL
);
-- Create index "idx_auth_identity_links_provider_subject" to table: "auth_identity_links"
CREATE UNIQUE INDEX `idx_auth_identity_links_provider_subject` ON `auth_identity_links` (`provider`, `subject_key`);
-- Create index "idx_auth_identity_links_user_id" to table: "auth_identity_links"
CREATE INDEX `idx_auth_identity_links_user_id` ON `auth_identity_links` (`user_id`);
