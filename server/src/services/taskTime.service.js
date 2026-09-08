// Attendance integration points. These run inside the attendance transaction.
export async function pauseActiveTask(executor, employeeId, reason) {
  const [[session]] = await executor.execute(
    "SELECT id,task_id taskId FROM task_work_sessions WHERE employee_id=? AND state='ACTIVE' FOR UPDATE",
    [employeeId],
  );
  if (!session) return null;
  await executor.execute(
    "UPDATE task_work_sessions SET state='ENDED',ended_at=CURRENT_TIMESTAMP,duration_seconds=TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP),end_reason=? WHERE id=?",
    [reason, session.id],
  );
  await executor.execute(
    "INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)SELECT id,'WORK_SESSION_PAUSED',status,status,? FROM tasks WHERE id=?",
    [JSON.stringify({ reason, employeeId }), session.taskId],
  );
  return session.taskId;
}
export async function resumeTaskAfterBreak(executor, employeeId) {
  const [[session]] = await executor.execute(
    "SELECT tws.task_id taskId FROM task_work_sessions tws JOIN tasks t ON t.id=tws.task_id WHERE tws.employee_id=? AND tws.state='ENDED' AND tws.end_reason='BREAK' AND t.status='IN_PROGRESS' ORDER BY tws.ended_at DESC LIMIT 1 FOR UPDATE",
    [employeeId],
  );
  if (!session) return null;
  await executor.execute(
    "INSERT INTO task_work_sessions(task_id,employee_id,started_at)VALUES(?,?,CURRENT_TIMESTAMP)",
    [session.taskId, employeeId],
  );
  await executor.execute(
    "INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)SELECT id,'WORK_SESSION_RESUMED',status,status,? FROM tasks WHERE id=?",
    [JSON.stringify({ reason: "BREAK_ENDED", employeeId }), session.taskId],
  );
  return session.taskId;
}
