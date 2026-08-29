-- Create "users" table
CREATE TABLE `users` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `is_superuser` numeric NOT NULL DEFAULT false,
  `created_at` datetime NULL,
  `updated_at` datetime NULL
);
-- Create index "idx_users_email" to table: "users"
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
-- Create "permissions" table
CREATE TABLE `permissions` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `permission_key` text NOT NULL,
  `description` text NULL,
  `created_at` datetime NULL,
  `updated_at` datetime NULL
);
-- Create index "idx_permissions_key" to table: "permissions"
CREATE UNIQUE INDEX `idx_permissions_key` ON `permissions` (`permission_key`);
-- Create "auth_user_permissions" table
CREATE TABLE `auth_user_permissions` (
  `user_id` integer NULL,
  `permission_id` integer NULL,
  PRIMARY KEY (`user_id`, `permission_id`),
  CONSTRAINT `fk_auth_user_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_auth_user_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "groups" table
CREATE TABLE `groups` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `name` text NOT NULL,
  `created_at` datetime NULL,
  `updated_at` datetime NULL
);
-- Create index "idx_groups_name" to table: "groups"
CREATE UNIQUE INDEX `idx_groups_name` ON `groups` (`name`);
-- Create "auth_user_groups" table
CREATE TABLE `auth_user_groups` (
  `user_id` integer NULL,
  `group_id` integer NULL,
  PRIMARY KEY (`user_id`, `group_id`),
  CONSTRAINT `fk_auth_user_groups_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_auth_user_groups_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "refresh_tokens" table
CREATE TABLE `refresh_tokens` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime NULL,
  `replaced_by` integer NULL,
  `created_at` datetime NULL
);
-- Create index "idx_refresh_tokens_revoked_at" to table: "refresh_tokens"
CREATE INDEX `idx_refresh_tokens_revoked_at` ON `refresh_tokens` (`revoked_at`);
-- Create index "idx_refresh_tokens_expires_at" to table: "refresh_tokens"
CREATE INDEX `idx_refresh_tokens_expires_at` ON `refresh_tokens` (`expires_at`);
-- Create index "idx_refresh_tokens_token_hash" to table: "refresh_tokens"
CREATE UNIQUE INDEX `idx_refresh_tokens_token_hash` ON `refresh_tokens` (`token_hash`);
-- Create index "idx_refresh_tokens_user_id" to table: "refresh_tokens"
CREATE INDEX `idx_refresh_tokens_user_id` ON `refresh_tokens` (`user_id`);
-- Create "auth_group_permissions" table
CREATE TABLE `auth_group_permissions` (
  `group_id` integer NULL,
  `permission_id` integer NULL,
  PRIMARY KEY (`group_id`, `permission_id`),
  CONSTRAINT `fk_auth_group_permissions_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_auth_group_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "products" table
CREATE TABLE `products` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `created_at` datetime NULL,
  `updated_at` datetime NULL,
  `deleted_at` datetime NULL,
  `name` text NOT NULL,
  `price` integer NOT NULL
);
-- Create index "idx_products_deleted_at" to table: "products"
CREATE INDEX `idx_products_deleted_at` ON `products` (`deleted_at`);
