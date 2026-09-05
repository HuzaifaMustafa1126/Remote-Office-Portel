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
];
const requiredColumns = {
  users: ["password_hash", "password_changed_at", "must_change_password"],
  audit_logs: ["old_values", "new_values", "reason"],
  employee_salary_profiles: ["change_reason"],
};
const requiredMigrations = [
  "018_mobile_portal_access.sql",
  "014_employee_password_archive.sql",
  "015_remove_employee_archiving.sql",
  "016_fix_saturday_off_calendar_type.sql",
  "017_repair_default_role_permissions.sql",
];

export async function validateSchema() {
  const [rows] = await pool.execute(
    `SELECT table_name tableName FROM information_schema.tables
     WHERE table_schema=DATABASE() AND table_name IN (${requiredTables.map(() => "?").join(",")})`,
    requiredTables,
  );
  const found = new Set(rows.map((row) => row.tableName));
  const missing = requiredTables.filter((name) => !found.has(name));
  const columnPairs = Object.entries(requiredColumns).flatMap(([table, columns]) =>
    columns.map((column) => [table, column]),
  );
  const [columnRows] = await pool.execute(
    `SELECT table_name tableName,column_name columnName FROM information_schema.columns
     WHERE table_schema=DATABASE() AND (${columnPairs.map(() => "(table_name=? AND column_name=?)").join(" OR ")})`,
    columnPairs.flat(),
  );
  const foundColumns = new Set(columnRows.map((row) => `${row.tableName}.${row.columnName}`));
  const missingColumns = columnPairs
    .map(([table, column]) => `${table}.${column}`)
    .filter((name) => !foundColumns.has(name));
  const [migrations] = await pool.execute(
    "SELECT migration_name migrationName,applied_at appliedAt FROM schema_migrations ORDER BY migration_name",
  );
  const applied = new Set(migrations.map((row) => row.migrationName));
  const missingMigrations = requiredMigrations.filter((name) => !applied.has(name));
  return {
    valid: missing.length === 0 && missingColumns.length === 0 && missingMigrations.length === 0,
    missing,
    missingColumns,
    missingMigrations,
    migrations,
  };
}
