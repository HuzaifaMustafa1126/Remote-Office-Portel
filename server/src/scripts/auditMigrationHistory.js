import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import env from "../config/env.js";
import {
  assertMigrationLedger,
  auditCoverage,
  PROTECTED_MIGRATION_MAX_VERSION,
} from "./migrationSafety.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../database/migrations");

const repair = process.argv.includes("--repair");
const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: "utf8mb4_unicode_ci",
});
const exists = async (sql, params = []) =>
  Boolean((await connection.execute(sql, params))[0][0]?.yes);
const table = (name) =>
  exists(
    "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?) yes",
    [name],
  );
const column = (name, field) =>
  exists(
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?) yes",
    [name, field],
  );
const index = (name, key) =>
  exists(
    "SELECT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=?) yes",
    [name, key],
  );
const enumHas = (name, field, value) =>
  exists(
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=? AND column_type LIKE ?) yes",
    [name, field, `%${value}%`],
  );
const tables = async (names) =>
  (await Promise.all(names.map(table))).every(Boolean);
const columns = async (pairs) =>
  (await Promise.all(pairs.map((pair) => column(...pair)))).every(Boolean);
const indexes = async (pairs) =>
  (await Promise.all(pairs.map((pair) => index(...pair)))).every(Boolean);
const foreignKey = (tableName, constraintName, deleteRule) =>
  exists(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.referential_constraints
       WHERE constraint_schema=DATABASE() AND table_name=?
         AND constraint_name=? AND delete_rule=?
     ) yes`,
    [tableName, constraintName, deleteRule],
  );
const foreignKeys = async (values) =>
  (await Promise.all(values.map((value) => foreignKey(...value)))).every(Boolean);
const foreignKeyTarget = (tableName, columnName, referencedTable, deleteRule) =>
  exists(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.key_column_usage k
       JOIN information_schema.referential_constraints r
         ON r.constraint_schema=k.constraint_schema
        AND r.table_name=k.table_name
        AND r.constraint_name=k.constraint_name
       WHERE k.table_schema=DATABASE() AND k.table_name=?
         AND k.column_name=? AND k.referenced_table_name=?
         AND r.delete_rule=?
     ) yes`,
    [tableName, columnName, referencedTable, deleteRule],
  );
const permission = (name) =>
  exists("SELECT EXISTS(SELECT 1 FROM permissions WHERE name=?) yes", [name]);
const permissions = async (names) =>
  (await Promise.all(names.map(permission))).every(Boolean);
const policy = (eventType) =>
  exists(
    "SELECT EXISTS(SELECT 1 FROM notification_policies WHERE event_type=?) yes",
    [eventType],
  );
const policies = async (eventTypes) =>
  (await Promise.all(eventTypes.map(policy))).every(Boolean);
const roleHas = (role, permissionName) =>
  exists(
    "SELECT EXISTS(SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name=? AND p.name=?) yes",
    [role, permissionName],
  );
const roleLacks = async (role, names) =>
  (await Promise.all(names.map((name) => roleHas(role, name)))).every(
    (value) => !value,
  );

// Verify durable footprints without rewriting production configuration. The
// data-only migrations are never replayed during history reconciliation.
const checks = {
  "001_initial_schema.sql": () =>
    tables([
      "employees",
      "users",
      "roles",
      "permissions",
      "user_roles",
      "role_permissions",
      "audit_logs",
    ]),
  "002_attendance.sql": async () =>
    (await tables(["attendance_records", "attendance_breaks"])) &&
    (await permissions([
      "attendance.clock",
      "attendance.view_own",
      "attendance.view_all",
      "attendance.edit",
      "attendance.reports",
    ])),
  "003_attendance_eligibility.sql": async () =>
    (await column("employees", "track_attendance")) &&
    (await roleLacks("CEO", ["attendance.clock", "attendance.view_own"])),
  "004_leave_management.sql": async () =>
    (await tables(["leave_requests", "leave_days"])) &&
    (await enumHas("attendance_records", "status", "LEAVE")) &&
    (await permissions([
      "leave.create",
      "leave.view_own",
      "leave.view_all",
      "leave.approve",
      "leave.reject",
      "leave.cancel_own",
      "leave.reports",
    ])),
  "005_company_calendar.sql": async () =>
    (await table("company_calendar_days")) &&
    (await enumHas("attendance_records", "status", "WORKED_HOLIDAY")) &&
    (await enumHas("attendance_records", "day_status", "WORKED_HOLIDAY")) &&
    (await permissions(["calendar.view", "calendar.manage"])),
  "006_notifications.sql": () =>
    tables(["notifications", "notification_preferences"]),
  "007_employee_work_settings.sql": async () =>
    (await tables(["employee_work_settings", "employee_salary_profiles"])) &&
    (await columns([
      ["attendance_records", "scheduled_clock_in"],
      ["attendance_records", "scheduled_clock_out"],
      ["attendance_records", "grace_minutes"],
      ["attendance_records", "required_work_minutes"],
      ["attendance_records", "break_allowance_minutes"],
      ["attendance_records", "arrival_status"],
      ["attendance_records", "late_minutes"],
      ["attendance_records", "short_minutes"],
      ["attendance_records", "extra_minutes"],
      ["attendance_records", "break_exceeded_minutes"],
    ])),
  "008_night_shift_payroll_cycle.sql": async () =>
    (await tables(["work_shifts", "payroll_settings"])) &&
    (await columns([
      ["attendance_records", "work_date"],
      ["attendance_records", "shift_id"],
      ["attendance_records", "reconciliation_status"],
    ])) &&
    (await index("attendance_records", "idx_attendance_work_date")),
  "009_shift_assignments_payroll.sql": async () =>
    (await tables([
      "employee_shift_assignments",
      "payroll_runs",
      "payroll_items",
    ])) &&
    (await columns([
      ["work_shifts", "shift_span_minutes"],
      ["work_shifts", "required_work_minutes"],
      ["work_shifts", "break_allowance_minutes"],
      ["work_shifts", "created_by"],
    ])) &&
    (await enumHas(
      "attendance_records",
      "reconciliation_status",
      "HISTORICAL_REVIEW",
    )),
  "010_runtime_repair.sql": async () =>
    (await permissions([
      "dashboard.view",
      "employees.view_own",
      "attendance.clock",
      "attendance.view_own",
      "leave.create",
      "leave.view_own",
      "leave.cancel_own",
      "calendar.view",
      "shift.view",
      "salary.view_own",
      "payroll.view_own",
    ])) &&
    (await roleLacks("CEO", ["attendance.clock", "attendance.view_own"])),
  "011_reports_permissions_indexes.sql": () =>
    permissions(["reports.view", "reports.export"]),
  "012_payroll_salary_audit.sql": async () =>
    (await tables(["payroll_adjustments", "payroll_day_details"])) &&
    (await columns([
      ["audit_logs", "old_values"],
      ["audit_logs", "new_values"],
      ["audit_logs", "reason"],
      ["audit_logs", "payroll_period_start"],
      ["audit_logs", "payroll_period_end"],
      ["employee_salary_profiles", "change_reason"],
      ["payroll_runs", "reopened_by"],
      ["payroll_runs", "reopened_at"],
      ["payroll_runs", "reopen_reason"],
      ["payroll_runs", "payment_method"],
      ["payroll_runs", "payment_date"],
      ["payroll_runs", "payment_reference"],
      ["payroll_runs", "payment_note"],
      ["payroll_items", "per_day_salary"],
      ["payroll_items", "allowances"],
      ["payroll_items", "manual_deductions"],
      ["payroll_items", "positive_adjustments"],
      ["payroll_items", "negative_adjustments"],
      ["payroll_items", "gross_salary"],
      ["payroll_items", "total_deductions"],
      ["payroll_items", "calculation_status"],
    ])),
  "013_auth_sessions.sql": () => table("auth_sessions"),
  "014_employee_password_archive.sql": () =>
    columns([
      ["users", "password_changed_at"],
      ["users", "must_change_password"],
    ]),
  "015_remove_employee_archiving.sql": async () =>
    !(await column("employees", "deleted_at")) &&
    !(await column("employees", "deleted_by")),
  "016_fix_saturday_off_calendar_type.sql": () =>
    exists(
      "SELECT NOT EXISTS(SELECT 1 FROM company_calendar_days WHERE calendar_date='2026-09-05' AND day_type='WORKING_DAY' AND status='ACTIVE' AND title='Saturday Off' AND description='Saturday Off') yes",
    ),
  "017_repair_default_role_permissions.sql": () =>
    exists(
      "SELECT EXISTS(SELECT 1 FROM permissions WHERE name='dashboard.view') AND EXISTS(SELECT 1 FROM roles WHERE UPPER(name)='EMPLOYEE') yes",
    ),
  "018_mobile_portal_access.sql": () =>
    exists(
      "SELECT EXISTS(SELECT 1 FROM permissions WHERE name='portal.access_mobile') yes",
    ),
  "019_attendance_policy.sql": async () =>
    (await tables([
      "attendance_policies",
      "employee_late_counters",
      "attendance_late_events",
      "attendance_penalties",
      "payroll_attendance_penalties",
    ])) &&
    (await columns([
      ["attendance_records", "policy_id"],
      ["attendance_records", "policy_snapshot"],
      ["payroll_items", "late_penalty_days"],
    ])),
  "020_notification_push_subscriptions.sql": () =>
    table("notification_subscriptions"),
  "021_notification_announcement_preference.sql": () =>
    column("notification_preferences", "announcement_notifications"),
  "022_notification_policies.sql": async () =>
    (await tables([
      "notification_policies",
      "notification_policy_roles",
      "notification_policy_employees",
    ])) &&
    (await columns([
      ["notifications", "event_key"],
      ["notifications", "desktop_allowed"],
      ["notifications", "sound_allowed"],
    ])),
  "023_user_permission_overrides.sql": () => table("user_permission_overrides"),
  "024_task_management_phase1.sql": () =>
    tables([
      "tasks",
      "task_settings",
      "task_images",
      "task_comments",
      "task_activities",
      "task_change_requests",
      "task_assignment_history",
      "task_work_sessions",
    ]),
  "025_task_analytics_indexes.sql": () =>
    indexes([
      ["tasks", "idx_tasks_created_at"],
      ["tasks", "idx_tasks_completed_at"],
      ["tasks", "idx_tasks_due_completed"],
      ["tasks", "idx_tasks_assignee_created"],
    ]),
  "026_task_collaboration.sql": async () =>
    (await columns([
      ["task_comments", "parent_comment_id"],
      ["task_comments", "updated_at"],
      ["task_comments", "deleted_at"],
    ])) && (await tables(["task_attachments", "task_read_states"])),
  "027_break_task_session_integration.sql": () =>
    column("attendance_breaks", "paused_task_id"),
  "028_task_presence_indexes.sql": () =>
    index("auth_sessions", "idx_auth_sessions_presence"),
  "029_team_availability.sql": () => table("employee_availability_preferences"),
  "030_login_security.sql": async () =>
    (await table("login_failed_attempts")) &&
    (await columns([
      ["auth_sessions", "browser"],
      ["auth_sessions", "operating_system"],
      ["auth_sessions", "device_type"],
      ["auth_sessions", "login_at"],
      ["auth_sessions", "logout_at"],
      ["auth_sessions", "ended_reason"],
      ["auth_sessions", "is_new_ip"],
      ["auth_sessions", "is_new_device"],
    ])),
  "031_notification_preferences_v2.sql": async () =>
    (await table("notification_event_preferences")) &&
    (await columns([
      ["notification_preferences", "notifications_enabled"],
      ["notification_preferences", "in_app_enabled"],
      ["notification_preferences", "volume"],
      ["notifications", "category"],
      ["notifications", "priority"],
    ])),
  "032_notification_channel_delivery.sql": () =>
    column("notifications", "in_app_allowed"),
  "033_notification_sound_manager.sql": async () =>
    (await tables([
      "notification_sounds",
      "notification_sound_settings",
      "notification_sound_assignments",
    ])) && (await column("notification_preferences", "sound_id")),
  "034_task_notification_events.sql": () =>
    exists(
      "SELECT COUNT(DISTINCT event_type)=18 yes FROM notification_policies WHERE event_type IN('OPEN_TASK_CREATED','TASK_CLAIMED','TASK_ASSIGNED','TASK_REASSIGNED','TASK_UPDATED','TASK_STARTED','TASK_PAUSED','TASK_RESUMED','TASK_SUBMITTED','TASK_CHANGES_REQUIRED','TASK_COMPLETED','TASK_REOPENED','TASK_DEADLINE_CHANGED','TASK_PRIORITY_CHANGED','TASK_COMMENT','TASK_DUE_SOON','TASK_OVERDUE','TASK_DELETED')",
    ),
  "035_work_notes.sql": () =>
    tables([
      "note_categories",
      "work_notes",
      "note_tags",
      "note_tag_relations",
    ]),
  "036_advanced_work_notes.sql": async () =>
    (await tables([
      "note_templates",
      "note_comments",
      "note_bookmarks",
      "note_pins",
      "note_relations",
      "note_revisions",
      "note_recent_searches",
      "note_mentions",
    ])) &&
    (await columns([
      ["work_notes", "status"],
      ["work_notes", "is_knowledge"],
      ["work_notes", "knowledge_section"],
      ["work_notes", "company_pinned"],
      ["work_notes", "published_at"],
    ])),
  "037_note_attachments.sql": () => table("note_attachments"),
  "038_note_employee_collaboration_permissions.sql": () =>
    exists(
      "SELECT EXISTS(SELECT 1 FROM permissions WHERE name='notes.upload_attachment') yes",
    ),
  "039_simple_notes_phase_4_1.sql": async () =>
    (await table("note_images")) &&
    (await enumHas("work_notes", "visibility", "CEO_ONLY")) &&
    !(await enumHas("work_notes", "visibility", "MANAGEMENT")) &&
    (await exists(
      "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='work_notes' AND column_name='summary' AND is_nullable='NO' AND character_maximum_length=300) yes",
    )),
  "040_task_work_notes.sql": () => column("work_notes", "related_task_title"),
  "041_namaz_ongoing_work.sql": async () =>
    (await enumHas("employee_availability_preferences", "manual_status", "NAMAZ")) &&
    (await table("ongoing_work")) &&
    (await columns([
      ["ongoing_work", "employee_id"],
      ["ongoing_work", "title"],
      ["ongoing_work", "description"],
      ["ongoing_work", "status"],
      ["ongoing_work", "started_at"],
      ["ongoing_work", "completed_at"],
    ])) &&
    (await enumHas("ongoing_work", "status", "ONGOING")) &&
    (await enumHas("ongoing_work", "status", "PAUSED")) &&
    (await enumHas("ongoing_work", "status", "COMPLETED")) &&
    (await index("ongoing_work", "idx_ongoing_work_employee_status")) &&
    (await foreignKeyTarget(
      "ongoing_work",
      "employee_id",
      "employees",
      "CASCADE",
    )),
  "042_normalize_database_collations.sql": () =>
    exists(
      `SELECT
        (SELECT default_collation_name FROM information_schema.schemata
         WHERE schema_name=DATABASE())='utf8mb4_unicode_ci'
        AND NOT EXISTS(
          SELECT 1 FROM information_schema.tables
          WHERE table_schema=DATABASE() AND table_type='BASE TABLE'
            AND table_collation<>'utf8mb4_unicode_ci'
        )
        AND NOT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_schema=DATABASE() AND collation_name IS NOT NULL
            AND collation_name<>'utf8mb4_unicode_ci'
        ) yes`,
    ),
  "043_notes_notifications_sharing.sql": async () =>
    (await column("notification_preferences", "note_notifications")) &&
    (await table("note_reads")) &&
    (await index("note_reads", "PRIMARY")) &&
    (await index("note_reads", "idx_note_reads_user_read")) &&
    (await foreignKeys([
      ["note_reads", "fk_note_reads_note", "CASCADE"],
      ["note_reads", "fk_note_reads_user", "CASCADE"],
    ])) &&
    (await policies([
      "NOTE_TEAM_PUBLISHED",
      "NOTE_CEO_PUBLISHED",
      "NOTE_IMPORTANT_PUBLISHED",
      "NOTE_UPDATED",
      "NOTE_SHARED_TEAM",
    ])),
  "044_note_archive_timestamp.sql": async () =>
    (await column("work_notes", "archived_at")) &&
    (await index("work_notes", "idx_work_notes_archived_at")),
  "045_note_replies_mentions.sql": async () =>
    (await tables(["note_replies", "note_reply_mentions"])) &&
    (await indexes([
      ["note_replies", "idx_note_replies_note_created"],
      ["note_replies", "idx_note_replies_creator"],
      ["note_reply_mentions", "uq_note_reply_mention"],
      ["note_reply_mentions", "idx_note_reply_mentions_user"],
    ])) &&
    (await foreignKeyTarget(
      "note_replies",
      "note_id",
      "work_notes",
      "CASCADE",
    )) &&
    (await foreignKeyTarget(
      "note_replies",
      "created_by",
      "users",
      "RESTRICT",
    )) &&
    (await foreignKeyTarget(
      "note_reply_mentions",
      "reply_id",
      "note_replies",
      "CASCADE",
    )) &&
    (await foreignKeyTarget(
      "note_reply_mentions",
      "mentioned_user_id",
      "users",
      "CASCADE",
    )) &&
    (await policies(["NOTE_REPLY_CREATED", "NOTE_REPLY_MENTION"])),
  "046_note_shared_ceo_notification.sql": () => policy("NOTE_SHARED_CEO"),
  "047_notes_query_indexes.sql": () =>
    indexes([
      ["work_notes", "idx_work_notes_active_created"],
      ["work_notes", "idx_work_notes_active_important"],
      ["note_replies", "idx_note_replies_active"],
    ]),
  "048_availability_notifications.sql": async () =>
    (await column("notification_preferences", "availability_notifications")) &&
    (await policy("AVAILABILITY_CHANGED")),
};

const migrationFiles = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const { missingChecks, orphanChecks } = auditCoverage(
  migrationFiles,
  Object.keys(checks),
);
if (missingChecks.length) {
  for (const name of missingChecks)
    console.error(
      `Protected migration ${name} has no structural audit check. Refusing migration-history reconciliation.`,
    );
  await connection.end();
  process.exit(2);
}
if (orphanChecks.length) {
  for (const name of orphanChecks)
    console.error(`Structural audit check ${name} has no matching migration file.`);
  await connection.end();
  process.exit(2);
}

await connection.execute(`CREATE TABLE IF NOT EXISTS schema_migrations(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 migration_name VARCHAR(255) NOT NULL UNIQUE,
 applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
await assertMigrationLedger(connection);
const [rows] = await connection.execute(
  "SELECT migration_name FROM schema_migrations",
);
const recorded = new Set(rows.map((row) => row.migration_name)),
  results = [];
for (const [name, check] of Object.entries(checks)) {
  if (recorded.has(name)) {
    results.push({ name, status: "RECORDED" });
    continue;
  }
  results.push({
    name,
    status: (await check()) ? "SCHEMA_PRESENT" : "SCHEMA_MISSING",
  });
}
for (const result of results) console.log(`${result.status} ${result.name}`);
const unsafe = results.filter((result) => result.status === "SCHEMA_MISSING");
const repairable = results.filter(
  (result) => result.status === "SCHEMA_PRESENT",
);
if (unsafe.length) {
  console.error(
    `${unsafe.length} protected migration(s) require manual schema review. No migration history was changed.`,
  );
  process.exitCode = 2;
} else if (repair && repairable.length) {
  await connection.beginTransaction();
  try {
    for (const { name } of repairable) {
      await connection.execute(
        "INSERT IGNORE INTO schema_migrations(migration_name) VALUES(?)",
        [name],
      );
      console.log(`RECORDED_EXISTING ${name}`);
    }
    await connection.commit();
    console.log(`Reconciled ${repairable.length} protected migration record(s).`);
  } catch (error) {
    await connection.rollback();
    throw error;
  }
} else if (repairable.length) {
  console.log(
    `All ${repairable.length} missing protected migration record(s) are safe to reconcile. Re-run with --repair after taking a backup.`,
  );
} else
  console.log(
    `Migration history 001-${String(PROTECTED_MIGRATION_MAX_VERSION).padStart(3, "0")} is complete.`,
  );
await connection.end();
