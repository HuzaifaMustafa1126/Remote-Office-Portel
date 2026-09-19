import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";

export async function isCeoUser(userId, executor = pool) {
  const [[row]] = await executor.execute(
    `SELECT EXISTS(
       SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id
       WHERE ur.user_id=? AND UPPER(r.name)='CEO'
     ) allowed`,
    [userId],
  );
  return Boolean(row?.allowed);
}

export async function requireCeo(req, res, next) {
  try {
    if (!(await isCeoUser(req.user.id)))
      throw new ApiError(
        403,
        "Only the CEO can permanently delete security history.",
        "CEO_REQUIRED",
      );
    next();
  } catch (error) {
    next(error);
  }
}
