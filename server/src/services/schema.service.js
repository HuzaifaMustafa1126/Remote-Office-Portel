import pool from "../config/database.js";

const requiredTables = [
  "attendance_records",
  "attendance_breaks",
  "leave_requests",
  "leave_days",
  "company_calendar_days",
  "work_shifts",
  "employee_shift_assignments",
  "employee_salary_profiles",
  "payroll_runs",
  "payroll_items",
  "notifications",
  "auth_sessions",
  "attendance_policies",
  "employee_late_counters",
  "attendance_late_events",
  "attendance_penalties",
  "notification_subscriptions",
  "notification_policies",
  "notification_event_preferences",
  "notification_sounds",
  "notification_sound_settings",
  "notification_sound_assignments",
  "user_permission_overrides",
  "tasks",
  "task_settings",
  "task_activities",
  "task_work_sessions",
  "task_images",
  "task_comments",
  "task_change_requests",
  "task_assignment_history",
  "employee_availability_preferences",
  "login_failed_attempts",
  "work_notes",
  "note_categories",
  "note_tags",
  "note_tag_relations",
  "note_templates",
  "note_comments",
  "note_bookmarks",
  "note_pins",
  "note_relations",
  "note_revisions",
  "note_recent_searches",
  "note_mentions",
  "note_attachments",
  "note_images",
  "note_replies",
  "note_reply_mentions",
  "ongoing_work",
  "ongoing_work_sessions",
];
const requiredColumns = {
  users: ["password_hash", "password_changed_at", "must_change_password"],
  audit_logs: ["old_values", "new_values", "reason"],
  employee_salary_profiles: ["change_reason"],
  attendance_breaks: ["paused_task_id", "auto_paused_ongoing_work_id"],
  ongoing_work: ["completion_note", "total_duration_seconds"],
  ongoing_work_sessions: [
    "ongoing_work_id",
    "employee_id",
    "user_id",
    "started_at",
    "ended_at",
    "duration_seconds",
    "active_employee_id",
    "attendance_record_id",
  ],
  notification_preferences: ["availability_notifications"],
  auth_sessions: [
    "browser",
    "operating_system",
    "device_type",
    "login_at",
    "logout_at",
    "ended_reason",
    "is_new_ip",
    "is_new_device",
  ],
};
const requiredMigrations = [
  "014_employee_password_archive.sql",
  "015_remove_employee_archiving.sql",
  "016_fix_saturday_off_calendar_type.sql",
  "017_repair_default_role_permissions.sql",
  "018_mobile_portal_access.sql",
  "019_attendance_policy.sql",
  "020_notification_push_subscriptions.sql",
  "021_notification_announcement_preference.sql",
  "022_notification_policies.sql",
  "023_user_permission_overrides.sql",
  "024_task_management_phase1.sql",
  "025_task_analytics_indexes.sql",
  "026_task_collaboration.sql",
  "027_break_task_session_integration.sql",
  "028_task_presence_indexes.sql",
  "029_team_availability.sql",
  "030_login_security.sql",
  "031_notification_preferences_v2.sql",
  "032_notification_channel_delivery.sql",
  "033_notification_sound_manager.sql",
  "034_task_notification_events.sql",
  "035_work_notes.sql",
  "036_advanced_work_notes.sql",
  "037_note_attachments.sql",
  "038_note_employee_collaboration_permissions.sql",
  "039_simple_notes_phase_4_1.sql",
  "040_task_work_notes.sql",
  "041_namaz_ongoing_work.sql",
  "042_normalize_database_collations.sql",
  "043_notes_notifications_sharing.sql",
  "044_note_archive_timestamp.sql",
  "045_note_replies_mentions.sql",
  "046_note_shared_ceo_notification.sql",
  "047_notes_query_indexes.sql",
  "048_availability_notifications.sql",
  "049_ongoing_work_multiple_items.sql",
  "050_ongoing_work_time_tracking.sql",
  "051_team_ongoing_work_monitoring.sql",
  "052_ongoing_work_attendance_link.sql",
  "053_break_ongoing_work_context.sql",
];

export async function validateSchema() {
  const [rows] = await pool.execute(
    `SELECT table_name tableName FROM information_schema.tables
     WHERE table_schema=DATABASE() AND table_name IN (${requiredTables.map(() => "?").join(",")})`,
    requiredTables,
  );
  const found = new Set(rows.map((row) => row.tableName));
  const missing = requiredTables.filter((name) => !found.has(name));
  const columnPairs = Object.entries(requiredColumns).flatMap(
    ([table, columns]) => columns.map((column) => [table, column]),
  );
  const [columnRows] = await pool.execute(
    `SELECT table_name tableName,column_name columnName FROM information_schema.columns
     WHERE table_schema=DATABASE() AND (${columnPairs.map(() => "(table_name=? AND column_name=?)").join(" OR ")})`,
    columnPairs.flat(),
  );
  const foundColumns = new Set(
    columnRows.map((row) => `${row.tableName}.${row.columnName}`),
  );
  const missingColumns = columnPairs
    .map(([table, column]) => `${table}.${column}`)
    .filter((name) => !foundColumns.has(name));
  const [migrations] = await pool.execute(
    "SELECT migration_name migrationName,applied_at appliedAt FROM schema_migrations ORDER BY migration_name",
  );
  const applied = new Set(migrations.map((row) => row.migrationName));
  const missingMigrations = requiredMigrations.filter(
    (name) => !applied.has(name),
  );
  return {
    valid:
      missing.length === 0 &&
      missingColumns.length === 0 &&
      missingMigrations.length === 0,
    missing,
    missingColumns,
    missingMigrations,
    migrations,
  };
}
