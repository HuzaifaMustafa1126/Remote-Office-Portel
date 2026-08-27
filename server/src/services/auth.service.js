import bcrypt from "bcrypt";
import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.js";
import { logAudit } from "./audit.service.js";
export async function getUserProfile(userId) {
  const [users] = await pool.execute(
    `SELECT u.id,u.employee_id AS employeeId,u.email,CONCAT(e.first_name,' ',e.last_name) AS name FROM users u LEFT JOIN employees e ON e.id=u.employee_id WHERE u.id=? AND u.status='ACTIVE'`,
    [userId],
  );
  if (!users[0]) throw new ApiError(401, "Account is unavailable");
  const [roles] = await pool.execute(
    "SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=? ORDER BY r.name",
    [userId],
  );
  const [perms] = await pool.execute(
    "SELECT DISTINCT p.name FROM permissions p JOIN role_permissions rp ON rp.permission_id=p.id JOIN user_roles ur ON ur.role_id=rp.role_id WHERE ur.user_id=? ORDER BY p.name",
    [userId],
  );
  return {
    ...users[0],
    roles: roles.map((x) => x.name),
    permissions: perms.map((x) => x.name),
  };
}
export async function loginUser(email, password, meta = {}) {
  const [rows] = await pool.execute(
    "SELECT id,employee_id,email,password_hash,status FROM users WHERE email=? LIMIT 1",
    [email],
  );
  const user = rows[0];
  if (
    !user ||
    user.status !== "ACTIVE" ||
    !(await bcrypt.compare(password, user.password_hash))
  ) {
    await logAudit({
      userId: user?.id || null,
      employeeId: user?.employee_id || null,
      action: "LOGIN_FAILED",
      entityType: "USER",
      entityId: user?.id || null,
      description: `Failed login attempt for ${email}${meta.ip ? ` from ${meta.ip}` : ""}.`,
    });
    throw new ApiError(401, "Invalid email or password");
  }
  await pool.execute(
    "UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?",
    [user.id],
  );
  const profile = await getUserProfile(user.id);
  await logAudit({
    userId: user.id,
    employeeId: user.employee_id,
    action: "LOGIN_SUCCESS",
    entityType: "USER",
    entityId: user.id,
    description: `${profile.name} signed in successfully.`,
  });
  return { token: signToken({ sub: user.id }), user: profile };
}
