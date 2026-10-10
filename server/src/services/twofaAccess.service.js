import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getEffectivePermission } from "./effectivePermission.service.js";
import { recordTwofaActivity } from "./twofaActivity.service.js";
import {
  assertActiveTwofaEmployee,
  getTwofaProfileAuthorization,
  recordTwofaAccessDenied,
  requireTwofaEmployee,
  TWOFA_PROFILE_ACTION,
  twofaProfileNotFound,
} from "./twofaAuthorization.service.js";

const capabilityMap = {
  canView: { column: "can_view", action: TWOFA_PROFILE_ACTION.VIEW, permission: "2fa.profile.view" },
  canEdit: { column: "can_edit", action: TWOFA_PROFILE_ACTION.EDIT, permission: "2fa.profile.edit" },
  canRevealTwofa: { column: "can_reveal_twofa", action: TWOFA_PROFILE_ACTION.REVEAL_TWOFA, permission: "2fa.information.reveal" },
  canRevealAuthKey: { column: "can_reveal_auth_key", action: TWOFA_PROFILE_ACTION.REVEAL_AUTH_KEY, permission: "2fa.key.reveal" },
};

const selectAccess = `
  SELECT pa.employee_id employeeId,pa.access_type accessType,
    pa.can_view canView,pa.can_edit canEdit,
    pa.can_reveal_twofa canRevealTwofa,pa.can_reveal_auth_key canRevealAuthKey,
    CONCAT(e.first_name,' ',e.last_name) employeeName,e.status employeeStatus,
    pa.granted_by grantedByUserId,pa.created_at createdAt,pa.updated_at updatedAt
  FROM twofa_profile_access pa
  JOIN employees e ON e.id=pa.employee_id`;

const present = (row) => ({
  employeeId: Number(row.employeeId),
  employeeName: row.employeeName,
  employeeStatus: row.employeeStatus,
  accessType: row.accessType,
  permissions: {
    canView: Boolean(row.canView),
    canEdit: Boolean(row.canEdit),
    canRevealTwofa: Boolean(row.canRevealTwofa),
    canRevealAuthKey: Boolean(row.canRevealAuthKey),
  },
  grantedByUserId: row.grantedByUserId ? Number(row.grantedByUserId) : null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

async function activeTarget(executor, employeeId) {
  const [[employee]] = await executor.execute(
    "SELECT id FROM employees WHERE id=? AND status='ACTIVE'",
    [employeeId],
  );
  if (!employee)
    throw new ApiError(400, "Employee must exist and be active", "TWOFA_ACCESS_EMPLOYEE_INACTIVE");
}

async function assertDelegable(executor, authorization, actor, permissions) {
  for (const [key, value] of Object.entries(permissions)) {
    if (!value) continue;
    const capability = capabilityMap[key];
    const hasModulePermission = await getEffectivePermission(actor.id, capability.permission, executor);
    const hasProfileCapability = authorization.isCeo || Boolean(authorization.access?.[capability.column]);
    if (!hasModulePermission || !hasProfileCapability)
      throw new ApiError(403, `You cannot grant ${key}`, "TWOFA_ACCESS_PRIVILEGE_ESCALATION");
  }
}

async function getRow(executor, profileId, employeeId) {
  const [[row]] = await executor.execute(
    `${selectAccess} WHERE pa.profile_id=? AND pa.employee_id=?`,
    [profileId, employeeId],
  );
  return row ? present(row) : null;
}

async function managerAuthorization(executor, profileId, actor, lock = false) {
  const result = await getTwofaProfileAuthorization(
    executor, profileId, actor, TWOFA_PROFILE_ACTION.MANAGE_ACCESS, { lock },
  );
  if (!result.profile) throw twofaProfileNotFound();
  return result;
}

export async function listProfileAccess(profileId, actor, context, database = pool) {
  requireTwofaEmployee(actor);
  const authorization = await managerAuthorization(database, profileId, actor);
  if (!authorization.allowed) {
    await recordTwofaAccessDenied(profileId, actor, "LIST_PROFILE_ACCESS", context, database);
    throw twofaProfileNotFound();
  }
  const [rows] = await database.execute(
    `${selectAccess} WHERE pa.profile_id=? ORDER BY pa.access_type='OWNER' DESC,employeeName,pa.employee_id`,
    [profileId],
  );
  return rows.map(present);
}

export async function grantProfileAccess(profileId, data, actor, context, database = pool) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = false;
  try {
    await connection.beginTransaction();
    const authorization = await managerAuthorization(connection, profileId, actor, true);
    if (!authorization.allowed) { denied = true; await connection.rollback(); }
    else {
      await activeTarget(connection, data.employeeId);
      const [[existing]] = await connection.execute(
        "SELECT id FROM twofa_profile_access WHERE profile_id=? AND employee_id=?",
        [profileId, data.employeeId],
      );
      if (existing) throw new ApiError(409, "Employee already has profile access", "TWOFA_ACCESS_DUPLICATE");
      await connection.execute(
        `INSERT INTO twofa_profile_access(
          profile_id,employee_id,access_type,can_view,can_edit,
          can_reveal_twofa,can_reveal_auth_key,granted_by
        ) VALUES(?,?,'GRANTED',?,?,?,?,?)`,
        [profileId, data.employeeId, true, true, true, true, actor.id],
      );
      await recordTwofaActivity(connection, {
        profileId, actor, action: "ACCESS_GRANTED", context,
        changedFields: Object.values(capabilityMap).map((x) => x.column),
        metadata: { targetEmployeeId: data.employeeId },
      });
      const result = await getRow(connection, profileId, data.employeeId);
      await connection.commit();
      return result;
    }
  } catch (error) { if (!denied) await connection.rollback(); throw error; }
  finally { connection.release(); }
  await recordTwofaAccessDenied(profileId, actor, "GRANT_PROFILE_ACCESS", context, database);
  throw twofaProfileNotFound();
}

export async function updateProfileAccess(profileId, employeeId, permissions, actor, context, database = pool) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = false;
  try {
    await connection.beginTransaction();
    const authorization = await managerAuthorization(connection, profileId, actor, true);
    if (!authorization.allowed) { denied = true; await connection.rollback(); }
    else {
      await activeTarget(connection, employeeId);
      const [[current]] = await connection.execute(
        "SELECT * FROM twofa_profile_access WHERE profile_id=? AND employee_id=? FOR UPDATE",
        [profileId, employeeId],
      );
      if (!current) throw new ApiError(404, "Employee profile access not found", "TWOFA_ACCESS_NOT_FOUND");
      if (current.access_type === "OWNER")
        throw new ApiError(409, "Owner access cannot be changed", "TWOFA_OWNER_ACCESS_PROTECTED");
      await assertDelegable(connection, authorization, actor, permissions);
      const changedFields = Object.entries(capabilityMap)
        .filter(([key, value]) => Boolean(current[value.column]) !== permissions[key])
        .map(([, value]) => value.column);
      if (changedFields.length) {
        await connection.execute(
          `UPDATE twofa_profile_access SET can_view=?,can_edit=?,can_reveal_twofa=?,
           can_reveal_auth_key=?,granted_by=?,updated_at=CURRENT_TIMESTAMP
           WHERE profile_id=? AND employee_id=?`,
          [permissions.canView, permissions.canEdit, permissions.canRevealTwofa,
            permissions.canRevealAuthKey, actor.id, profileId, employeeId],
        );
        await recordTwofaActivity(connection, {
          profileId, actor, action: "ACCESS_UPDATED", context, changedFields,
          metadata: { targetEmployeeId: Number(employeeId), permissions },
        });
      }
      const result = await getRow(connection, profileId, employeeId);
      await connection.commit();
      return { ...result, changed: Boolean(changedFields.length) };
    }
  } catch (error) { if (!denied) await connection.rollback(); throw error; }
  finally { connection.release(); }
  await recordTwofaAccessDenied(profileId, actor, "UPDATE_PROFILE_ACCESS", context, database);
  throw twofaProfileNotFound();
}

export async function revokeProfileAccess(profileId, employeeId, actor, context, database = pool) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = false;
  try {
    await connection.beginTransaction();
    const authorization = await managerAuthorization(connection, profileId, actor, true);
    if (!authorization.allowed) { denied = true; await connection.rollback(); }
    else {
      const [[current]] = await connection.execute(
        "SELECT id,access_type FROM twofa_profile_access WHERE profile_id=? AND employee_id=? FOR UPDATE",
        [profileId, employeeId],
      );
      if (!current) throw new ApiError(404, "Employee profile access not found", "TWOFA_ACCESS_NOT_FOUND");
      if (current.access_type === "OWNER")
        throw new ApiError(409, "Owner access cannot be revoked", "TWOFA_OWNER_ACCESS_PROTECTED");
      await connection.execute("DELETE FROM twofa_profile_access WHERE id=?", [current.id]);
      await recordTwofaActivity(connection, {
        profileId, actor, action: "ACCESS_REVOKED", context,
        changedFields: ["profile_access"], metadata: { targetEmployeeId: Number(employeeId) },
      });
      await connection.commit();
      return { profileId: Number(profileId), employeeId: Number(employeeId) };
    }
  } catch (error) { if (!denied) await connection.rollback(); throw error; }
  finally { connection.release(); }
  await recordTwofaAccessDenied(profileId, actor, "REVOKE_PROFILE_ACCESS", context, database);
  throw twofaProfileNotFound();
}
