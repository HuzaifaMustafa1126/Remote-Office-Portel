import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import {
  displayStatus,
  parseExact,
  relativeDate,
  sqlToIso,
  toSqlDateTime,
} from "../utils/scheduledWorkTime.js";
import {
  createInitialReminders,
  recalculateReminders,
} from "./scheduledWorkReminder.service.js";
import {
  generateForParent,
  listRecurring,
  occurrenceRowsForList,
} from "./scheduledWorkRecurrence.service.js";
import { completeOngoingWork } from "./ongoingWork.service.js";

const select = `SELECT id,title,description,created_by createdBy,assigned_to assignedTo,
 schedule_type scheduleType,scheduled_at scheduledAt,relative_value relativeValue,
 relative_unit relativeUnit,priority,status,started_at startedAt,completed_at completedAt,
 cancelled_at cancelledAt,created_at createdAt,updated_at updatedAt,
 (SELECT GROUP_CONCAT(CONCAT(r.reminder_type,':',COALESCE(r.reminder_value,''),':',COALESCE(r.reminder_unit,''),':',r.status) ORDER BY r.remind_at SEPARATOR '|')
  FROM scheduled_work_reminders r WHERE r.scheduled_work_id=scheduled_work.id AND r.occurrence_id IS NULL AND r.status='PENDING') reminderSummary,
 (SELECT s.id FROM scheduled_work_snoozes s WHERE s.scheduled_work_id=scheduled_work.id AND s.occurrence_id IS NULL AND s.status='PENDING' ORDER BY s.snoozed_until DESC LIMIT 1) activeSnoozeId,
 (SELECT s.snoozed_until FROM scheduled_work_snoozes s WHERE s.scheduled_work_id=scheduled_work.id AND s.occurrence_id IS NULL AND s.status='PENDING' ORDER BY s.snoozed_until DESC LIMIT 1) activeSnoozedUntil,
 is_recurring isRecurring,recurrence_type recurrenceType,recurrence_interval recurrenceInterval,
 recurrence_unit recurrenceUnit,recurrence_config recurrenceConfig,recurrence_start_at recurrenceStartAt,
 recurrence_end_type recurrenceEndType,recurrence_end_at recurrenceEndAt,
 recurrence_max_occurrences recurrenceMaxOccurrences,recurrence_status recurrenceStatus
 ,linked_task_id linkedTaskId
 ,(SELECT t.title FROM tasks t WHERE t.id=scheduled_work.linked_task_id) linkedTaskTitle
 ,(SELECT t.status FROM tasks t WHERE t.id=scheduled_work.linked_task_id) linkedTaskStatus
 ,(SELECT ow.id FROM ongoing_work ow WHERE ow.source_scheduled_work_id=scheduled_work.id AND ow.source_occurrence_id IS NULL AND ow.deleted_at IS NULL LIMIT 1) ongoingWorkId
 ,(SELECT ow.status FROM ongoing_work ow WHERE ow.source_scheduled_work_id=scheduled_work.id AND ow.source_occurrence_id IS NULL AND ow.deleted_at IS NULL LIMIT 1) ongoingWorkStatus
 FROM scheduled_work`;
const isoFields = [
  "scheduledAt",
  "startedAt",
  "completedAt",
  "cancelledAt",
  "createdAt",
  "updatedAt",
];
const present = (row, now = new Date()) => {
  const result = { ...row, displayStatus: displayStatus(row, now) };
  result.reminders = result.reminderSummary
    ? result.reminderSummary.split("|").map((item) => {
        const [reminderType, value, unit, status] = item.split(":");
        return { reminderType, value: value ? Number(value) : null, unit: unit || null, status };
      })
    : [];
  delete result.reminderSummary;
  result.activeSnooze = result.activeSnoozeId
    ? { id: Number(result.activeSnoozeId), snoozedUntil: sqlToIso(result.activeSnoozedUntil) }
    : null;
  delete result.activeSnoozeId;
  delete result.activeSnoozedUntil;
  isoFields.forEach((key) => {
    result[key] = sqlToIso(result[key]);
  });
  result.isRecurring = Boolean(result.isRecurring);
  if (typeof result.recurrenceConfig === "string")
    result.recurrenceConfig = JSON.parse(result.recurrenceConfig || "{}");
  if (result.ongoingWorkId && result.ongoingWorkStatus !== "COMPLETED" && result.status === "UPCOMING")
    result.displayStatus = "IN_PROGRESS";
  return result;
};
const requireEmployee = (actor) => {
  if (!actor.employee_id)
    throw new ApiError(
      403,
      "An employee profile is required",
      "EMPLOYEE_REQUIRED",
    );
};
async function validateLinkedTask(connection, taskId, actor, assignedEmployeeId = actor.employee_id) {
  if (!taskId) return;
  const [[task]] = await connection.execute(
    "SELECT id FROM tasks WHERE id=? AND assignee_employee_id=? AND status NOT IN('DRAFT','SCHEDULED','ARCHIVED')",
    [taskId, assignedEmployeeId],
  );
  if (!task) throw new ApiError(404, "An accessible linked task was not found.", "LINKED_TASK_NOT_FOUND");
}
const schedule = (data, now = new Date()) => {
  const date =
    data.scheduleType === "RELATIVE"
      ? relativeDate(data.relativeValue, data.relativeUnit, now)
      : parseExact(data.scheduledAt);
  if (!date || date <= now)
    throw new ApiError(
      400,
      "The selected time must be in the future.",
      "SCHEDULE_MUST_BE_FUTURE",
    );
  return {
    scheduledAt: toSqlDateTime(date),
    relativeValue: data.scheduleType === "RELATIVE" ? data.relativeValue : null,
    relativeUnit: data.scheduleType === "RELATIVE" ? data.relativeUnit : null,
  };
};
async function owned(id, actor, connection = pool, lock = false) {
  requireEmployee(actor);
  const [[row]] = await connection.execute(
    `${select} WHERE id=? AND assigned_to=?${lock ? " FOR UPDATE" : ""}`,
    [id, actor.employee_id],
  );
  if (!row)
    throw new ApiError(
      404,
      "Scheduled work not found",
      "SCHEDULED_WORK_NOT_FOUND",
    );
  return row;
}
const audit = (connection, actor, action, id, metadata) =>
  connection.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
   VALUES(?,?,?,?,?,?,?)`,
    [
      actor.id,
      actor.employee_id,
      action,
      "SCHEDULED_WORK",
      id,
      `${action.replaceAll("_", " ").toLowerCase()}.`,
      JSON.stringify(metadata),
    ],
  );
export async function create(data, actor, { allowAssignment = false } = {}) {
  requireEmployee(actor);
  const timing = schedule(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const assignedTo = allowAssignment ? Number(data.assignedTo) : Number(actor.employee_id);
    if (!assignedTo) throw new ApiError(400, "Choose an employee to assign.");
    const [[assignee]] = await connection.execute("SELECT id FROM employees WHERE id=? AND status='ACTIVE' FOR UPDATE", [assignedTo]);
    if (!assignee) throw new ApiError(404, "An active assigned employee was not found.");
    const repeat = data.repeat || null;
    await validateLinkedTask(connection, data.linkedTaskId, actor, assignedTo);
    const recurrenceConfig = repeat
      ? JSON.stringify({ weekdays: repeat.weekdays || [], monthDay: repeat.monthDay || null })
      : null;
    const recurrenceEndAt = repeat?.endType === "ON_DATE"
      ? `${repeat.endAt} 23:59:59`
      : null;
    const [result] = await connection.execute(
      `INSERT INTO scheduled_work(title,description,created_by,assigned_to,schedule_type,scheduled_at,relative_value,relative_unit,priority,
       is_recurring,recurrence_type,recurrence_interval,recurrence_unit,recurrence_config,recurrence_reminders,recurrence_start_at,
       recurrence_end_type,recurrence_end_at,recurrence_max_occurrences,recurrence_status,linked_task_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.title,
        data.description || null,
        actor.id,
        assignedTo,
        data.scheduleType,
        timing.scheduledAt,
        timing.relativeValue,
        timing.relativeUnit,
        data.priority,
        Boolean(repeat),
        repeat?.type || null,
        repeat?.interval || null,
        repeat?.type === "DAILY" ? "DAYS" : repeat?.type === "WEEKLY" ? "WEEKS" : repeat?.type === "MONTHLY" ? "MONTHS" : repeat?.unit || null,
        recurrenceConfig,
        repeat ? JSON.stringify(data.reminders) : null,
        repeat ? timing.scheduledAt : null,
        repeat?.endType || null,
        recurrenceEndAt,
        repeat?.maxOccurrences || null,
        repeat ? "ACTIVE" : null,
        data.linkedTaskId || null,
      ],
    );
    if (repeat) {
      await generateForParent(connection, {
        id: result.insertId,
        assignedTo,
        isRecurring: true,
        recurrenceType: repeat.type,
        recurrenceInterval: repeat.interval,
        recurrenceUnit: repeat.type === "DAILY" ? "DAYS" : repeat.type === "WEEKLY" ? "WEEKS" : repeat.type === "MONTHLY" ? "MONTHS" : repeat.unit,
        recurrenceConfig,
        recurrenceReminders: JSON.stringify(data.reminders),
        recurrenceStartAt: timing.scheduledAt,
        recurrenceEndType: repeat.endType,
        recurrenceEndAt,
        recurrenceMaxOccurrences: repeat.maxOccurrences,
        recurrenceStatus: "ACTIVE",
      });
    } else {
      await createInitialReminders(connection,result.insertId,timing.scheduledAt,data.reminders);
    }
    await audit(connection, actor, repeat ? "SCHEDULED_WORK_RECURRENCE_CREATED" : "SCHEDULED_WORK_CREATED", result.insertId, {
      scheduledWorkId: result.insertId,
      title: data.title,
      scheduledAt: timing.scheduledAt,
      scheduleType: data.scheduleType,
      recurring: Boolean(repeat),
      ...(repeat && { recurrenceType: repeat.type, interval: repeat.interval, unit: repeat.unit || null }),
      linkedTaskId: data.linkedTaskId || null,
    });
    if (data.linkedTaskId)
      await audit(connection, actor, "SCHEDULED_WORK_TASK_LINKED", result.insertId, { scheduledWorkId: result.insertId, taskId: Number(data.linkedTaskId) });
    await connection.execute(
      "INSERT INTO scheduled_work_assignment_history(scheduled_work_id,new_employee_id,changed_by,scope) VALUES(?,?,?,'INITIAL')",
      [result.insertId, assignedTo, actor.id],
    );
    if (allowAssignment && assignedTo !== Number(actor.employee_id))
      await audit(connection, actor, repeat ? "SCHEDULED_WORK_RECURRENCE_ASSIGNED" : "SCHEDULED_WORK_ASSIGNED", result.insertId, { scheduledWorkId: result.insertId, createdBy: actor.id, assignedTo, scheduledAt: timing.scheduledAt });
    await connection.commit();
    const [[created]] = await pool.execute(`${select} WHERE id=?`, [result.insertId]);
    return present(created);
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
function queryFilters(filters, actor, mode) {
  const where = ["assigned_to=?", "is_recurring=FALSE"],
    params = [actor.employee_id];
  if (filters.type === "RECURRING") where.push("1=0");
  if (mode === "today") {
    where.push(
      "status='UPCOMING'",
      "scheduled_at>=CURRENT_DATE",
      "scheduled_at<DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY)",
    );
  } else if (mode === "upcoming")
    where.push("status='UPCOMING'", "scheduled_at>CURRENT_TIMESTAMP");
  else if (mode === "overdue")
    where.push("status='UPCOMING'", "scheduled_at<CURRENT_TIMESTAMP");
  if (filters.status) {
    if (filters.status === "DUE_TODAY")
      where.push(
        "status='UPCOMING'",
        "scheduled_at>=CURRENT_DATE",
        "scheduled_at<DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY)",
      );
    else if (filters.status === "OVERDUE")
      where.push("status='UPCOMING'", "scheduled_at<CURRENT_TIMESTAMP");
    else if (filters.status === "UPCOMING")
      where.push("status='UPCOMING'", "scheduled_at>CURRENT_TIMESTAMP");
    else (where.push("status=?"), params.push(filters.status));
  }
  if (filters.priority)
    (where.push("priority=?"), params.push(filters.priority));
  if (filters.search) {
    where.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.from)
    (where.push("scheduled_at>=?"), params.push(`${filters.from} 00:00:00`));
  if (filters.to)
    (where.push("scheduled_at<DATE_ADD(?,INTERVAL 1 DAY)"),
      params.push(`${filters.to} 00:00:00`));
  return { where: where.join(" AND "), params };
}
export async function list(filters, actor, mode = null) {
  requireEmployee(actor);
  const { where, params } = queryFilters(filters, actor, mode);
  const page = filters.page || 1,
    limit = filters.limit || (mode ? 100 : 20),
    offset = (page - 1) * limit,
    fetchLimit = offset + limit;
  const order =
    filters.status === "COMPLETED" ? "completed_at DESC" : "scheduled_at ASC";
  const [rows] = await pool.execute(
    `${select} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, fetchLimit, 0],
  );
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM scheduled_work WHERE ${where}`,
    params,
  );
  const occurrenceResult = filters.type === "ONE_TIME"
    ? { items: [], total: 0 }
    : await occurrenceRowsForList(actor, filters, mode, fetchLimit);
  const combined = [...rows.map((x) => present(x)), ...occurrenceResult.items].sort((a,b) => {
    const left = filters.status === "COMPLETED" ? a.completedAt : a.scheduledAt;
    const right = filters.status === "COMPLETED" ? b.completedAt : b.scheduledAt;
    return filters.status === "COMPLETED" ? new Date(right)-new Date(left) : new Date(left)-new Date(right);
  });
  return {
    items: combined.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: Number(count.total) + occurrenceResult.total,
      pages: Math.ceil((Number(count.total) + occurrenceResult.total) / limit),
    },
  };
}
export async function get(id, actor) {
  return present(await owned(id, actor));
}
export async function update(id, data, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const row = await owned(id, actor, connection, true);
    if (row.status !== "UPCOMING")
      throw new ApiError(409, "Only upcoming work can be edited");
    const fields = [],
      values = [];
    await validateLinkedTask(connection, data.linkedTaskId, actor);
    for (const [key, column] of [
      ["title", "title"],
      ["description", "description"],
      ["priority", "priority"],
      ["linkedTaskId", "linked_task_id"],
    ])
      if (key in data) {
        fields.push(`${column}=?`);
        values.push(data[key] || null);
      }
    await connection.execute(
      `UPDATE scheduled_work SET ${fields.join(",")} WHERE id=?`,
      [...values, id],
    );
    await audit(connection, actor, "SCHEDULED_WORK_UPDATED", id, {
      scheduledWorkId: Number(id),
      changedFields: Object.keys(data),
    });
    if ("linkedTaskId" in data && Number(data.linkedTaskId || 0) !== Number(row.linkedTaskId || 0))
      await audit(connection, actor, "SCHEDULED_WORK_TASK_LINKED", id, { scheduledWorkId: Number(id), taskId: data.linkedTaskId || null });
    await connection.commit();
    return present(await owned(id, actor));
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
export async function start(id, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const row = await owned(id, actor, connection, true);
    if (row.status !== "UPCOMING")
      throw new ApiError(409, `This work is already ${row.status.toLowerCase()}`);
    if (!row.startedAt) {
      await connection.execute(
        "UPDATE scheduled_work SET started_at=CURRENT_TIMESTAMP WHERE id=? AND started_at IS NULL",
        [id],
      );
      await audit(connection, actor, "SCHEDULED_WORK_STARTED", id, {
        scheduledWorkId: Number(id),
      });
    }
    await connection.commit();
    return present(await owned(id, actor));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function reschedule(id, data, actor) {
  const timing = schedule(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const row = await owned(id, actor, connection, true);
    if (row.status !== "UPCOMING")
      throw new ApiError(409, "Only upcoming work can be rescheduled");
    if (row.ongoingWorkId && row.ongoingWorkStatus !== "COMPLETED" && !data.confirmActiveExecution)
      throw new ApiError(409, "This work has already started. Confirm that rescheduling will not change its active Ongoing Work.", "ACTIVE_ONGOING_WORK");
    await connection.execute(
      `UPDATE scheduled_work SET schedule_type=?,scheduled_at=?,relative_value=?,relative_unit=? WHERE id=?`,
      [
        data.scheduleType,
        timing.scheduledAt,
        timing.relativeValue,
        timing.relativeUnit,
        id,
      ],
    );
    await recalculateReminders(connection, id, timing.scheduledAt);
    await connection.execute(
      "UPDATE scheduled_work_snoozes SET status='CANCELLED' WHERE scheduled_work_id=? AND status='PENDING'",
      [id],
    );
    await audit(connection, actor, "SCHEDULED_WORK_RESCHEDULED", id, {
      scheduledWorkId: Number(id),
      oldScheduledAt: row.scheduledAt,
      newScheduledAt: timing.scheduledAt,
    });
    await connection.commit();
    return present(await owned(id, actor));
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
async function action(id, actor, nextStatus, options = {}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const row = await owned(id, actor, connection, true);
    if (row.status !== "UPCOMING")
      throw new ApiError(
        409,
        `This work is already ${row.status.toLowerCase()}`,
      );
    if (nextStatus === "COMPLETED") {
      const [[execution]] = await connection.execute(
        "SELECT id,status FROM ongoing_work WHERE source_scheduled_work_id=? AND source_occurrence_id IS NULL AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
        [id],
      );
      if (execution && execution.status !== "COMPLETED" && !options.executionHandling)
        throw new ApiError(409, "Active ongoing work is linked to this schedule. Choose whether to complete both or the schedule only.", "ACTIVE_ONGOING_WORK");
      if (execution && execution.status !== "COMPLETED" && options.executionHandling === "COMPLETE_BOTH")
        await completeOngoingWork(connection, execution.id, { completionNote: "Completed from Scheduled Work.", completeLinkedSchedule: false }, actor);
    }
    if (nextStatus === "CANCELLED") {
      const [[execution]] = await connection.execute(
        "SELECT id,status FROM ongoing_work WHERE source_scheduled_work_id=? AND source_occurrence_id IS NULL AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
        [id],
      );
      if (execution && execution.status !== "COMPLETED" && options.executionHandling !== "SCHEDULE_ONLY")
        throw new ApiError(409, "Active ongoing work is linked to this schedule. Confirm cancellation of the schedule only.", "ACTIVE_ONGOING_WORK");
    }
    const column = nextStatus === "COMPLETED" ? "completed_at" : "cancelled_at";
    await connection.execute(
      `UPDATE scheduled_work SET status=?,${column}=CURRENT_TIMESTAMP WHERE id=?`,
      [nextStatus, id],
    );
    await connection.execute(
      "UPDATE scheduled_work_reminders SET status='CANCELLED' WHERE scheduled_work_id=? AND status='PENDING'",
      [id],
    );
    await connection.execute(
      "UPDATE scheduled_work_snoozes SET status='CANCELLED' WHERE scheduled_work_id=? AND status='PENDING'",
      [id],
    );
    await audit(connection, actor, `SCHEDULED_WORK_${nextStatus}`, id, {
      scheduledWorkId: Number(id),
      scheduledAt: row.scheduledAt,
    });
    await connection.commit();
    return present(await owned(id, actor));
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
export const complete = (id, actor, options) => action(id, actor, "COMPLETED", options);
export const cancel = (id, actor, options) => action(id, actor, "CANCELLED", options);

export async function overview(actor) {
  requireEmployee(actor);
  const todayDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [today, overdue, upcoming, recurring, completedToday] = await Promise.all([
    list({ status: "DUE_TODAY", page: 1, limit: 100 }, actor),
    list({ status: "OVERDUE", page: 1, limit: 100 }, actor),
    list({ status: "UPCOMING", page: 1, limit: 100 }, actor),
    listRecurring(actor),
    list({ status: "COMPLETED", from: todayDate, to: todayDate, page: 1, limit: 100 }, actor),
  ]);
  const now = Date.now(), dueWindow = 30 * 60000;
  const dueNow = today.items.filter((item) => {
    const scheduled = new Date(item.scheduledAt).getTime();
    return scheduled <= now && scheduled >= now - dueWindow && item.status === "UPCOMING";
  });
  return {
    counts: {
      today: today.pagination.total,
      dueNow: dueNow.length,
      overdue: overdue.pagination.total,
      upcoming: upcoming.pagination.total,
      recurring: recurring.filter((item) => item.recurrenceStatus === "ACTIVE").length,
    },
    dueNow,
    today: today.items,
    overduePreview: overdue.items.slice(0, 5),
    upcomingPreview: upcoming.items.filter((item) => new Date(item.scheduledAt) > new Date()).slice(0, 8),
    completedToday: completedToday.items,
  };
}

export async function calendar(filters, actor) {
  requireEmployee(actor);
  const params = [actor.employee_id, `${filters.from} 00:00:00`, `${filters.to} 00:00:00`];
  const priorityOne = filters.priority ? " AND w.priority=?" : "";
  if (filters.priority) params.push(filters.priority);
  const recurringParams = [actor.employee_id, `${filters.from} 00:00:00`, `${filters.to} 00:00:00`];
  if (filters.priority) recurringParams.push(filters.priority);
  const oneTime = `SELECT w.id,w.id scheduledWorkId,NULL occurrenceId,w.title,w.description,w.scheduled_at scheduledAt,w.priority,w.status,w.started_at startedAt,w.completed_at completedAt,FALSE isRecurring,NULL recurrenceType,NULL recurrenceInterval,NULL recurrenceUnit,NULL recurrenceConfig,w.linked_task_id linkedTaskId,(SELECT ow.id FROM ongoing_work ow WHERE ow.source_scheduled_work_id=w.id AND ow.source_occurrence_id IS NULL AND ow.deleted_at IS NULL LIMIT 1) ongoingWorkId,(SELECT ow.status FROM ongoing_work ow WHERE ow.source_scheduled_work_id=w.id AND ow.source_occurrence_id IS NULL AND ow.deleted_at IS NULL LIMIT 1) ongoingWorkStatus FROM scheduled_work w WHERE w.assigned_to=? AND w.is_recurring=FALSE AND w.scheduled_at>=? AND w.scheduled_at<DATE_ADD(?,INTERVAL 1 DAY)${priorityOne}`;
  const recurring = `SELECT w.id,w.id scheduledWorkId,o.id occurrenceId,w.title,w.description,o.scheduled_at scheduledAt,w.priority,o.status,o.started_at startedAt,o.completed_at completedAt,TRUE isRecurring,w.recurrence_type recurrenceType,w.recurrence_interval recurrenceInterval,w.recurrence_unit recurrenceUnit,w.recurrence_config recurrenceConfig,w.linked_task_id linkedTaskId,(SELECT ow.id FROM ongoing_work ow WHERE ow.source_occurrence_id=o.id AND ow.deleted_at IS NULL LIMIT 1) ongoingWorkId,(SELECT ow.status FROM ongoing_work ow WHERE ow.source_occurrence_id=o.id AND ow.deleted_at IS NULL LIMIT 1) ongoingWorkStatus FROM scheduled_work_occurrences o JOIN scheduled_work w ON w.id=o.scheduled_work_id WHERE o.assigned_to=? AND o.scheduled_at>=? AND o.scheduled_at<DATE_ADD(?,INTERVAL 1 DAY)${priorityOne}`;
  let sql, values;
  if (filters.type === "ONE_TIME") [sql, values] = [oneTime, params];
  else if (filters.type === "RECURRING") [sql, values] = [recurring, recurringParams];
  else [sql, values] = [`${oneTime} UNION ALL ${recurring}`, [...params, ...recurringParams]];
  const [rows] = await pool.execute(`${sql} ORDER BY scheduledAt ASC`, values);
  return rows.map((row) => {
    const value = { ...row, isRecurring: Boolean(row.isRecurring), isOccurrence: Boolean(row.occurrenceId), displayStatus: displayStatus(row) };
    for (const key of ["scheduledAt", "startedAt", "completedAt"]) value[key] = sqlToIso(value[key]);
    if (typeof value.recurrenceConfig === "string") value.recurrenceConfig = JSON.parse(value.recurrenceConfig || "{}");
    if (value.ongoingWorkId && value.ongoingWorkStatus !== "COMPLETED" && value.status === "UPCOMING") value.displayStatus = "IN_PROGRESS";
    return value;
  });
}
