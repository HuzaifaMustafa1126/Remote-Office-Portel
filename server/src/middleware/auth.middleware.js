import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { decodeToken, verifyToken } from "../utils/jwt.js";

async function expireSession(sessionId, userId) {
  if (!sessionId) return;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "UPDATE auth_sessions SET status='EXPIRED',ended_reason='EXPIRED' WHERE id=? AND status='ACTIVE'",
      [sessionId],
    );
    if (result.affectedRows) {
      const [[user]] = await connection.execute(
        "SELECT u.employee_id employeeId,CONCAT(e.first_name,' ',e.last_name) name FROM users u LEFT JOIN employees e ON e.id=u.employee_id WHERE u.id=?",
        [userId],
      );
      await connection.execute(
        "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'SESSION_EXPIRED','AUTH_SESSION',?,?)",
        [
          userId,
          user?.employeeId || null,
          userId,
          `${user?.name || "User"}'s login session expired after the maximum 8-hour duration.`,
        ],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Unable to mark expired auth session", error.message);
  } finally {
    connection.release();
  }
}

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token)
    return next(new ApiError(401, "Authentication required", "AUTH_REQUIRED"));
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const stale = decodeToken(token);
      await expireSession(stale?.sid, stale?.sub);
      return next(
        new ApiError(
          401,
          "Your session has expired. Please log in again.",
          "SESSION_EXPIRED",
        ),
      );
    }
    return next(
      new ApiError(401, "Invalid authentication token", "INVALID_TOKEN"),
    );
  }
  try {
    if (!decoded.sid)
      throw new ApiError(
        401,
        "Please log in again to start a secure session.",
        "SESSION_REQUIRED",
      );
    const [[row]] = await pool.execute(
      `SELECT s.id,s.user_id,s.status sessionStatus,s.expires_at,s.revoked_at,
        u.id userId,u.employee_id,u.email,u.status userStatus,u.must_change_password
       FROM auth_sessions s JOIN users u ON u.id=s.user_id
       WHERE s.id=? AND s.user_id=? LIMIT 1`,
      [decoded.sid, decoded.sub],
    );
    if (!row)
      throw new ApiError(
        401,
        "Session is unavailable. Please log in again.",
        "SESSION_INVALID",
      );
    if (row.sessionStatus === "REVOKED" || row.revoked_at)
      throw new ApiError(
        401,
        "This session has been signed out.",
        "SESSION_REVOKED",
      );
    if (
      row.sessionStatus === "EXPIRED" ||
      new Date(row.expires_at) <= new Date()
    ) {
      await expireSession(row.id, row.userId);
      throw new ApiError(
        401,
        "Your session has expired. Please log in again.",
        "SESSION_EXPIRED",
      );
    }
    if (row.userStatus !== "ACTIVE")
      throw new ApiError(401, "Account is unavailable", "ACCOUNT_UNAVAILABLE");
    req.user = {
      id: row.userId,
      employee_id: row.employee_id,
      email: row.email,
      status: row.userStatus,
      must_change_password: Boolean(row.must_change_password),
    };
    req.session = { id: row.id, expires_at: row.expires_at };
    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(401, "Invalid or expired session", "SESSION_INVALID"),
    );
  }
}

export function requirePasswordChanged(req, res, next) {
  if (req.user.must_change_password)
    return next(
      new ApiError(
        403,
        "Password change required.",
        "PASSWORD_CHANGE_REQUIRED",
      ),
    );
  next();
}
