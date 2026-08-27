import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { logAudit } from "./audit.service.js";
export async function getRoles() {
  const [rows] = await pool.execute(
    `SELECT r.id,r.name,r.created_at AS createdAt,COUNT(DISTINCT ur.user_id) AS userCount,GROUP_CONCAT(DISTINCT p.name ORDER BY p.name) AS permissions,GROUP_CONCAT(DISTINCT p.id ORDER BY p.id) AS permissionIds FROM roles r LEFT JOIN user_roles ur ON ur.role_id=r.id LEFT JOIN role_permissions rp ON rp.role_id=r.id LEFT JOIN permissions p ON p.id=rp.permission_id GROUP BY r.id ORDER BY r.name`,
  );
  return rows.map((r) => ({
    ...r,
    userCount: Number(r.userCount),
    permissions: r.permissions ? r.permissions.split(",") : [],
    permissionIds: r.permissionIds
      ? r.permissionIds.split(",").map(Number)
      : [],
  }));
}
export async function createRole(name, actor) {
  const [r] = await pool.execute("INSERT INTO roles(name) VALUES(?)", [name]);
  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: "ROLE_UPDATED",
    entityType: "ROLE",
    entityId: r.insertId,
    description: `Role ${name} was created.`,
  });
  return { id: r.insertId, name };
}
export async function updateRole(id, name, actor) {
  const [r] = await pool.execute("UPDATE roles SET name=? WHERE id=?", [
    name,
    id,
  ]);
  if (!r.affectedRows) throw new ApiError(404, "Role not found");
  await logAudit({
    userId: actor.id,
    employeeId: actor.employee_id,
    action: "ROLE_UPDATED",
    entityType: "ROLE",
    entityId: id,
    description: `Role ${name} was updated.`,
  });
  return { id: Number(id), name };
}
