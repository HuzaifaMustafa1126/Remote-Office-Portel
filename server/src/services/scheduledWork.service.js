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

const select = `SELECT id,title,description,created_by createdBy,assigned_to assignedTo,
 schedule_type scheduleType,scheduled_at scheduledAt,relative_value relativeValue,
 relative_unit relativeUnit,priority,status,started_at startedAt,completed_at completedAt,
 cancelled_at cancelledAt,created_at createdAt,updated_at updatedAt,
 (SELECT GROUP_CONCAT(CONCAT(r.reminder_type,':',COALESCE(r.reminder_value,''),':',COALESCE(r.reminder_unit,''),':',r.status) ORDER BY r.remind_at SEPARATOR '|')
  FROM scheduled_work_reminders r WHERE r.scheduled_work_id=scheduled_work.id AND r.status='PENDING') reminderSummary,
 (SELECT s.id FROM scheduled_work_snoozes s WHERE s.scheduled_work_id=scheduled_work.id AND s.status='PENDING' ORDER BY s.snoozed_until DESC LIMIT 1) activeSnoozeId,
 (SELECT s.snoozed_until FROM scheduled_work_snoozes s WHERE s.scheduled_work_id=scheduled_work.id AND s.status='PENDING' ORDER BY s.snoozed_until DESC LIMIT 1) activeSnoozedUntil
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
export async function create(data, actor) {
  requireEmployee(actor);
  const timing = schedule(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO scheduled_work(title,description,created_by,assigned_to,schedule_type,scheduled_at,relative_value,relative_unit,priority)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [
        data.title,
        data.description || null,
        actor.id,
        actor.employee_id,
        data.scheduleType,
        timing.scheduledAt,
        timing.relativeValue,
        timing.relativeUnit,
        data.priority,
      ],
    );
    await createInitialReminders(
      connection,
      result.insertId,
      timing.scheduledAt,
      data.reminders,
    );
    await audit(connection, actor, "SCHEDULED_WORK_CREATED", result.insertId, {
      scheduledWorkId: result.insertId,
      title: data.title,
      scheduledAt: timing.scheduledAt,
      scheduleType: data.scheduleType,
    });
    await connection.commit();
    return present(await owned(result.insertId, actor));
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
function queryFilters(filters, actor, mode) {
  const where = ["assigned_to=?"],
    params = [actor.employee_id];
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
    offset = (page - 1) * limit;
  const order =
    filters.status === "COMPLETED" ? "completed_at DESC" : "scheduled_at ASC";
  const [rows] = await pool.execute(
    `${select} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM scheduled_work WHERE ${where}`,
    params,
  );
  return {
    items: rows.map((x) => present(x)),
    pagination: {
      page,
      limit,
      total: Number(count.total),
      pages: Math.ceil(Number(count.total) / limit),
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
    for (const [key, column] of [
      ["title", "title"],
      ["description", "description"],
      ["priority", "priority"],
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
async function action(id, actor, nextStatus) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const row = await owned(id, actor, connection, true);
    if (row.status !== "UPCOMING")
      throw new ApiError(
        409,
        `This work is already ${row.status.toLowerCase()}`,
      );
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
export const complete = (id, actor) => action(id, actor, "COMPLETED");
export const cancel = (id, actor) => action(id, actor, "CANCELLED");
