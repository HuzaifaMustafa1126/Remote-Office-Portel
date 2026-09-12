import pool from "../config/database.js";

async function transaction(action) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await action(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function closeStaleTaskSession(executor, sessionId) {
  const [[candidate]] = await executor.execute(
    "SELECT task_id taskId FROM task_work_sessions WHERE id=? AND state='ACTIVE'",
    [sessionId],
  );
  if (!candidate) return null;
  await executor.execute("SELECT id FROM tasks WHERE id=? FOR UPDATE", [
    candidate.taskId,
  ]);
  const [[session]] = await executor.execute(
    "SELECT id,task_id taskId,employee_id employeeId,started_at startedAt FROM task_work_sessions WHERE id=? AND state='ACTIVE' FOR UPDATE",
    [sessionId],
  );
  if (!session) return null;
  const [[settings]] = await executor.execute(
    "SELECT offline_timeout_minutes timeoutMinutes FROM task_settings WHERE id=1 FOR UPDATE",
  );
  const [presenceRows] = await executor.execute(
    `SELECT s.last_seen_at lastSeenAt
     FROM auth_sessions s JOIN users u ON u.id=s.user_id
     WHERE u.employee_id=? AND s.status='ACTIVE' AND s.revoked_at IS NULL
       AND s.expires_at>CURRENT_TIMESTAMP
     ORDER BY s.last_seen_at DESC LIMIT 1 FOR UPDATE`,
    [session.employeeId],
  );
  const presenceAt = presenceRows[0]?.lastSeenAt || session.startedAt;
  const [[clock]] = await executor.execute(
    `SELECT CURRENT_TIMESTAMP serverTime,
      TIMESTAMPADD(MINUTE,?,GREATEST(?,?)) effectiveEndAt`,
    [Number(settings?.timeoutMinutes || 5), presenceAt, session.startedAt],
  );
  if (new Date(clock.effectiveEndAt) > new Date(clock.serverTime)) return null;
  const [closed] = await executor.execute(
    `UPDATE task_work_sessions
     SET state='ENDED',ended_at=?,duration_seconds=GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,?)),end_reason='OFFLINE'
     WHERE id=? AND state='ACTIVE'`,
    [clock.effectiveEndAt, clock.effectiveEndAt, session.id],
  );
  if (!closed.affectedRows) return null;
  const metadata = JSON.stringify({
    reason: "OFFLINE_TIMEOUT",
    employeeId: Number(session.employeeId),
    timeoutMinutes: Number(settings?.timeoutMinutes || 5),
    effectiveEndAt: clock.effectiveEndAt,
  });
  await executor.execute(
    "INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)SELECT id,'WORK_SESSION_PAUSED',status,status,? FROM tasks WHERE id=?",
    [metadata, session.taskId],
  );
  await executor.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
     VALUES(NULL,?,'TASK_WORK_SESSION_OFFLINE_TIMEOUT','TASK',?,?,?)`,
    [
      session.employeeId,
      session.taskId,
      `Task work was paused after ${Number(settings?.timeoutMinutes || 5)} minutes without authenticated app presence.`,
      metadata,
    ],
  );
  return {
    taskId: Number(session.taskId),
    employeeId: Number(session.employeeId),
    effectiveEndAt: clock.effectiveEndAt,
  };
}

export async function pauseStaleTaskSessions() {
  const [rows] = await pool.execute(
    `SELECT tws.id
     FROM task_work_sessions tws
     JOIN users u ON u.employee_id=tws.employee_id
     JOIN task_settings ts ON ts.id=1
     LEFT JOIN auth_sessions s ON s.user_id=u.id AND s.status='ACTIVE'
       AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP
     WHERE tws.state='ACTIVE'
     GROUP BY tws.id,tws.started_at,ts.offline_timeout_minutes
     HAVING TIMESTAMPADD(MINUTE,ts.offline_timeout_minutes,
       GREATEST(tws.started_at,COALESCE(MAX(s.last_seen_at),tws.started_at)))<=CURRENT_TIMESTAMP
     ORDER BY tws.id LIMIT 100`,
  );
  const results = [];
  for (const row of rows) {
    const result = await transaction((conn) =>
      closeStaleTaskSession(conn, row.id),
    );
    if (result) results.push(result);
  }
  return results;
}
