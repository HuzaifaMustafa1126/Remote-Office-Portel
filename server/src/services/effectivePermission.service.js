import pool from "../config/database.js";
export async function getEffectivePermission(
  userId,
  permission,
  executor = pool,
) {
  const [[row]] = await executor.execute(
    `SELECT upo.effect,EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id WHERE ur.user_id=? AND rp.permission_id=p.id) roleAllowed FROM permissions p LEFT JOIN user_permission_overrides upo ON upo.permission_id=p.id AND upo.user_id=? WHERE p.name=?`,
    [userId, userId, permission],
  );
  if (!row) return false;
  if (row.effect === "ALLOW") return true;
  if (row.effect === "DENY") return false;
  return Boolean(row.roleAllowed);
}
export async function getEffectivePermissions(userId, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT p.name,upo.effect,EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id WHERE ur.user_id=? AND rp.permission_id=p.id) roleAllowed FROM permissions p LEFT JOIN user_permission_overrides upo ON upo.permission_id=p.id AND upo.user_id=?`,
    [userId, userId],
  );
  return rows
    .filter(
      (x) => x.effect === "ALLOW" || (x.effect !== "DENY" && x.roleAllowed),
    )
    .map((x) => x.name);
}
