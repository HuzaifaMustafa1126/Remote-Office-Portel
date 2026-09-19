import ApiError from "../utils/ApiError.js";

export async function startTaskSession(
  executor,
  {
    taskId,
    employeeId,
    switchExisting = false,
    expectedActiveTaskId = null,
  },
) {
  await executor.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [employeeId]);
  const [[active]] = await executor.execute(
    "SELECT id,task_id taskId FROM task_work_sessions WHERE employee_id=? AND state='ACTIVE' LIMIT 1 FOR UPDATE",
    [employeeId],
  );
  if (active) {
    if (Number(active.taskId) === Number(taskId))
      throw new ApiError(
        409,
        "This task already has an active work session.",
        "TASK_SESSION_ACTIVE",
      );
    if (!switchExisting)
      throw new ApiError(
        409,
        "Another task is currently running. Confirm the switch to pause it and start this task.",
        "TASK_SWITCH_REQUIRED",
      );
    if (
      expectedActiveTaskId != null &&
      Number(active.taskId) !== Number(expectedActiveTaskId)
    )
      throw new ApiError(
        409,
        "Your active task changed in another session. Refresh and try again.",
        "TASK_SWITCH_CONFLICT",
      );
    await executor.execute(
      `UPDATE task_work_sessions
       SET state='ENDED',ended_at=CURRENT_TIMESTAMP,
           duration_seconds=GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP)),
           end_reason='PAUSED'
       WHERE id=? AND state='ACTIVE'`,
      [active.id],
    );
    await executor.execute(
      `INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)
       SELECT id,'WORK_SESSION_PAUSED',status,status,? FROM tasks WHERE id=?`,
      [
        JSON.stringify({
          reason: "TASK_SWITCHED",
          employeeId,
          nextTaskId: Number(taskId),
        }),
        active.taskId,
      ],
    );
  }
  try {
    const [result] = await executor.execute(
      "INSERT INTO task_work_sessions(task_id,employee_id,started_at)VALUES(?,?,CURRENT_TIMESTAMP)",
      [taskId, employeeId],
    );
    const [[session]] = await executor.execute(
      "SELECT id,task_id taskId,employee_id employeeId,started_at startedAt FROM task_work_sessions WHERE id=?",
      [result.insertId],
    );
    return {
      ...session,
      switchedFromTaskId: active ? Number(active.taskId) : null,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "You already have another task in progress.", "TASK_SESSION_ACTIVE");
    }
    throw error;
  }
}

export async function endTaskSession(
  executor,
  { taskId, employeeId = null, reason, required = true },
) {
  const params = [taskId];
  let employeeFilter = "";
  if (employeeId != null) {
    employeeFilter = " AND employee_id=?";
    params.push(employeeId);
  }
  const [sessions] = await executor.execute(
    `SELECT id,employee_id employeeId,started_at startedAt FROM task_work_sessions WHERE task_id=?${employeeFilter} AND state='ACTIVE' FOR UPDATE`,
    params,
  );
  if (!sessions.length) {
    if (required) throw new ApiError(409, "No active work session exists for this task.", "TASK_SESSION_MISSING");
    return [];
  }
  await executor.execute(
    `UPDATE task_work_sessions SET state='ENDED',ended_at=CURRENT_TIMESTAMP,duration_seconds=GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP)),end_reason=? WHERE id IN(${sessions.map(() => "?").join(",")})`,
    [reason, ...sessions.map((session) => session.id)],
  );
  return sessions;
}

export async function getTaskTimeTracking(executor, taskId) {
  const [[clock]] = await executor.execute("SELECT CURRENT_TIMESTAMP serverTime");
  const [[totals]] = await executor.execute(
    `SELECT
      COALESCE(SUM(CASE WHEN state='ENDED' THEN COALESCE(duration_seconds,GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,ended_at))) ELSE 0 END),0) completedSeconds,
      COALESCE(SUM(CASE WHEN state='ACTIVE' THEN GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP)) ELSE 0 END),0) activeSeconds,
      MAX(CASE WHEN state='ACTIVE' THEN started_at END) activeSessionStartedAt,
      MAX(CASE WHEN state='ACTIVE' THEN employee_id END) activeEmployeeId
     FROM task_work_sessions WHERE task_id=?`,
    [taskId],
  );
  const [contributors] = await executor.execute(
    `SELECT tws.employee_id employeeId,CONCAT(e.first_name,' ',e.last_name) name,
      COALESCE(SUM(CASE WHEN tws.state='ACTIVE' THEN GREATEST(0,TIMESTAMPDIFF(SECOND,tws.started_at,CURRENT_TIMESTAMP)) ELSE COALESCE(tws.duration_seconds,GREATEST(0,TIMESTAMPDIFF(SECOND,tws.started_at,tws.ended_at))) END),0) totalSeconds,
      COUNT(*) sessionCount
     FROM task_work_sessions tws JOIN employees e ON e.id=tws.employee_id
     WHERE tws.task_id=? GROUP BY tws.employee_id,e.first_name,e.last_name ORDER BY MIN(tws.started_at)`,
    [taskId],
  );
  const completedSeconds = Number(totals.completedSeconds || 0);
  const activeSeconds = Number(totals.activeSeconds || 0);
  return {
    completedSeconds,
    activeSeconds,
    totalSeconds: completedSeconds + activeSeconds,
    isRunning: Boolean(totals.activeSessionStartedAt),
    activeSessionStartedAt: totals.activeSessionStartedAt || null,
    activeEmployeeId: totals.activeEmployeeId ? Number(totals.activeEmployeeId) : null,
    serverTime: clock.serverTime,
    contributors: contributors.map((row) => ({
      employeeId: Number(row.employeeId),
      name: row.name,
      totalSeconds: Number(row.totalSeconds || 0),
      sessionCount: Number(row.sessionCount || 0),
    })),
  };
}

// Attendance integration points share the caller's transaction.
export async function pauseActiveTask(executor, employeeId, reason) {
  const [[session]] = await executor.execute(
    "SELECT id,task_id taskId FROM task_work_sessions WHERE employee_id=? AND state='ACTIVE' FOR UPDATE",
    [employeeId],
  );
  if (!session) return null;
  await endTaskSession(executor, { taskId: session.taskId, employeeId, reason, required: false });
  await executor.execute(
    "INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)SELECT id,'WORK_SESSION_PAUSED',status,status,? FROM tasks WHERE id=?",
    [JSON.stringify({ reason, employeeId }), session.taskId],
  );
  return session.taskId;
}

export async function resumeTaskAfterBreak(
  executor,
  { employeeId, taskId, breakId },
) {
  if (!taskId) return null;
  await executor.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
    employeeId,
  ]);
  const [[attendance]] = await executor.execute(
    "SELECT id FROM attendance_records WHERE employee_id=? AND status='WORKING' ORDER BY id DESC LIMIT 1 FOR UPDATE",
    [employeeId],
  );
  if (!attendance) return null;
  const [[task]] = await executor.execute(
    "SELECT id FROM tasks WHERE id=? AND assignee_employee_id=? AND status='IN_PROGRESS' FOR UPDATE",
    [taskId, employeeId],
  );
  if (!task) return null;
  const [[active]] = await executor.execute(
    "SELECT id FROM task_work_sessions WHERE employee_id=? AND state='ACTIVE' LIMIT 1 FOR UPDATE",
    [employeeId],
  );
  if (active) return null;
  await startTaskSession(executor, { taskId, employeeId });
  await executor.execute(
    "INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)SELECT id,'WORK_SESSION_RESUMED',status,status,? FROM tasks WHERE id=?",
    [JSON.stringify({ reason: "BREAK_ENDED", employeeId, breakId }), taskId],
  );
  return Number(taskId);
}
