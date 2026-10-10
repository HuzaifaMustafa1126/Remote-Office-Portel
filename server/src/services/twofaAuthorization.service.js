import pool from "../config/database.js";
import { isCeoUser } from "../middleware/ceo.middleware.js";
import ApiError from "../utils/ApiError.js";
import { recordTwofaActivity } from "./twofaActivity.service.js";

export const TWOFA_PROFILE_ACTION = Object.freeze({
  VIEW: "VIEW",
  EDIT: "EDIT",
  REVEAL_TWOFA: "REVEAL_TWOFA",
  REVEAL_AUTH_KEY: "REVEAL_AUTH_KEY",
  MANAGE_ACCESS: "MANAGE_ACCESS",
});

export const twofaProfileNotFound = () =>
  new ApiError(404, "2FA profile not found", "TWOFA_PROFILE_NOT_FOUND");

export function requireTwofaEmployee(actor) {
  if (!actor?.employee_id)
    throw new ApiError(403, "An employee account is required to use 2FA Manager", "TWOFA_EMPLOYEE_REQUIRED");
}

export async function assertActiveTwofaEmployee(executor, actor) {
  requireTwofaEmployee(actor);
  const [[employee]] = await executor.execute(
    "SELECT id FROM employees WHERE id=? AND status='ACTIVE'",
    [actor.employee_id],
  );
  if (!employee)
    throw new ApiError(403, "An active employee account is required to use 2FA Manager", "TWOFA_EMPLOYEE_INACTIVE");
}

export async function getTwofaProfileAuthorization(
  executor,
  profileId,
  actor,
  action,
  { lock = false } = {},
) {
  requireTwofaEmployee(actor);
  const [[profile]] = await executor.execute(
    `SELECT id,created_by FROM twofa_profiles
     WHERE id=? AND deleted_at IS NULL${lock ? " FOR UPDATE" : ""}`,
    [profileId],
  );
  if (!profile) return { profile: null, access: null, allowed: false, isCeo: false };
  const [[employee]] = await executor.execute(
    "SELECT id FROM employees WHERE id=? AND status='ACTIVE'",
    [actor.employee_id],
  );
  if (!employee) return { profile, access: null, allowed: false, isCeo: false };
  const isCeo = await isCeoUser(actor.id, executor);
  const [[access]] = await executor.execute(
    `SELECT access_type,can_view,can_edit,can_reveal_twofa,can_reveal_auth_key
     FROM twofa_profile_access WHERE profile_id=? AND employee_id=? LIMIT 1`,
    [profile.id, actor.employee_id],
  );
  // Profile discovery is shared: every active employee with the route-level
  // view permission can see profiles. An OWNER/GRANTED row scopes sensitive
  // changes and reveals; module permissions remain the final action gate.
  const allowed = action === TWOFA_PROFILE_ACTION.VIEW
    ? true
    : isCeo || Boolean(access);
  return { profile, access: access || null, allowed, isCeo };
}

export async function recordTwofaAccessDenied(
  profileId,
  actor,
  operation,
  context,
  executor = pool,
) {
  await recordTwofaActivity(executor, {
    profileId,
    actor,
    action: "ACCESS_DENIED",
    context,
    eventStatus: "FAILURE",
    metadata: { operation },
  });
}

export async function assertTwofaProfileAccess(
  executor,
  profileId,
  actor,
  action,
  context,
  operation,
  options = {},
) {
  const authorization = await getTwofaProfileAuthorization(
    executor, profileId, actor, action, options,
  );
  if (!authorization.profile) throw twofaProfileNotFound();
  if (!authorization.allowed) {
    await recordTwofaAccessDenied(profileId, actor, operation, context, executor);
    throw twofaProfileNotFound();
  }
  return authorization;
}
