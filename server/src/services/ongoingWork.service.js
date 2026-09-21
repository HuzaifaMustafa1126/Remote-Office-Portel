import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { notifyByPolicy } from "./notification.service.js";

export const ONGOING_WORK_EVENTS = Object.freeze({
  CREATED: "ONGOING_WORK_CREATED",
  UPDATED: "ONGOING_WORK_UPDATED",
  STARTED: "ONGOING_WORK_STARTED",
  PAUSED: "ONGOING_WORK_PAUSED",
  SWITCHED: "ONGOING_WORK_SWITCHED",
  COMPLETED: "ONGOING_WORK_COMPLETED",
  DELETED: "ONGOING_WORK_DELETED",
});

const select = `SELECT ow.id,ow.employee_id employeeId,ow.title,ow.description,
  CASE WHEN ow.status='ONGOING' THEN 'PAUSED' ELSE ow.status END status,
  ow.started_at startedAt,ow.completed_at completedAt,ow.created_at createdAt,
  ow.updated_at updatedAt,CONCAT(e.first_name,' ',e.last_name) employeeName,
  COALESCE(t.accumulatedSeconds,ow.total_duration_seconds,0) accumulatedSeconds,
  t.activeSessionStartedAt,
  COALESCE(GREATEST(0,TIMESTAMPDIFF(SECOND,t.activeSessionStartedAt,CURRENT_TIMESTAMP)),0) currentSessionSeconds,
  COALESCE(t.accumulatedSeconds,ow.total_duration_seconds,0)+COALESCE(GREATEST(0,TIMESTAMPDIFF(SECOND,t.activeSessionStartedAt,CURRENT_TIMESTAMP)),0) totalTimeSpent,
  COALESCE(t.sessionCount,0) sessionCount,t.firstStartedAt,t.lastActivityAt,
  ow.completion_note completionNote,
  CURRENT_TIMESTAMP serverTime,UNIX_TIMESTAMP(CURRENT_TIMESTAMP) serverEpochSeconds
  FROM ongoing_work ow JOIN employees e ON e.id=ow.employee_id
  LEFT JOIN (
    SELECT ongoing_work_id,
      COALESCE(SUM(CASE WHEN ended_at IS NOT NULL THEN duration_seconds ELSE 0 END),0) accumulatedSeconds,
      MAX(CASE WHEN ended_at IS NULL THEN started_at END) activeSessionStartedAt,
      COUNT(*) sessionCount,MIN(started_at) firstStartedAt,
      MAX(COALESCE(ended_at,started_at)) lastActivityAt
    FROM ongoing_work_sessions GROUP BY ongoing_work_id
  ) t ON t.ongoing_work_id=ow.id`;

async function management(user, executor = pool) {
  const [[row]] = await executor.execute(
    "SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) yes",
    [user.id],
  );
  return Boolean(row.yes);
}

function employee(user) {
  if (!user.employee_id)
    throw new ApiError(403, "This account is not linked to an employee");
  return Number(user.employee_id);
}

async function transaction(action) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await action(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code) && attempt < 3)
        continue;
      if (error.code === "ER_DUP_ENTRY")
        throw new ApiError(
          409,
          "Another ongoing work timer is already running.",
          "ONGOING_WORK_TIMER_CONFLICT",
        );
      throw error;
    } finally {
      connection.release();
    }
  }
}

async function auditOngoingWork(
  executor,
  { user, employeeId, action, workId, description, oldValues, newValues, reason },
) {
  await executor.execute(
    `INSERT INTO audit_logs
     (user_id,employee_id,action,entity_type,entity_id,description,old_values,new_values,reason)
     VALUES(?,?,?,'ONGOING_WORK',?,?,?,?,?)`,
    [
      user?.id || null,
      employeeId,
      action,
      workId,
      description,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      reason || "MANUAL",
    ],
  );
}

function deliverOngoingNotification(eventType, user, data) {
  return notifyByPolicy(eventType, user, data).catch((error) => {
    console.error(`[${eventType}] notification delivery failed:`, error);
    return [];
  });
}

export function formatOngoingDuration(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = Math.floor(total % 60);
  return [hours && `${hours}h`, (minutes || hours) && `${minutes}m`, `${remainder}s`]
    .filter(Boolean)
    .join(" ");
}

async function assertEmployeeUser(user, executor = pool) {
  if (await management(user, executor))
    throw new ApiError(403, "Only employees can manage personal ongoing work");
  return employee(user);
}

async function getOwn(id, user, executor = pool, lock = false) {
  const employeeId = await assertEmployeeUser(user, executor);
  const [[row]] = await executor.execute(
    `${select} WHERE ow.id=? AND ow.employee_id=? AND ow.deleted_at IS NULL${lock ? " FOR UPDATE" : ""}`,
    [id, employeeId],
  );
  if (!row) throw new ApiError(404, "Ongoing work item not found");
  return row;
}

export async function mine(user) {
  if (await management(user))
    throw new ApiError(
      403,
      "Management can view ongoing work through Team Availability",
    );
  const employeeId = employee(user);
  const [rows] = await pool.execute(
    `${select} WHERE ow.employee_id=? AND ow.deleted_at IS NULL AND ow.status<>'COMPLETED' ORDER BY FIELD(ow.status,'WORKING','PAUSED','ONGOING'),ow.updated_at DESC LIMIT 100`,
    [employeeId],
  );
  return rows;
}

export async function team(user) {
  if (!(await management(user)))
    throw new ApiError(403, "Only management can view all ongoing work");
  const [rows] = await pool.execute(
    `${select} WHERE ow.deleted_at IS NULL AND ow.status IN('ONGOING','WORKING','PAUSED') ORDER BY e.first_name,e.last_name,ow.updated_at DESC`,
  );
  return rows;
}

async function teamSummary(executor = pool) {
  const [[row]] = await executor.execute(
    `SELECT
      COUNT(DISTINCT CASE WHEN active.employee_id IS NOT NULL THEN active.employee_id END) employeesWorkingNow,
      SUM(CASE WHEN ow.status IN('PAUSED','ONGOING') THEN 1 ELSE 0 END) pausedWork,
      SUM(CASE WHEN ow.status='COMPLETED' AND DATE(ow.completed_at)=CURDATE() THEN 1 ELSE 0 END) completedToday,
      SUM(CASE WHEN ow.status IN('WORKING','PAUSED','ONGOING') THEN 1 ELSE 0 END) totalActiveWorkItems
     FROM ongoing_work ow
     LEFT JOIN (
       SELECT DISTINCT employee_id FROM ongoing_work_sessions WHERE ended_at IS NULL
     ) active ON active.employee_id=ow.employee_id
     WHERE ow.deleted_at IS NULL`,
  );
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Number(value || 0)]),
  );
}

function searchFilter(search, params) {
  if (!search) return "";
  const value = `%${search}%`;
  params.push(value, value);
  return " AND (CONCAT(e.first_name,' ',e.last_name) LIKE ? OR ow.title LIKE ?)";
}

export async function teamActive(user, query) {
  if (!(await management(user)))
    throw new ApiError(403, "Only management can view team ongoing work");
  const params = [];
  let where = " WHERE ow.deleted_at IS NULL AND ow.status IN('WORKING','PAUSED','ONGOING')";
  if (query.status === "WORKING") where += " AND ow.status='WORKING'";
  if (query.status === "PAUSED") where += " AND ow.status IN('PAUSED','ONGOING')";
  if (query.employeeId) {
    where += " AND ow.employee_id=?";
    params.push(query.employeeId);
  }
  where += searchFilter(query.search, params);
  const [items] = await pool.execute(
    `${select}${where} ORDER BY FIELD(ow.status,'WORKING','PAUSED','ONGOING'),e.first_name,e.last_name,ow.updated_at DESC`,
    params,
  );
  return { summary: await teamSummary(), items };
}

function completedDateFilter(query, params) {
  if (query.date === "TODAY") return " AND DATE(ow.completed_at)=CURDATE()";
  if (query.date === "YESTERDAY")
    return " AND DATE(ow.completed_at)=DATE_SUB(CURDATE(),INTERVAL 1 DAY)";
  if (query.date === "LAST_7_DAYS")
    return " AND ow.completed_at>=DATE_SUB(CURDATE(),INTERVAL 6 DAY)";
  if (query.date === "CUSTOM") {
    params.push(query.from, query.to);
    return " AND DATE(ow.completed_at) BETWEEN ? AND ?";
  }
  return "";
}

export async function teamCompleted(user, query) {
  if (!(await management(user)))
    throw new ApiError(403, "Only management can view completed team work");
  const params = [];
  let where = " WHERE ow.deleted_at IS NULL AND ow.status='COMPLETED'";
  if (query.employeeId) {
    where += " AND ow.employee_id=?";
    params.push(query.employeeId);
  }
  where += searchFilter(query.search, params);
  where += completedDateFilter(query, params);
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM ongoing_work ow JOIN employees e ON e.id=ow.employee_id${where}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [items] = await pool.execute(
    `${select}${where} ORDER BY ow.completed_at DESC,ow.id DESC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  const total = Number(count.total || 0);
  return {
    summary: await teamSummary(),
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function teamDetails(user, id) {
  if (!(await management(user)))
    throw new ApiError(403, "Only management can view team ongoing work");
  const [[work]] = await pool.execute(`${select} WHERE ow.id=? AND ow.deleted_at IS NULL`, [id]);
  if (!work) throw new ApiError(404, "Ongoing work item not found");
  const [sessions] = await pool.execute(
    `SELECT started_at startedAt,ended_at endedAt,
      CASE WHEN ended_at IS NULL THEN GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP))
      ELSE duration_seconds END durationSeconds
     FROM ongoing_work_sessions WHERE ongoing_work_id=? ORDER BY started_at DESC LIMIT 100`,
    [id],
  );
  return { work, sessions };
}

export async function completed(user, { page, limit }) {
  const employeeId = await assertEmployeeUser(user);
  const offset = (page - 1) * limit;
  const [[count]] = await pool.execute(
    "SELECT COUNT(*) total FROM ongoing_work WHERE employee_id=? AND status='COMPLETED' AND deleted_at IS NULL",
    [employeeId],
  );
  const [items] = await pool.execute(
    `${select} WHERE ow.employee_id=? AND ow.status='COMPLETED' AND ow.deleted_at IS NULL ORDER BY ow.completed_at DESC,ow.id DESC LIMIT ? OFFSET ?`,
    [employeeId, limit, offset],
  );
  const total = Number(count.total || 0);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function create(data, user) {
  const work = await transaction(async (connection) => {
    const employeeId = await assertEmployeeUser(user, connection);
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [employeeId]);
    const [result] = await connection.execute(
      "INSERT INTO ongoing_work(employee_id,title,description,status,started_at)VALUES(?,?,?,'PAUSED',NULL)",
      [employeeId, data.title, data.description || null],
    );
    await auditOngoingWork(connection, {
      user, employeeId, action: ONGOING_WORK_EVENTS.CREATED, workId: result.insertId,
      description: `Ongoing work “${data.title}” was created.`,
      newValues: { title: data.title, description: data.description || null, status: "PAUSED" },
    });
    return getOwn(result.insertId, user, connection);
  });
  await deliverOngoingNotification(ONGOING_WORK_EVENTS.CREATED, user, {
    title: "Ongoing work created", message: `${work.employeeName} created “${work.title}”.`,
    referenceType: "ONGOING_WORK", referenceId: work.id, actionUrl: "/team-ongoing-work",
    eventKey: `${ONGOING_WORK_EVENTS.CREATED}:${work.id}`,
  });
  return work;
}

export async function update(id, data, user) {
  const work = await transaction(async (connection) => {
    const employeeId = await assertEmployeeUser(user, connection);
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [employeeId]);
    const row = await getOwn(id, user, connection, true);
    if (row.status === "COMPLETED")
      throw new ApiError(409, "Completed ongoing work is read-only.", "ONGOING_WORK_COMPLETED");
    await connection.execute(
      "UPDATE ongoing_work SET title=?,description=? WHERE id=? AND employee_id=?",
      [data.title, data.description || null, id, employeeId],
    );
    await auditOngoingWork(connection, {
      user, employeeId, action: ONGOING_WORK_EVENTS.UPDATED, workId: id,
      description: `Ongoing work “${data.title}” was updated.`,
      oldValues: { title: row.title, description: row.description },
      newValues: { title: data.title, description: data.description || null },
    });
    return getOwn(id, user, connection);
  });
  await deliverOngoingNotification(ONGOING_WORK_EVENTS.UPDATED, user, {
    title: "Ongoing work updated", message: `${work.employeeName} updated “${work.title}”.`,
    referenceType: "ONGOING_WORK", referenceId: work.id, actionUrl: "/team-ongoing-work",
    eventKey: `${ONGOING_WORK_EVENTS.UPDATED}:${work.id}:${work.updatedAt}`,
  });
  return work;
}

export function statusUpdateStatement(status) {
  const statements = {
    WORKING:
      "UPDATE ongoing_work SET status='WORKING',started_at=COALESCE(started_at,CURRENT_TIMESTAMP),completed_at=NULL WHERE id=?",
    PAUSED:
      "UPDATE ongoing_work SET status='PAUSED',completed_at=NULL WHERE id=?",
    COMPLETED:
      "UPDATE ongoing_work SET status='COMPLETED',completed_at=CURRENT_TIMESTAMP WHERE id=?",
  };
  const statement = statements[status];
  if (!statement)
    throw new ApiError(400, `Unsupported ongoing-work status: ${status}`);
  return statement;
}

// Retained for API compatibility. Timer transitions use start/pause below.
export async function setStatus(id, data, user) {
  const row = await getOwn(id, user);
  if (row.status === "COMPLETED")
    throw new ApiError(409, "Completed ongoing work cannot be resumed");
  if (data.status === "WORKING") return start(id, user);
  if (data.status === "PAUSED") return pause(id, user);
  throw new ApiError(
    409,
    "The completed-work workflow is not available yet.",
    "ONGOING_WORK_COMPLETION_UNAVAILABLE",
  );
}

export async function start(id, user) {
  const result = await transaction((connection) =>
    startOngoingWork(connection, id, user),
  );
  if (result?.attendanceRequired)
    throw new ApiError(
      409,
      "Clock in before starting ongoing work.",
      "ATTENDANCE_REQUIRED",
    );
  if (result?.breakActive)
    throw new ApiError(
      409,
      "End your break before starting ongoing work.",
      "BREAK_ACTIVE",
    );
  if (result?.notification) {
    await deliverOngoingNotification(result.notification.type, user, {
      title: result.notification.title,
      message: result.notification.message,
      referenceType: "ONGOING_WORK",
      referenceId: result.activeWork.id,
      actionUrl: "/team-ongoing-work",
      eventKey: result.notification.eventKey,
    });
  }
  delete result.notification;
  return result;
}

export async function startOngoingWork(connection, id, user) {
    const employeeId = await assertEmployeeUser(user, connection);
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      employeeId,
    ]);
    const row = await getOwn(id, user, connection, true);
    if (row.status === "COMPLETED")
      throw new ApiError(
        409,
        "This work item has already been completed.",
        "ONGOING_WORK_COMPLETED",
      );
    const [[attendance]] = await connection.execute(
      `SELECT id,status FROM attendance_records
       WHERE employee_id=? AND status IN('WORKING','ON_BREAK')
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [employeeId],
    );
    if (!attendance) {
      const [[stale]] = await connection.execute(
        `SELECT id,ongoing_work_id ongoingWorkId,started_at startedAt
         FROM ongoing_work_sessions
         WHERE employee_id=? AND ended_at IS NULL LIMIT 1 FOR UPDATE`,
        [employeeId],
      );
      if (!stale)
        throw new ApiError(
          409,
          "Clock in before starting ongoing work.",
          "ATTENDANCE_REQUIRED",
        );
      const [[lastAttendance]] = await connection.execute(
        `SELECT clock_out_at clockOutAt FROM attendance_records
         WHERE employee_id=? AND clock_out_at IS NOT NULL
         ORDER BY clock_out_at DESC LIMIT 1 FOR UPDATE`,
        [employeeId],
      );
      const [[boundary]] = await connection.execute(
        `SELECT CASE WHEN ? IS NOT NULL AND ?>=? THEN ? ELSE ? END recoveryTime`,
        [
          lastAttendance?.clockOutAt || null,
          lastAttendance?.clockOutAt || null,
          stale.startedAt,
          lastAttendance?.clockOutAt || null,
          stale.startedAt,
        ],
      );
      await pauseActiveOngoingWork(
        connection,
        employeeId,
        stale.ongoingWorkId,
        boundary.recoveryTime,
      );
      await connection.execute(
        `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
         VALUES(?,?,?,'ONGOING_WORK',?,?,?)`,
        [
          user.id,
          employeeId,
          "ONGOING_WORK_ATTENDANCE_INTEGRITY_RECOVERY",
          stale.ongoingWorkId,
          "A stale ongoing work timer was paused because no active attendance session existed.",
          JSON.stringify({ endedAt: boundary.recoveryTime }),
        ],
      );
      return { attendanceRequired: true };
    }
    const [[activeBreak]] = await connection.execute(
      `SELECT id,break_start_at breakStartedAt FROM attendance_breaks
       WHERE attendance_id=? AND status='ACTIVE' LIMIT 1 FOR UPDATE`,
      [attendance.id],
    );
    if (attendance.status === "ON_BREAK" || activeBreak) {
      const [[stale]] = await connection.execute(
        `SELECT id,ongoing_work_id ongoingWorkId FROM ongoing_work_sessions
         WHERE employee_id=? AND ended_at IS NULL LIMIT 1 FOR UPDATE`,
        [employeeId],
      );
      if (!stale || !activeBreak)
        throw new ApiError(
          409,
          "End your break before starting ongoing work.",
          "BREAK_ACTIVE",
        );
      await pauseActiveOngoingWork(
        connection,
        employeeId,
        stale.ongoingWorkId,
        activeBreak.breakStartedAt,
      );
      await connection.execute(
        `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
         VALUES(?,?,?,'ONGOING_WORK',?,?,?)`,
        [
          user.id,
          employeeId,
          "ONGOING_WORK_BREAK_INTEGRITY_RECOVERY",
          stale.ongoingWorkId,
          "A stale ongoing work timer was paused at the active break boundary.",
          JSON.stringify({ breakId: activeBreak.id, endedAt: activeBreak.breakStartedAt }),
        ],
      );
      return { breakActive: true };
    }
    const [[active]] = await connection.execute(
      `SELECT s.id,s.ongoing_work_id ongoingWorkId,ow.title
       FROM ongoing_work_sessions s JOIN ongoing_work ow ON ow.id=s.ongoing_work_id
       WHERE s.employee_id=? AND s.ended_at IS NULL LIMIT 1 FOR UPDATE`,
      [employeeId],
    );
    if (active && Number(active.ongoingWorkId) === Number(id)) {
      return {
        activeWork: await getOwn(id, user, connection),
        pausedWork: null,
        serverTime: row.serverTime,
      };
    }
    const [[clock]] = await connection.execute(
      "SELECT CURRENT_TIMESTAMP switchTime",
    );
    let pausedWork = null;
    if (active) {
      await pauseActiveOngoingWork(
        connection,
        employeeId,
        Number(active.ongoingWorkId),
        clock.switchTime,
      );
      pausedWork = await getOwn(
        active.ongoingWorkId,
        user,
        connection,
      );
    }
    const [createdSession] = await connection.execute(
      `INSERT INTO ongoing_work_sessions(ongoing_work_id,employee_id,user_id,attendance_record_id,started_at)
       VALUES(?,?,?,?,?)`,
      [id, employeeId, user.id, attendance.id, clock.switchTime],
    );
    await connection.execute(statusUpdateStatement("WORKING"), [id]);
    const startedWork = await getOwn(id, user, connection);
    const switched = Boolean(active);
    await auditOngoingWork(connection, {
      user, employeeId,
      action: switched ? ONGOING_WORK_EVENTS.SWITCHED : ONGOING_WORK_EVENTS.STARTED,
      workId: id,
      description: switched
        ? `Switched ongoing work from “${active.title}” to “${startedWork.title}”.`
        : `Started ongoing work “${startedWork.title}”.`,
      oldValues: switched ? { activeWorkId: Number(active.ongoingWorkId), title: active.title } : null,
      newValues: { activeWorkId: Number(id), title: startedWork.title, startedAt: clock.switchTime },
    });
    return {
      activeWork: startedWork,
      pausedWork,
      serverTime: clock.switchTime,
      notification: {
        type: switched ? ONGOING_WORK_EVENTS.SWITCHED : ONGOING_WORK_EVENTS.STARTED,
        title: switched ? "Ongoing work switched" : "Ongoing work started",
        message: switched
          ? `${startedWork.employeeName} paused “${active.title}” and started “${startedWork.title}”.`
          : `${startedWork.employeeName} ${Number(row.sessionCount || 0) ? "resumed" : "started"} “${startedWork.title}”.`,
        eventKey: `${switched ? ONGOING_WORK_EVENTS.SWITCHED : ONGOING_WORK_EVENTS.STARTED}:${createdSession.insertId}`,
      },
    };
}

export async function pauseActiveOngoingWork(
  executor,
  employeeId,
  ongoingWorkId = null,
  endedAt = null,
) {
  const params = [employeeId];
  let workFilter = "";
  if (ongoingWorkId != null) {
    workFilter = " AND s.ongoing_work_id=?";
    params.push(ongoingWorkId);
  }
  const [[session]] = await executor.execute(
    `SELECT s.id,s.ongoing_work_id ongoingWorkId
     FROM ongoing_work_sessions s
     WHERE s.employee_id=? AND s.ended_at IS NULL${workFilter}
     LIMIT 1 FOR UPDATE`,
    params,
  );
  if (!session) return null;
  const timestamp = endedAt || null;
  const [closed] = timestamp
    ? await executor.execute(
        `UPDATE ongoing_work_sessions
         SET ended_at=?,duration_seconds=GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,?))
         WHERE id=? AND ended_at IS NULL`,
        [timestamp, timestamp, session.id],
      )
    : await executor.execute(
        `UPDATE ongoing_work_sessions
         SET ended_at=CURRENT_TIMESTAMP,
           duration_seconds=GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP))
         WHERE id=? AND ended_at IS NULL`,
        [session.id],
      );
  if (!closed.affectedRows) return null;
  await executor.execute(statusUpdateStatement("PAUSED"), [session.ongoingWorkId]);
  return Number(session.ongoingWorkId);
}

export async function pause(id, user) {
  const result = await transaction(async (connection) => {
    const employeeId = await assertEmployeeUser(user, connection);
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      employeeId,
    ]);
    const row = await getOwn(id, user, connection, true);
    if (row.status === "COMPLETED")
      throw new ApiError(
        409,
        "This work item has already been completed.",
        "ONGOING_WORK_COMPLETED",
      );
    const pausedId = await pauseActiveOngoingWork(
      connection,
      employeeId,
      Number(id),
    );
    if (!pausedId && row.status !== "PAUSED")
      await connection.execute(statusUpdateStatement("PAUSED"), [id]);
    if (pausedId || row.status !== "PAUSED")
      await auditOngoingWork(connection, {
        user, employeeId, action: ONGOING_WORK_EVENTS.PAUSED, workId: id,
        description: `Paused ongoing work “${row.title}”.`,
        oldValues: { status: row.status }, newValues: { status: "PAUSED" },
      });
    return { work: await getOwn(id, user, connection), changed: Boolean(pausedId || row.status !== "PAUSED") };
  });
  if (result.changed)
    await deliverOngoingNotification(ONGOING_WORK_EVENTS.PAUSED, user, {
      title: "Ongoing work paused", message: `${result.work.employeeName} paused “${result.work.title}”.`,
      referenceType: "ONGOING_WORK", referenceId: result.work.id, actionUrl: "/team-ongoing-work",
      eventKey: `${ONGOING_WORK_EVENTS.PAUSED}:${result.work.id}:${result.work.updatedAt}`,
    });
  return result.work;
}

export async function complete(id, data, user) {
  const result = await transaction((connection) =>
    completeOngoingWork(connection, id, data, user),
  );
  await deliverOngoingNotification(ONGOING_WORK_EVENTS.COMPLETED, user, {
    title: "Ongoing work completed",
    message: `${result.work.employeeName} completed “${result.work.title}” (${formatOngoingDuration(result.work.totalTimeSpent)}).`,
    referenceType: "ONGOING_WORK",
    referenceId: result.work.id,
    actionUrl: "/team-ongoing-work",
    eventKey: `${ONGOING_WORK_EVENTS.COMPLETED}:${result.work.id}`,
  });
  return result;
}

export async function completeOngoingWork(connection, id, data, user) {
    const employeeId = await assertEmployeeUser(user, connection);
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      employeeId,
    ]);
    const row = await getOwn(id, user, connection, true);
    if (row.status === "COMPLETED")
      throw new ApiError(
        409,
        "This work item has already been completed.",
        "ONGOING_WORK_COMPLETED",
      );
    const [[clock]] = await connection.execute(
      "SELECT CURRENT_TIMESTAMP completionTime",
    );
    let sessionEndTime = clock.completionTime;
    if (row.status === "WORKING") {
      const [[attendance]] = await connection.execute(
        `SELECT id FROM attendance_records
         WHERE employee_id=? AND status IN('WORKING','ON_BREAK')
         ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        [employeeId],
      );
      if (!attendance) {
        const [[activeSession]] = await connection.execute(
          `SELECT started_at startedAt FROM ongoing_work_sessions
           WHERE ongoing_work_id=? AND ended_at IS NULL LIMIT 1 FOR UPDATE`,
          [id],
        );
        const [[lastAttendance]] = await connection.execute(
          `SELECT clock_out_at clockOutAt FROM attendance_records
           WHERE employee_id=? AND clock_out_at IS NOT NULL
           ORDER BY clock_out_at DESC LIMIT 1 FOR UPDATE`,
          [employeeId],
        );
        if (activeSession) {
          const [[boundary]] = await connection.execute(
            `SELECT CASE WHEN ? IS NOT NULL AND ?>=? THEN ? ELSE ? END recoveryTime`,
            [
              lastAttendance?.clockOutAt || null,
              lastAttendance?.clockOutAt || null,
              activeSession.startedAt,
              lastAttendance?.clockOutAt || null,
              activeSession.startedAt,
            ],
          );
          sessionEndTime = boundary.recoveryTime;
        }
      }
    }
    await pauseActiveOngoingWork(
      connection,
      employeeId,
      Number(id),
      sessionEndTime,
    );
    const [[duration]] = await connection.execute(
      `SELECT COALESCE(SUM(COALESCE(duration_seconds,
         GREATEST(0,TIMESTAMPDIFF(SECOND,started_at,ended_at)))),0) totalSeconds
       FROM ongoing_work_sessions WHERE ongoing_work_id=? AND ended_at IS NOT NULL`,
      [id],
    );
    await connection.execute(
      `UPDATE ongoing_work SET status='COMPLETED',completion_note=?,
       completed_at=?,total_duration_seconds=? WHERE id=? AND employee_id=?`,
      [
        data.completionNote,
        clock.completionTime,
        Number(duration.totalSeconds || 0),
        id,
        employeeId,
      ],
    );
    const completedWork = await getOwn(id, user, connection);
    await auditOngoingWork(connection, {
      user, employeeId, action: ONGOING_WORK_EVENTS.COMPLETED, workId: id,
      description: `Completed ongoing work “${row.title}”.`,
      oldValues: { status: row.status },
      newValues: {
        status: "COMPLETED", completionNote: data.completionNote,
        completedAt: clock.completionTime, totalDurationSeconds: Number(duration.totalSeconds || 0),
      },
    });
    return {
      work: completedWork,
      serverTime: clock.completionTime,
    };
}

export async function remove(id, user) {
  const result = await transaction(async (connection) => {
    const employeeId = await assertEmployeeUser(user, connection);
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      employeeId,
    ]);
    const row = await getOwn(id, user, connection, true);
    if (row.status === "COMPLETED")
      throw new ApiError(
        409,
        "Completed ongoing work cannot be deleted.",
        "ONGOING_WORK_COMPLETED",
      );
    const [[active]] = await connection.execute(
      "SELECT id FROM ongoing_work_sessions WHERE ongoing_work_id=? AND ended_at IS NULL LIMIT 1 FOR UPDATE",
      [id],
    );
    if (active)
      throw new ApiError(
        409,
        "Pause this work before deleting it.",
        "ONGOING_WORK_PAUSE_REQUIRED",
      );
    await auditOngoingWork(connection, {
      user, employeeId, action: ONGOING_WORK_EVENTS.DELETED, workId: id,
      description: `Deleted ongoing work “${row.title}”.`,
      oldValues: { title: row.title, description: row.description, status: row.status },
    });
    await connection.execute(
      "DELETE FROM ongoing_work WHERE id=? AND employee_id=?",
      [id, employeeId],
    );
    return { deleted: true, id: Number(id), work: row };
  });
  await deliverOngoingNotification(ONGOING_WORK_EVENTS.DELETED, user, {
    title: "Ongoing work deleted", message: `${result.work.employeeName} deleted “${result.work.title}”.`,
    referenceType: "ONGOING_WORK", referenceId: result.id, actionUrl: "/team-ongoing-work",
    eventKey: `${ONGOING_WORK_EVENTS.DELETED}:${result.id}`,
  });
  delete result.work;
  return result;
}

export async function retentionSettings(user) {
  if (!(await management(user)))
    throw new ApiError(403, "Only management can view Ongoing Work retention settings");
  const [[row]] = await pool.execute(
    `SELECT auto_cleanup_enabled autoCleanupEnabled,retention_days retentionDays,
       updated_at updatedAt
     FROM ongoing_work_retention_settings WHERE id=1`,
  );
  return {
    autoCleanupEnabled: Boolean(row.autoCleanupEnabled),
    retentionDays: Number(row.retentionDays),
    updatedAt: row.updatedAt,
  };
}

export async function updateRetentionSettings(data, user) {
  if (!(await management(user)))
    throw new ApiError(403, "Only management can update Ongoing Work retention settings");
  await transaction(async (connection) => {
    const [[before]] = await connection.execute(
      `SELECT auto_cleanup_enabled autoCleanupEnabled,retention_days retentionDays
       FROM ongoing_work_retention_settings WHERE id=1 FOR UPDATE`,
    );
    await connection.execute(
      `UPDATE ongoing_work_retention_settings
       SET auto_cleanup_enabled=?,retention_days=?,updated_by=? WHERE id=1`,
      [data.autoCleanupEnabled, data.retentionDays, user.id],
    );
    await connection.execute(
      `INSERT INTO audit_logs
       (user_id,employee_id,action,entity_type,entity_id,description,old_values,new_values,reason)
       VALUES(?,?,?,'ONGOING_WORK_RETENTION',1,?,?,?,'MANUAL')`,
      [
        user.id,
        user.employee_id,
        "ONGOING_WORK_RETENTION_UPDATED",
        "Completed Ongoing Work retention settings were updated.",
        JSON.stringify({
          autoCleanupEnabled: Boolean(before.autoCleanupEnabled),
          retentionDays: Number(before.retentionDays),
        }),
        JSON.stringify(data),
      ],
    );
  });
  return retentionSettings(user);
}

export async function removeCompletedByAdmin(id, user) {
  if (!(await management(user)))
    throw new ApiError(403, "Only CEO/Admin can delete completed Ongoing Work");
  return transaction(async (connection) => {
    const [[candidate]] = await connection.execute(
      `SELECT id,employee_id employeeId FROM ongoing_work
       WHERE id=? AND deleted_at IS NULL`,
      [id],
    );
    if (!candidate) throw new ApiError(404, "Ongoing work item not found");
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [candidate.employeeId]);
    const [[work]] = await connection.execute(
      `SELECT id,employee_id employeeId,title,status,completed_at completedAt
       FROM ongoing_work WHERE id=? AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );
    if (!work) throw new ApiError(404, "Ongoing work item not found");
    if (work.status !== "COMPLETED")
      throw new ApiError(409, "Only completed Ongoing Work can be deleted", "ONGOING_WORK_NOT_COMPLETED");
    await connection.execute(
      `UPDATE ongoing_work SET deleted_at=CURRENT_TIMESTAMP,deleted_by_user_id=?,
       deletion_reason='MANUAL_ADMIN_DELETE' WHERE id=? AND status='COMPLETED' AND deleted_at IS NULL`,
      [user.id, id],
    );
    await auditOngoingWork(connection, {
      user,
      employeeId: work.employeeId,
      action: "ONGOING_WORK_DELETED_BY_ADMIN",
      workId: work.id,
      description: `Completed ongoing work “${work.title}” was removed by management.`,
      oldValues: { status: work.status, completedAt: work.completedAt },
      newValues: { deletionReason: "MANUAL_ADMIN_DELETE", deletedBy: user.id },
      reason: "MANUAL_ADMIN_DELETE",
    });
    return { deleted: true, id: Number(id) };
  });
}

export async function cleanupCompletedOngoingWork({ batchSize = 200 } = {}) {
  const size = Math.min(500, Math.max(1, Number(batchSize) || 200));
  const [[settings]] = await pool.execute(
    `SELECT auto_cleanup_enabled autoCleanupEnabled,retention_days retentionDays
     FROM ongoing_work_retention_settings WHERE id=1`,
  );
  if (!settings?.autoCleanupEnabled)
    return { enabled: false, retentionDays: Number(settings?.retentionDays || 7), cleaned: 0 };

  let cleaned = 0;
  while (true) {
    const count = await transaction(async (connection) => {
      const [rows] = await connection.execute(
        `SELECT id,employee_id employeeId,title,completed_at completedAt
         FROM ongoing_work
         WHERE status='COMPLETED' AND deleted_at IS NULL
           AND completed_at<DATE_SUB(CURRENT_TIMESTAMP,INTERVAL ? DAY)
         ORDER BY completed_at,id LIMIT ? FOR UPDATE SKIP LOCKED`,
        [Number(settings.retentionDays), size],
      );
      if (!rows.length) return 0;
      const ids = rows.map((row) => Number(row.id));
      await connection.execute(
        `UPDATE ongoing_work SET deleted_at=CURRENT_TIMESTAMP,
         deleted_by_user_id=NULL,deletion_reason='RETENTION_POLICY'
         WHERE status='COMPLETED' AND deleted_at IS NULL
           AND id IN(${ids.map(() => "?").join(",")})`,
        ids,
      );
      for (const work of rows)
        await auditOngoingWork(connection, {
          user: null,
          employeeId: work.employeeId,
          action: "ONGOING_WORK_AUTO_CLEANED",
          workId: work.id,
          description: `Completed ongoing work “${work.title}” was archived by the retention policy.`,
          oldValues: { status: "COMPLETED", completedAt: work.completedAt },
          newValues: { deletionReason: "RETENTION_POLICY", retentionDays: Number(settings.retentionDays) },
          reason: "RETENTION_POLICY",
        });
      return rows.length;
    });
    cleaned += count;
    if (count < size) break;
  }
  return { enabled: true, retentionDays: Number(settings.retentionDays), cleaned };
}
