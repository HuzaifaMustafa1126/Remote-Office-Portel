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
    const [[role]] = await conn.execute("SELECT id FROM roles WHERE id=? FOR UPDATE", [roleId]);
    if (!role) throw new ApiError(404, "Role not found");
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length) {
      const [valid] = await conn.execute(
        `SELECT id FROM permissions WHERE id IN (${uniqueIds.map(() => "?").join(",")})`,
        uniqueIds,
      );
      if (valid.length !== uniqueIds.length) throw new ApiError(400, "One or more permissions are invalid");
    }
    const [[mobile]] = await conn.execute("SELECT id FROM permissions WHERE name='portal.access_mobile'");
    if (mobile) {
      const [current] = await conn.execute("SELECT 1 FROM role_permissions WHERE role_id=? AND permission_id=?", [roleId, mobile.id]);
      if (Boolean(current.length) !== uniqueIds.includes(mobile.id)) {
        const [privileged] = await conn.execute(
          "SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND UPPER(r.name) IN ('CEO','SUPER_ADMIN') LIMIT 1", [actor.id],
        );
        if (!privileged.length) throw new ApiError(403, "Only the CEO or Super Admin can change mobile portal access.");
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
