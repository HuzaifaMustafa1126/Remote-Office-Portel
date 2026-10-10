const safeJson = (value) =>
  value === null || value === undefined ? null : JSON.stringify(value);

export async function recordTwofaActivity(
  executor,
  {
    profileId,
    platformId = null,
    actor,
    action,
    changedFields = null,
    context = {},
    eventStatus = "SUCCESS",
    metadata = null,
  },
) {
  await executor.execute(
    `INSERT INTO twofa_activity_logs(
       profile_id,platform_id,actor_user_id,employee_id,action,changed_fields,
       ip_address,user_agent,request_id,event_status,metadata
     ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    [
      profileId,
      platformId,
      actor?.id || null,
      actor?.employee_id || null,
      action,
      safeJson(changedFields),
      context.ip || null,
      context.userAgent || null,
      context.requestId || null,
      eventStatus,
      safeJson(metadata),
    ],
  );
}
