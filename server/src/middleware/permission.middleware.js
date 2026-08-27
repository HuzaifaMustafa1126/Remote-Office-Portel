import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
export const requirePermission = (permission) => async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=? AND p.name=? LIMIT 1",
      [req.user.id, permission],
    );
    if (!rows.length)
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    next();
  } catch (e) {
    next(e);
  }
};
