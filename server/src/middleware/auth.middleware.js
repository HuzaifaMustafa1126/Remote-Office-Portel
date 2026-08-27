import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";
export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) throw new ApiError(401, "Authentication required");
    const decoded = verifyToken(token);
    const [rows] = await pool.execute(
      "SELECT id, employee_id, email, status FROM users WHERE id = ? LIMIT 1",
      [decoded.sub],
    );
    if (!rows[0] || rows[0].status !== "ACTIVE")
      throw new ApiError(401, "Account is unavailable");
    req.user = rows[0];
    next();
  } catch (e) {
    next(
      e instanceof ApiError ? e : new ApiError(401, "Invalid or expired token"),
    );
  }
}
