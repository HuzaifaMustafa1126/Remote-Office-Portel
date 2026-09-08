import pool from "../config/database.js";
import { logAudit } from "./audit.service.js";
import ApiError from "../utils/ApiError.js";
export async function getPermissions() {
  const [r] = await pool.execute(
    "SELECT id,name,description FROM permissions ORDER BY name",
  );
  return r;
}
export async function setRolePermissions(roleId, ids, actor) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[role]] = await conn.execute(
      "SELECT id FROM roles WHERE id=? FOR UPDATE",
      [roleId],
    );
    if (!role) throw new ApiError(404, "Role not found");
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length) {
      const [valid] = await conn.execute(
        `SELECT id FROM permissions WHERE id IN (${uniqueIds.map(() => "?").join(",")})`,
        uniqueIds,
      );
      if (valid.length !== uniqueIds.length)
        throw new ApiError(400, "One or more permissions are invalid");
    }
    const [[mobile]] = await conn.execute(
      "SELECT id FROM permissions WHERE name='portal.access_mobile'",
    );
    if (mobile) {
      const [current] = await conn.execute(
        "SELECT 1 FROM role_permissions WHERE role_id=? AND permission_id=?",
        [roleId, mobile.id],
      );
      if (Boolean(current.length) !== uniqueIds.includes(mobile.id)) {
        const [privileged] = await conn.execute(
          "SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND UPPER(r.name) IN ('CEO','SUPER_ADMIN') LIMIT 1",
          [actor.id],
        );
        if (!privileged.length)
          throw new ApiError(
            403,
            "Only the CEO or Super Admin can change mobile portal access.",
          );
      }
    }
    await conn.execute("DELETE FROM role_permissions WHERE role_id=?", [
      roleId,
    ]);
    for (const id of uniqueIds)
      await conn.execute(
        "INSERT INTO role_permissions(role_id,permission_id) VALUES(?,?)",
        [roleId, id],
      );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: "PERMISSION_UPDATED",
    entityType: "ROLE",
    entityId: roleId,
    description: `Permissions were updated for role #${roleId}.`,
  });
}
export async function getEmployeePermission(
  employeeId,
  permissionName,
  executor = pool,
) {
  const [[user]] = await executor.execute(
    "SELECT id FROM users WHERE employee_id=?",
    [employeeId],
  );
  if (!user) throw new ApiError(404, "Employee account not found");
  const [[row]] = await executor.execute(
    `SELECT p.id,p.name,p.description,upo.effect,EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id WHERE ur.user_id=? AND rp.permission_id=p.id) roleAllowed FROM permissions p LEFT JOIN user_permission_overrides upo ON upo.user_id=? AND upo.permission_id=p.id WHERE p.name=?`,
    [user.id, user.id, permissionName],
  );
  if (!row) throw new ApiError(404, "Permission not found");
  const effective =
    row.effect === "ALLOW" || (!row.effect && Boolean(row.roleAllowed));
  return {
    permissionId: row.id,
    permission: row.name,
    description: row.description,
    roleAllowed: Boolean(row.roleAllowed),
    override: row.effect || "INHERIT",
    effectiveAllowed: effective,
  };
}
export async function setEmployeePermission(
  employeeId,
  permissionName,
  effect,
  actor,
) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[user]] = await c.execute(
      "SELECT u.id,CONCAT(e.first_name,' ',e.last_name) name FROM users u JOIN employees e ON e.id=u.employee_id WHERE e.id=? FOR UPDATE",
      [employeeId],
    );
    if (!user) throw new ApiError(404, "Employee account not found");
    const [[permission]] = await c.execute(
      "SELECT id,description FROM permissions WHERE name=?",
      [permissionName],
    );
    if (!permission) throw new ApiError(404, "Permission not found");
    const [[old]] = await c.execute(
      "SELECT effect FROM user_permission_overrides WHERE user_id=? AND permission_id=?",
      [user.id, permission.id],
    );
    if (effect === "INHERIT")
      await c.execute(
        "DELETE FROM user_permission_overrides WHERE user_id=? AND permission_id=?",
        [user.id, permission.id],
      );
    else
      await c.execute(
        `INSERT INTO user_permission_overrides(user_id,permission_id,effect,created_by,updated_by)VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE effect=VALUES(effect),updated_by=VALUES(updated_by)`,
        [user.id, permission.id, effect, actor.id, actor.id],
      );
    const next = await getEmployeePermission(employeeId, permissionName, c);
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,old_values,new_values)VALUES(?,?,'EMPLOYEE_PERMISSION_UPDATED','USER_PERMISSION',?,?,?,?)",
      [
        actor.id,
        employeeId,
        user.id,
        `${permission.description} override changed for ${user.name}.`,
        JSON.stringify({ override: old?.effect || "INHERIT" }),
        JSON.stringify(next),
      ],
    );
    await c.commit();
    return next;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
