import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { assertActiveTwofaEmployee, requireTwofaEmployee, twofaProfileNotFound } from "./twofaAuthorization.service.js";

const descriptions = {
  PROFILE_CREATED: "Created profile", PROFILE_UPDATED: "Updated profile",
  PROFILE_DELETED: "Deleted profile", PLATFORM_ADDED: "Added platform",
  PLATFORM_UPDATED: "Updated platform", PLATFORM_REMOVED: "Removed platform",
  TWOFA_UPDATED: "Updated 2FA information", AUTH_KEY_UPDATED: "Updated authentication key",
  TWOFA_REVEALED: "Revealed 2FA information", AUTH_KEY_REVEALED: "Revealed authentication key",
  ACCESS_GRANTED: "Granted employee access", ACCESS_UPDATED: "Updated employee access",
  ACCESS_REVOKED: "Revoked employee access", ACCESS_DENIED: "Unauthorized access attempt",
};

const utcCreatedAt = `CONCAT(DATE_FORMAT(CONVERT_TZ(a.created_at,@@session.time_zone,'+00:00'),'%Y-%m-%dT%H:%i:%s'),'.000Z')`;
const select = `SELECT a.id,a.profile_id profileId,a.profile_name_snapshot profileName,
  a.platform_id platformId,a.platform_name_snapshot platformName,
  a.employee_id employeeId,a.employee_name_snapshot employeeName,
  a.action,a.event_status eventStatus,a.changed_fields changedFields,
  a.ip_address ipAddress,a.user_agent userAgent,a.request_id requestId,
  a.metadata,${utcCreatedAt} createdAt FROM twofa_activity_logs a`;

const json = (value) => {
  if (value == null || typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
};
const present = (row) => ({
  id: Number(row.id), profileId: Number(row.profileId), profileName: row.profileName,
  platformId: row.platformId ? Number(row.platformId) : null,
  platformName: row.platformName || null,
  employeeId: row.employeeId ? Number(row.employeeId) : null,
  employeeName: row.employeeName || "Former employee",
  action: row.action, eventStatus: row.eventStatus,
  description: descriptions[row.action] || row.action,
  changedFields: json(row.changedFields) || [], metadata: json(row.metadata),
  ipAddress: row.ipAddress || null, userAgent: row.userAgent || null,
  requestId: row.requestId || null, createdAt: row.createdAt,
});

function filters(query, fixedProfileId = null) {
  const where = [], params = [];
  if (fixedProfileId) { where.push("a.profile_id=?"); params.push(fixedProfileId); }
  else if (query.profileId) { where.push("a.profile_id=?"); params.push(query.profileId); }
  for (const [key, column] of [["platformId", "a.platform_id"], ["employeeId", "a.employee_id"], ["action", "a.action"], ["status", "a.event_status"]])
    if (query[key] !== undefined) { where.push(`${column}=?`); params.push(query[key]); }
  if (query.dateFrom) { where.push("a.created_at>=?"); params.push(`${query.dateFrom} 00:00:00`); }
  if (query.dateTo) { where.push("a.created_at<DATE_ADD(?,INTERVAL 1 DAY)"); params.push(`${query.dateTo} 00:00:00`); }
  if (query.search) {
    where.push("(a.profile_name_snapshot LIKE ? OR a.platform_name_snapshot LIKE ? OR a.employee_name_snapshot LIKE ?)");
    const value = `%${query.search}%`; params.push(value, value, value);
  }
  return { where, params };
}

async function canReadProfileHistory(executor, profileId, actor) {
  const [[profile]] = await executor.execute("SELECT id FROM twofa_profiles WHERE id=?", [profileId]);
  if (!profile) throw twofaProfileNotFound();
  return true;
}

async function queryHistory(query, authorizationSql, authorizationParams, fixedProfileId, database) {
  const built = filters(query, fixedProfileId);
  if (authorizationSql) built.where.push(authorizationSql);
  const params = [...built.params, ...authorizationParams];
  const clause = built.where.length ? `WHERE ${built.where.join(" AND ")}` : "";
  const offset = (query.page - 1) * query.limit;
  const [[count]] = await database.execute(`SELECT COUNT(*) total FROM twofa_activity_logs a ${clause}`, params);
  const [rows] = await database.execute(
    `${select} ${clause} ORDER BY a.created_at DESC,a.id DESC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  const total = Number(count.total);
  return { rows: rows.map(present), meta: { page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) } };
}

export async function profileHistory(profileId, query, actor, database = pool) {
  requireTwofaEmployee(actor);
  await assertActiveTwofaEmployee(database, actor);
  if (!(await canReadProfileHistory(database, profileId, actor))) throw twofaProfileNotFound();
  return queryHistory(query, "", [], profileId, database);
}

export async function globalHistory(query, actor, database = pool) {
  requireTwofaEmployee(actor);
  await assertActiveTwofaEmployee(database, actor);
  return queryHistory(
    query,
    "",
    [], null, database,
  );
}
