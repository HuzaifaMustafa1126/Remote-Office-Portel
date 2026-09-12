import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { logAudit } from "./audit.service.js";

export async function loginSignals(userId, meta, executor = pool) {
  const [[history]] = await executor.execute(
    `SELECT COUNT(*) priorCount,
      SUM(ip_address=?) knownIp,
      SUM(browser=? AND operating_system=? AND device_type=?) knownDevice
     FROM auth_sessions WHERE user_id=?`,
    [meta.ip || null, meta.browser || "Unknown", meta.operatingSystem || "Unknown", meta.deviceType || "UNKNOWN", userId],
  );
  const hasHistory = Number(history.priorCount) > 0;
  return {
    isNewIp: hasHistory && Number(history.knownIp || 0) === 0,
    isNewDevice: hasHistory && Number(history.knownDevice || 0) === 0,
  };
}

export async function recordFailedLogin(identifier, user, meta) {
  const safeIdentifier = String(identifier || "").trim().toLowerCase().slice(0, 190);
  const [[recent]] = await pool.execute(
    `SELECT COUNT(*) attempts FROM login_failed_attempts
     WHERE attempted_at>=DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 15 MINUTE)
       AND (attempted_identifier=? OR (? IS NOT NULL AND ip_address=?))`,
    [safeIdentifier, meta.ip || null, meta.ip || null],
  );
  const suspicious = Number(recent.attempts || 0) + 1 >= 5;
  await pool.execute(
    `INSERT INTO login_failed_attempts
      (attempted_identifier,user_id,employee_id,ip_address,user_agent,browser,operating_system,device_type,suspicious)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    [safeIdentifier, user?.id || null, user?.employee_id || null, meta.ip || null, meta.userAgent || null, meta.browser || "Unknown", meta.operatingSystem || "Unknown", meta.deviceType || "UNKNOWN", suspicious],
  );
  return suspicious;
}

const resolvedStatus = `CASE
  WHEN s.status='ACTIVE' AND s.expires_at<=CURRENT_TIMESTAMP THEN 'EXPIRED'
  WHEN s.status='ACTIVE' THEN 'ACTIVE'
  WHEN s.ended_reason='LOGOUT' THEN 'LOGGED_OUT'
  WHEN s.ended_reason='EXPIRED' OR s.status='EXPIRED' THEN 'EXPIRED'
  ELSE 'REVOKED' END`;

function clauses(filters, failed = false) {
  const where = [], params = [];
  if (filters.search) {
    const q = `%${filters.search}%`;
    where.push(failed ? "(f.attempted_identifier LIKE ? OR f.ip_address LIKE ? OR CONCAT(e.first_name,' ',e.last_name) LIKE ?)" : "(u.email LIKE ? OR s.ip_address LIKE ? OR CONCAT(e.first_name,' ',e.last_name) LIKE ?)");
    params.push(q,q,q);
  }
  const dateColumn = failed ? "f.attempted_at" : "s.login_at";
  if (filters.from) { where.push(`${dateColumn}>=?`); params.push(`${filters.from} 00:00:00`); }
  if (filters.to) { where.push(`${dateColumn}<DATE_ADD(?,INTERVAL 1 DAY)`); params.push(`${filters.to} 00:00:00`); }
  if (filters.signal) {
    if (failed) {
      if (filters.signal === "SUSPICIOUS") where.push("f.suspicious=TRUE");
      else where.push("FALSE");
    } else if (filters.signal === "NEW_IP") where.push("s.is_new_ip=TRUE");
    else if (filters.signal === "NEW_DEVICE") where.push("s.is_new_device=TRUE");
    else where.push("FALSE");
  }
  if (!failed && filters.status && filters.status !== "FAILED") { where.push(`${resolvedStatus}=?`); params.push(filters.status); }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export async function list(filters) {
  const sessionFilter = clauses(filters, false), failedFilter = clauses(filters, true);
  const sessions = `SELECT s.id sessionId,'SESSION' recordType,u.email accountIdentifier,
    u.employee_id employeeId,COALESCE(CONCAT(e.first_name,' ',e.last_name),u.email) employeeName,
    GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') role,
    ${resolvedStatus} status,s.ip_address ipAddress,s.device_type deviceType,s.browser,
    s.operating_system operatingSystem,s.login_at occurredAt,s.last_seen_at lastActiveAt,
    s.logout_at logoutAt,s.is_new_ip isNewIp,s.is_new_device isNewDevice,FALSE suspicious
   FROM auth_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN employees e ON e.id=u.employee_id
   LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
   ${sessionFilter.sql} GROUP BY s.id`;
  const failures = `SELECT NULL sessionId,'FAILED' recordType,f.attempted_identifier accountIdentifier,
    f.employee_id employeeId,COALESCE(CONCAT(e.first_name,' ',e.last_name),f.attempted_identifier) employeeName,
    NULL role,'FAILED' status,f.ip_address ipAddress,f.device_type deviceType,f.browser,
    f.operating_system operatingSystem,f.attempted_at occurredAt,NULL lastActiveAt,
    NULL logoutAt,FALSE isNewIp,FALSE isNewDevice,f.suspicious
   FROM login_failed_attempts f LEFT JOIN employees e ON e.id=f.employee_id ${failedFilter.sql}`;
  const includeSessions = filters.status !== "FAILED";
  const includeFailures = !filters.status || filters.status === "FAILED";
  const parts = [], params = [];
  if (includeSessions) { parts.push(sessions); params.push(...sessionFilter.params); }
  if (includeFailures) { parts.push(failures); params.push(...failedFilter.params); }
  const union = parts.join(" UNION ALL ");
  const offset = (filters.page - 1) * filters.limit;
  const [[count]] = await pool.execute(`SELECT COUNT(*) total FROM (${union}) security_rows`, params);
  const [rows] = await pool.execute(`${union} ORDER BY occurredAt DESC LIMIT ? OFFSET ?`, [...params, filters.limit, offset]);
  return { rows, meta: { page: filters.page, limit: filters.limit, total: Number(count.total), pages: Math.max(1,Math.ceil(Number(count.total)/filters.limit)) } };
}

export async function summary() {
  const [[stats]] = await pool.execute(
    `SELECT
      (SELECT COUNT(*) FROM auth_sessions WHERE status='ACTIVE' AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP) activeSessions,
      (SELECT COUNT(*) FROM auth_sessions WHERE login_at>=CURRENT_DATE) loginsToday,
      (SELECT COUNT(*) FROM auth_sessions WHERE login_at>=CURRENT_DATE AND (is_new_ip OR is_new_device)) newLoginSignals,
      (SELECT COUNT(*) FROM login_failed_attempts WHERE attempted_at>=CURRENT_DATE) failedAttempts`,
  );
  const [recent] = await pool.execute(
    `SELECT s.id sessionId,COALESCE(CONCAT(e.first_name,' ',e.last_name),u.email) employeeName,
      ${resolvedStatus} status,s.browser,s.operating_system,s.device_type deviceType,
      s.login_at loginAt,s.last_seen_at lastActiveAt,s.is_new_ip isNewIp,s.is_new_device isNewDevice
     FROM auth_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN employees e ON e.id=u.employee_id
     ORDER BY s.login_at DESC LIMIT 6`,
  );
  return { stats: Object.fromEntries(Object.entries(stats).map(([key,value]) => [key,Number(value || 0)])), recent };
}

export async function revoke(sessionId, actor) {
  const [result] = await pool.execute(
    `UPDATE auth_sessions SET status='REVOKED',revoked_at=CURRENT_TIMESTAMP,logout_at=CURRENT_TIMESTAMP,ended_reason='REVOKED'
     WHERE id=? AND status='ACTIVE' AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP`,
    [sessionId],
  );
  if (!result.affectedRows) throw new ApiError(409,"This session is no longer active");
  await logAudit({ userId: actor.id, employeeId: actor.employee_id, action: "SESSION_REVOKED", entityType: "AUTH_SESSION", description: "An administrator terminated an active login session." });
  return { revoked: true };
}
