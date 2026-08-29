-- Create "releases" table
CREATE TABLE `releases` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `created_at` datetime NULL,
  `updated_at` datetime NULL,
  `deleted_at` datetime NULL,
  `tag` text NOT NULL,
  `name` text NULL,
  `body` text NULL,
  `url` text NULL,
  `published_at` text NULL,
  `tldr` text NULL,
  `tldr_status` text NULL
);
-- Create index "idx_releases_tag" to table: "releases"
CREATE UNIQUE INDEX `idx_releases_tag` ON `releases` (`tag`);
-- Create index "idx_releases_deleted_at" to table: "releases"
CREATE INDEX `idx_releases_deleted_at` ON `releases` (`deleted_at`);
