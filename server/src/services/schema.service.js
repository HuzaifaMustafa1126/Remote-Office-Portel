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

export async function validateSchema() {
  const [rows] = await pool.execute(
    `SELECT table_name tableName FROM information_schema.tables
     WHERE table_schema=DATABASE() AND table_name IN (${requiredTables.map(() => "?").join(",")})`,
    requiredTables,
  );
  const found = new Set(rows.map((row) => row.tableName));
  const missing = requiredTables.filter((name) => !found.has(name));
  const [migrations] = await pool.execute(
    "SELECT migration_name migrationName,applied_at appliedAt FROM schema_migrations ORDER BY migration_name",
  );
  return { valid: missing.length === 0, missing, migrations };
}
