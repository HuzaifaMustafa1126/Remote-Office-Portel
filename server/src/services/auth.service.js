import bcrypt from "bcrypt";
import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.js";
import { logAudit } from "./audit.service.js";
import { randomUUID } from "node:crypto";
export const MAX_SESSION_HOURS = 8;
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
  const sessionId = randomUUID(), c = await pool.getConnection();
  try {
    await c.beginTransaction();
    await c.execute("UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?",[user.id]);
    await c.execute(`INSERT INTO auth_sessions(id,user_id,expires_at,ip_address,user_agent) VALUES(?,?,DATE_ADD(CURRENT_TIMESTAMP,INTERVAL ? HOUR),?,?)`,[sessionId,user.id,MAX_SESSION_HOURS,meta.ip||null,String(meta.userAgent||"").slice(0,500)||null]);
    const [[session]]=await c.execute("SELECT expires_at expiresAt FROM auth_sessions WHERE id=?",[sessionId]);
    const profile=await getUserProfile(user.id);
    await c.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'USER_LOGIN','AUTH_SESSION',?,?)",[user.id,user.employee_id,user.id,`${profile.name} signed in. Session expires at ${session.expiresAt}.`]);
    await c.commit();
    return{token:signToken({sub:user.id,sid:sessionId}),user:profile,expiresAt:session.expiresAt};
  }catch(e){await c.rollback();throw e}finally{c.release()}
}
export async function heartbeat(sessionId){const[r]=await pool.execute("UPDATE auth_sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=? AND status='ACTIVE' AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP",[sessionId]);if(!r.affectedRows)throw new ApiError(401,"Your session has expired. Please log in again.","SESSION_EXPIRED");const[[row]]=await pool.execute("SELECT expires_at expiresAt FROM auth_sessions WHERE id=?",[sessionId]);return row}
export async function logoutSession(sessionId,user){const c=await pool.getConnection();try{await c.beginTransaction();const[r]=await c.execute("UPDATE auth_sessions SET status='REVOKED',revoked_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND status='ACTIVE'",[sessionId,user.id]);if(r.affectedRows)await c.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'USER_LOGOUT','AUTH_SESSION',?,?)",[user.id,user.employee_id,user.id,`${user.email} signed out and revoked the active session.`]);await c.commit();return{revoked:true}}catch(e){await c.rollback();throw e}finally{c.release()}}
