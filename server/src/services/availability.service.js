import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";

export const AVAILABILITY = Object.freeze({
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  ON_BREAK: "ON_BREAK",
  AWAY: "AWAY",
  DO_NOT_DISTURB: "DO_NOT_DISTURB",
  IN_MEETING: "IN_MEETING",
});

export function resolveEmployeeAvailability(row, now = new Date()) {
  const lastSeen = row.lastSeenAt ? new Date(row.lastSeenAt) : null;
  const timeoutMs = Number(row.timeoutMinutes || 5) * 60_000;
  const present = Boolean(
    lastSeen &&
      Number.isFinite(lastSeen.getTime()) &&
      now.getTime() - lastSeen.getTime() <= timeoutMs,
  );
  if (!present) return AVAILABILITY.OFFLINE;
  if (Boolean(row.activeBreak)) return AVAILABILITY.ON_BREAK;
  const until = row.manualStatusUntil ? new Date(row.manualStatusUntil) : null;
  const manualValid =
    row.manualStatus &&
    (!until || (Number.isFinite(until.getTime()) && until.getTime() > now.getTime()));
  return manualValid && Object.hasOwn(AVAILABILITY, row.manualStatus)
    ? row.manualStatus
    : AVAILABILITY.ONLINE;
}

async function baseRows(executor = pool, employeeId = null) {
  const [rows] = await executor.execute(
    `SELECT e.id employeeId,CONCAT(e.first_name,' ',e.last_name) employeeName,
      e.employee_code employeeCode,e.job_title jobTitle,e.department,
      COALESCE(role_names.roles,'Employee') role,
      session_seen.lastSeenAt,p.manual_status manualStatus,
      p.manual_status_until manualStatusUntil,p.status_note statusNote,
      p.status_updated_at statusUpdatedAt,
      EXISTS(
        SELECT 1 FROM attendance_records ar
        JOIN attendance_breaks ab ON ab.attendance_id=ar.id AND ab.status='ACTIVE'
        WHERE ar.employee_id=e.id AND ar.status='ON_BREAK'
      ) activeBreak,
      EXISTS(
        SELECT 1 FROM attendance_records ar
        WHERE ar.employee_id=e.id AND ar.status IN ('WORKING','ON_BREAK')
      ) clockedIn,
      ts.offline_timeout_minutes timeoutMinutes,CURRENT_TIMESTAMP serverTime
     FROM employees e
     CROSS JOIN task_settings ts
     LEFT JOIN employee_availability_preferences p ON p.employee_id=e.id
     LEFT JOIN (
       SELECT u.employee_id,MAX(s.last_seen_at) lastSeenAt
       FROM users u JOIN auth_sessions s ON s.user_id=u.id
       WHERE u.status='ACTIVE' AND s.status='ACTIVE' AND s.revoked_at IS NULL
         AND s.expires_at>CURRENT_TIMESTAMP
       GROUP BY u.employee_id
     ) session_seen ON session_seen.employee_id=e.id
     LEFT JOIN (
       SELECT u.employee_id,GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') roles
       FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id
       LEFT JOIN roles r ON r.id=ur.role_id GROUP BY u.employee_id
     ) role_names ON role_names.employee_id=e.id
     WHERE e.status='ACTIVE' AND ts.id=1 AND (? IS NULL OR e.id=?)
     ORDER BY e.first_name,e.last_name`,
    [employeeId, employeeId],
  );
  return rows;
}

function publicRow(row) {
  const now = new Date(row.serverTime);
  const availability = resolveEmployeeAvailability(row, now);
  const until = row.manualStatusUntil ? new Date(row.manualStatusUntil) : null;
  const manualActive = Boolean(until ? until > now : row.manualStatus);
  return {
    employeeId: Number(row.employeeId),
    employeeName: row.employeeName,
    employeeCode: row.employeeCode,
    jobTitle: row.jobTitle,
    department: row.department,
    role: row.role,
    availability,
    attendance: row.clockedIn ? (row.activeBreak ? "ON_BREAK" : "CLOCKED_IN") : "CLOCKED_OUT",
    statusUntil: manualActive && availability !== "OFFLINE" && availability !== "ON_BREAK" ? row.manualStatusUntil : null,
    statusNote: manualActive && availability !== "OFFLINE" ? row.statusNote : null,
    lastSeenAt: row.lastSeenAt,
  };
}

export async function getTeamAvailability() {
  const rows = await baseRows();
  const employees = rows.map(publicRow);
  const counts = Object.fromEntries(Object.values(AVAILABILITY).map((key) => [key, 0]));
  for (const employee of employees) counts[employee.availability] += 1;
  return {
    counts,
    employees,
    serverTime: rows[0]?.serverTime || new Date().toISOString(),
    timeoutMinutes: Number(rows[0]?.timeoutMinutes || 5),
  };
}

export async function getMyAvailability(user) {
  if (!user.employee_id) throw new ApiError(403, "This account is not linked to an employee");
  const rows = await baseRows(pool, user.employee_id);
  if (!rows[0]) throw new ApiError(404, "Employee is unavailable");
  return {
    ...publicRow(rows[0]),
    manualStatus: rows[0].manualStatus || null,
    manualStatusUntil: rows[0].manualStatusUntil || null,
  };
}

export async function setManualAvailability(data, user) {
  if (!user.employee_id) throw new ApiError(403, "This account is not linked to an employee");
  const until = data.until ? new Date(data.until) : null;
  if (until && until <= new Date()) throw new ApiError(400, "Availability end time must be in the future");
  await pool.execute(
    `INSERT INTO employee_availability_preferences
      (employee_id,manual_status,manual_status_until,status_note)
     VALUES(?,?,?,?)
     ON DUPLICATE KEY UPDATE manual_status=VALUES(manual_status),
      manual_status_until=VALUES(manual_status_until),status_note=VALUES(status_note),
      status_updated_at=CURRENT_TIMESTAMP`,
    [user.employee_id, data.status, until, data.note || null],
  );
  await pool.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
     VALUES(?,?,'AVAILABILITY_UPDATED','EMPLOYEE',?,?,?)`,
    [user.id, user.employee_id, user.employee_id, "Manual availability updated.", JSON.stringify({ status: data.status, until: data.until || null })],
  );
  return getMyAvailability(user);
}

export async function clearManualAvailability(user) {
  if (!user.employee_id) throw new ApiError(403, "This account is not linked to an employee");
  await pool.execute("DELETE FROM employee_availability_preferences WHERE employee_id=?", [user.employee_id]);
  await pool.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)
     VALUES(?,?,'AVAILABILITY_CLEARED','EMPLOYEE',?,'Manual availability cleared.')`,
    [user.id, user.employee_id, user.employee_id],
  );
  return getMyAvailability(user);
}
