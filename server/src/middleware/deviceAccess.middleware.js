import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { isMobileRequest, MOBILE_PERMISSION } from "../utils/deviceAccess.js";
export async function hasMobileAccess(userId, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT 1 value FROM users u JOIN permissions p ON 1=1 LEFT JOIN user_permission_overrides upo ON upo.user_id=u.id AND upo.permission_id=p.id WHERE u.id=? AND p.name=? AND (upo.effect='ALLOW' OR (upo.effect IS NULL AND EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id WHERE ur.user_id=u.id AND rp.permission_id=p.id))) LIMIT 1`,
    [userId, MOBILE_PERMISSION],
  );
  return rows.length > 0;
}
export async function requireDeviceAccess(req, res, next) {
  try {
    if (isMobileRequest(req.headers) && !(await hasMobileAccess(req.user.id))) {
      return next(
        new ApiError(
          403,
          "This account is not permitted to access the portal from a mobile device.",
          "MOBILE_ACCESS_DENIED",
        ),
      );
    }
    next();
  } catch (error) {
    next(error);
  }
}
