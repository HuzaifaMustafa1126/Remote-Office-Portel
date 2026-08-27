import pool from "../config/database.js";
import { logAudit } from "./audit.service.js";
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
    await conn.execute("DELETE FROM role_permissions WHERE role_id=?", [
      roleId,
    ]);
    for (const id of ids)
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
