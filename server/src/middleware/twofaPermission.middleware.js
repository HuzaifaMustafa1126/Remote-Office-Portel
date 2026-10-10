import pool from "../config/database.js";
import { getEffectivePermission } from "../services/effectivePermission.service.js";
import { recordTwofaAccessDenied } from "../services/twofaAuthorization.service.js";
import ApiError from "../utils/ApiError.js";
import { twofaRequestContext } from "../utils/twofaRequest.js";

async function targetProfileId(req) {
  const direct = req.params?.profileId || req.params?.id;
  if (/^[1-9]\d*$/.test(String(direct || ""))) {
    const [[profile]] = await pool.execute(
      "SELECT id FROM twofa_profiles WHERE id=? LIMIT 1",
      [direct],
    );
    return profile?.id || null;
  }
  const platformId = req.params?.platformId;
  if (/^[1-9]\d*$/.test(String(platformId || ""))) {
    const [[platform]] = await pool.execute(
      "SELECT profile_id profileId FROM twofa_platforms WHERE id=? LIMIT 1",
      [platformId],
    );
    return platform?.profileId || null;
  }
  return null;
}

export const requireTwofaPermission = (permission, operation = permission) =>
  async (req, _res, next) => {
    try {
      if (await getEffectivePermission(req.user.id, permission, pool)) return next();
      const profileId = await targetProfileId(req);
      if (profileId && req.user?.employee_id)
        await recordTwofaAccessDenied(
          profileId,
          req.user,
          `MODULE_PERMISSION:${operation}`,
          twofaRequestContext(req),
          pool,
        );
      throw new ApiError(403, "You do not have permission to perform this action");
    } catch (error) {
      next(error);
    }
  };
