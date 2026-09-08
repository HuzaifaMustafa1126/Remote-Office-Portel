import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getEffectivePermission } from "../services/effectivePermission.service.js";
export const requirePermission = (permission) => async (req, res, next) => {
  try {
    if (!(await getEffectivePermission(req.user.id, permission, pool)))
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    next();
  } catch (e) {
    next(e);
  }
};
