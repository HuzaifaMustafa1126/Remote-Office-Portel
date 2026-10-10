const ACTIONS = [
  "PROFILE_CREATED", "PROFILE_UPDATED", "PROFILE_DELETED",
  "PLATFORM_ADDED", "PLATFORM_UPDATED", "PLATFORM_REMOVED",
  "TWOFA_UPDATED", "AUTH_KEY_UPDATED", "TWOFA_REVEALED", "AUTH_KEY_REVEALED",
  "ACCESS_GRANTED", "ACCESS_UPDATED", "ACCESS_REVOKED", "ACCESS_DENIED",
];
export const TWOFA_ACTIVITY_ACTION_VALUES = Object.freeze([...ACTIONS]);
export const TWOFA_ACTIVITY_ACTIONS = Object.freeze(Object.fromEntries(ACTIONS.map((x) => [x, x])));
const allowedMetadataKeys = new Set(["operation", "platformType", "accountLabel", "targetEmployeeId", "permissions", "changeType", "previousProfileName", "newProfileName"]);
const allowedPermissionKeys = new Set(["canView", "canEdit", "canRevealTwofa", "canRevealAuthKey"]);
const forbiddenKey = /(secret|password|credential|cipher|auth.?key|twofa.?information|token|plaintext|value)/i;
export const sanitizeTwofaActivityMetadata = (metadata) => {
  if (metadata == null) return null;
  const result = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!allowedMetadataKeys.has(key) || forbiddenKey.test(key)) continue;
    if (key === "permissions" && value && typeof value === "object")
      result.permissions = Object.fromEntries(Object.entries(value).filter(([name, permission]) => allowedPermissionKeys.has(name) && typeof permission === "boolean"));
    else if (["string", "number", "boolean"].includes(typeof value))
      result[key] = typeof value === "string" ? value.slice(0, 200) : value;
  }
  return Object.keys(result).length ? result : null;
};
const safeJson = (value) => value == null ? null : JSON.stringify(value);

async function snapshots(executor, profileId, platformId, actor) {
  const [[row]] = await executor.execute(
    `SELECT p.profile_name profileName,
      CASE WHEN tp.platform_name='OTHER' THEN tp.platform_custom_name ELSE REPLACE(tp.platform_name,'_',' ') END platformName,
      CONCAT(e.first_name,' ',e.last_name) employeeName
     FROM twofa_profiles p
     LEFT JOIN twofa_platforms tp ON tp.id=? AND tp.profile_id=p.id
     LEFT JOIN employees e ON e.id=?
     WHERE p.id=?`,
    [platformId || null, actor?.employee_id || null, profileId],
  );
  return { profileName: row?.profileName || null, platformName: row?.platformName || null, employeeName: row?.employeeName || null };
}

export async function recordTwofaActivity(executor, {
    profileId,
    platformId = null,
    actor,
    action,
    changedFields = null,
    context = {},
    eventStatus = "SUCCESS",
    metadata = null,
    profileNameSnapshot = null,
    platformNameSnapshot = null,
    employeeNameSnapshot = null,
  }) {
  if (!ACTIONS.includes(action)) throw new TypeError(`Unsupported 2FA activity action: ${action}`);
  if (!profileId) throw new TypeError("2FA activity requires a profile ID");
  const names = await snapshots(executor, profileId, platformId, actor);
  await executor.execute(
    `INSERT INTO twofa_activity_logs(
       profile_id,profile_name_snapshot,platform_id,platform_name_snapshot,
       actor_user_id,employee_id,employee_name_snapshot,action,changed_fields,
       ip_address,user_agent,request_id,event_status,metadata
     ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      profileId, profileNameSnapshot || names.profileName,
      platformId, platformNameSnapshot || names.platformName,
      actor?.id || null,
      actor?.employee_id || null,
      employeeNameSnapshot || names.employeeName,
      action,
      safeJson(changedFields),
      context.ip || null,
      context.userAgent || null,
      context.requestId || null,
      eventStatus,
      safeJson(sanitizeTwofaActivityMetadata(metadata)),
    ],
  );
}
