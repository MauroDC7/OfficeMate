CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_expiration_index" on "cache"("expiration");
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_locks_expiration_index" on "cache_locks"("expiration");
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" text not null,
  "queue" text not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "timesheet_entries"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "worked_on" date not null,
  "title" varchar not null,
  "description" text,
  "client_name" varchar,
  "start_minutes" integer not null,
  "end_minutes" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "timesheet_entries_user_id_worked_on_index" on "timesheet_entries"(
  "user_id",
  "worked_on"
);
CREATE TABLE IF NOT EXISTS "timesheet_entry_proposals"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "worked_on" date not null,
  "title" varchar not null,
  "description" text,
  "client_name" varchar,
  "start_minutes" integer not null,
  "end_minutes" integer not null,
  "source" varchar not null default 'activitywatch',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "timesheet_entry_proposals_user_id_worked_on_index" on "timesheet_entry_proposals"(
  "user_id",
  "worked_on"
);
CREATE TABLE IF NOT EXISTS "personal_access_tokens"(
  "id" integer primary key autoincrement not null,
  "tokenable_type" varchar not null,
  "tokenable_id" integer not null,
  "name" text not null,
  "token" varchar not null,
  "abilities" text,
  "last_used_at" datetime,
  "expires_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" on "personal_access_tokens"(
  "tokenable_type",
  "tokenable_id"
);
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" on "personal_access_tokens"(
  "token"
);
CREATE INDEX "personal_access_tokens_expires_at_index" on "personal_access_tokens"(
  "expires_at"
);
CREATE TABLE IF NOT EXISTS "desktop_activities"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "app_name" varchar not null,
  "window_title" varchar not null,
  "browser_url" varchar,
  "browser_domain" varchar,
  "browser_tab_title" varchar,
  "started_at" datetime not null,
  "ended_at" datetime not null,
  "duration_seconds" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "desktop_activities_user_id_started_at_index" on "desktop_activities"(
  "user_id",
  "started_at"
);
CREATE TABLE IF NOT EXISTS "projects"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "client_name" varchar,
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE TABLE IF NOT EXISTS "leave_requests"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "starts_on" date not null,
  "ends_on" date not null,
  "status" varchar not null default 'pending',
  "label" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "leave_requests_user_id_status_index" on "leave_requests"(
  "user_id",
  "status"
);
CREATE INDEX "leave_requests_user_id_starts_on_index" on "leave_requests"(
  "user_id",
  "starts_on"
);
CREATE TABLE IF NOT EXISTS "organizations"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE TABLE IF NOT EXISTS "team_memberships"(
  "id" integer primary key autoincrement not null,
  "team_id" integer not null,
  "user_id" integer not null,
  "status" varchar not null default 'pending',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("team_id") references "teams"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "team_memberships_team_id_user_id_unique" on "team_memberships"(
  "team_id",
  "user_id"
);
CREATE INDEX "team_memberships_user_id_status_index" on "team_memberships"(
  "user_id",
  "status"
);
CREATE TABLE IF NOT EXISTS "teams"(
  "id" integer primary key autoincrement not null,
  "organization_id" integer not null,
  "parent_id" integer,
  "name" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "department" varchar,
  foreign key("organization_id") references "organizations"("id") on delete cascade,
  foreign key("parent_id") references "teams"("id") on delete set null
);
CREATE INDEX "teams_organization_id_parent_id_index" on "teams"(
  "organization_id",
  "parent_id"
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "first_name" varchar not null default(''),
  "last_name" varchar not null default(''),
  "role" varchar not null default('employee'),
  "username" varchar,
  "avatar_path" varchar,
  "google_id" varchar,
  "organization_id" integer,
  "privacy_policy_accepted_at" datetime,
  foreign key("organization_id") references "organizations"("id") on delete set null
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE UNIQUE INDEX "users_google_id_unique" on "users"("google_id");
CREATE UNIQUE INDEX "users_username_unique" on "users"("username");
CREATE TABLE IF NOT EXISTS "organization_invites"(
  "id" integer primary key autoincrement not null,
  "organization_id" integer not null,
  "created_by_user_id" integer not null,
  "redeemed_at" datetime,
  "redeemed_by_user_id" integer,
  "created_at" datetime,
  "updated_at" datetime,
  "email" varchar not null,
  "token" varchar not null,
  "expires_at" datetime not null,
  foreign key("organization_id") references "organizations"("id") on delete cascade,
  foreign key("created_by_user_id") references "users"("id") on delete cascade,
  foreign key("redeemed_by_user_id") references "users"("id") on delete set null
);
CREATE UNIQUE INDEX "organization_invites_token_unique" on "organization_invites"(
  "token"
);
CREATE TABLE IF NOT EXISTS "notifications"(
  "id" varchar not null,
  "type" varchar not null,
  "notifiable_type" varchar not null,
  "notifiable_id" integer not null,
  "data" text not null,
  "read_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  primary key("id")
);
CREATE INDEX "notifications_notifiable_type_notifiable_id_index" on "notifications"(
  "notifiable_type",
  "notifiable_id"
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2026_05_12_172032_add_profile_fields_to_users_table',1);
INSERT INTO migrations VALUES(5,'2026_05_13_095815_add_username_and_timezone_to_users_table',1);
INSERT INTO migrations VALUES(6,'2026_05_13_111257_remove_timezone_and_add_avatar_path_to_users_table',1);
INSERT INTO migrations VALUES(7,'2026_05_13_202247_create_timesheet_entries_table',1);
INSERT INTO migrations VALUES(8,'2026_05_15_133735_create_timesheet_entry_proposals_table',1);
INSERT INTO migrations VALUES(9,'2026_05_15_160209_create_personal_access_tokens_table',1);
INSERT INTO migrations VALUES(10,'2026_05_15_160252_create_desktop_activities_table',1);
INSERT INTO migrations VALUES(11,'2026_05_17_185927_add_google_id_to_users_table',2);
INSERT INTO migrations VALUES(12,'2026_05_19_113512_create_projects_table',3);
INSERT INTO migrations VALUES(13,'2026_05_19_135403_create_leave_requests_table',4);
INSERT INTO migrations VALUES(14,'2026_05_19_142925_create_organizations_table',5);
INSERT INTO migrations VALUES(15,'2026_05_19_142926_create_team_memberships_table',5);
INSERT INTO migrations VALUES(16,'2026_05_19_142926_create_teams_table',5);
INSERT INTO migrations VALUES(17,'2026_05_19_144603_add_organization_id_to_users_table',6);
INSERT INTO migrations VALUES(18,'2026_05_19_144603_create_organization_invites_table',6);
INSERT INTO migrations VALUES(19,'2026_05_19_142927_create_team_memberships_table',7);
INSERT INTO migrations VALUES(20,'2026_05_20_125038_replace_organization_invite_codes_with_email_invites',8);
INSERT INTO migrations VALUES(21,'2026_05_24_130410_add_approved_at_to_users_table',8);
INSERT INTO migrations VALUES(22,'2026_05_24_140746_create_notifications_table',8);
INSERT INTO migrations VALUES(23,'2026_05_24_150000_remove_approved_at_from_users_table',9);
INSERT INTO migrations VALUES(24,'2026_05_25_195311_add_department_to_teams_table',10);
INSERT INTO migrations VALUES(25,'2026_05_25_213951_add_privacy_policy_accepted_at_to_users_table',11);
