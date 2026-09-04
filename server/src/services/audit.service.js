import pool from "../config/database.js";
export async function logAudit({
  userId = null,
  employeeId = null,
  action,
  entityType = null,
  entityId = null,
  description,
}) {
  await pool.execute(
    "INSERT INTO audit_logs (user_id,employee_id,action,entity_type,entity_id,description) VALUES (?,?,?,?,?,?)",
    [userId, employeeId, action, entityType, entityId, description],
  );
}
export async function getAuditLogs(limit = 100) {
  const [rows] = await pool.execute(
    `SELECT a.id,a.action,a.entity_type AS entityType,a.entity_id AS entityId,a.description,a.created_at AS createdAt,CONCAT(e.first_name,' ',e.last_name) AS userName FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN employees e ON e.id=u.employee_id ORDER BY a.created_at DESC LIMIT ?`,
    [Number(limit)],
  );
  return rows;
}

const categories = {
  authentication: ["LOGIN_SUCCESS", "LOGIN_FAILED", "USER_LOGIN", "USER_LOGOUT", "SESSION_EXPIRED"],
  attendance: [
    "ATTENDANCE_CLOCK_IN",
    "ATTENDANCE_CLOCK_OUT",
    "ATTENDANCE_UPDATED",
  ],
  breaks: ["BREAK_STARTED", "BREAK_ENDED"],
  employees: ["EMPLOYEE_CREATED", "EMPLOYEE_UPDATED", "EMPLOYEE_ACTIVATED", "EMPLOYEE_DEACTIVATED", "EMPLOYEE_PASSWORD_RESET", "EMPLOYEE_DELETED", "PASSWORD_CHANGED"],
  roles: ["ROLE_UPDATED", "ROLE_ASSIGNED"],
  permissions: ["PERMISSION_UPDATED"],
  leave: [
    "LEAVE_REQUESTED",
    "LEAVE_APPROVED",
    "LEAVE_REJECTED",
    "LEAVE_CANCELLED",
    "LEAVE_DEDUCTION_RECALCULATED",
  ],
  calendar: [
    "HOLIDAY_CREATED",
    "HOLIDAY_UPDATED",
    "HOLIDAY_CANCELLED",
    "SPECIAL_OFF_DAY_CREATED",
  ],
  shifts: [
    "SHIFT_CREATED",
    "SHIFT_UPDATED",
    "SHIFT_DEACTIVATED",
    "SHIFT_ASSIGNED",
    "SHIFT_ASSIGNMENT_CHANGED",
  ],
  payroll: [
    "SALARY_CREATED",
    "SALARY_UPDATED",
    "PAYROLL_GENERATED",
    "PAYROLL_RECALCULATED",
    "PAYROLL_APPROVED",
    "PAYROLL_MARKED_PAID",
    "PAYROLL_REOPENED",
    "PAYROLL_ADJUSTMENT_ADDED",
    "PAYROLL_ADJUSTMENT_UPDATED",
    "PAYROLL_ADJUSTMENT_REMOVED",
  ],
};
export async function searchAuditLogs(filters = {}) {
  const where = [],
    params = [];
  if (filters.search) {
    where.push(
      "(a.description LIKE ? OR a.action LIKE ? OR CONCAT(e.first_name,' ',e.last_name) LIKE ?)",
    );
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.category) {
    where.push(
      `a.action IN (${categories[filters.category].map(() => "?").join(",")})`,
    );
    params.push(...categories[filters.category]);
  }
  if (filters.userId) {
    where.push("a.user_id=?");
    params.push(filters.userId);
  }
  if (filters.from) {
    where.push("a.created_at>=?");
    params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    where.push("a.created_at<DATE_ADD(?,INTERVAL 1 DAY)");
    params.push(`${filters.to} 00:00:00`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (filters.page - 1) * filters.limit;
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN employees e ON e.id=u.employee_id ${clause}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT a.id,a.user_id AS userId,a.action,a.entity_type AS entityType,a.entity_id AS entityId,a.description,a.created_at AS createdAt,CONCAT(e.first_name,' ',e.last_name) AS userName FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN employees e ON e.id=u.employee_id ${clause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset],
  );
  const [[summary]] = await pool.execute(
    `SELECT SUM(created_at>=CURRENT_DATE) todayActivity,SUM(action IN ('LOGIN_SUCCESS','LOGIN_FAILED','USER_LOGIN','USER_LOGOUT','SESSION_EXPIRED')) loginEvents,SUM(action IN ('ATTENDANCE_CLOCK_IN','ATTENDANCE_CLOCK_OUT','BREAK_STARTED','BREAK_ENDED','ATTENDANCE_UPDATED')) attendanceEvents,SUM(action IN ('EMPLOYEE_CREATED','EMPLOYEE_UPDATED','EMPLOYEE_DEACTIVATED','ROLE_UPDATED','ROLE_ASSIGNED','PERMISSION_UPDATED')) administrativeChanges FROM audit_logs`,
  );
  const [users] = await pool.execute(
    `SELECT DISTINCT u.id,CONCAT(e.first_name,' ',e.last_name) name FROM audit_logs a JOIN users u ON u.id=a.user_id LEFT JOIN employees e ON e.id=u.employee_id ORDER BY name`,
  );
  return {
    rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: Number(count.total),
      pages: Math.max(1, Math.ceil(Number(count.total) / filters.limit)),
    },
    summary: {
      todayActivity: Number(summary.todayActivity || 0),
      loginEvents: Number(summary.loginEvents || 0),
      attendanceEvents: Number(summary.attendanceEvents || 0),
      administrativeChanges: Number(summary.administrativeChanges || 0),
    },
    users,
  };
}
