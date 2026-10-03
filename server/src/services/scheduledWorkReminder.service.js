import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { createNotification, resolveDelivery } from "./notification.service.js";
import { emitNotification } from "../sockets/notification.socket.js";
import { sqlToIso, toSqlDateTime } from "../utils/scheduledWorkTime.js";

const units = { MINUTES: 60000, HOURS: 3600000, DAYS: 86400000 };
const reminderSelect = `SELECT id,scheduled_work_id scheduledWorkId,reminder_type reminderType,
 reminder_value value,reminder_unit unit,remind_at remindAt,status,triggered_at triggeredAt,
 notification_id notificationId,created_at createdAt,updated_at updatedAt FROM scheduled_work_reminders`;
const present = (row) => ({
  ...row,
  remindAt: sqlToIso(row.remindAt),
  triggeredAt: sqlToIso(row.triggeredAt),
  createdAt: sqlToIso(row.createdAt),
  updatedAt: sqlToIso(row.updatedAt),
});

export function calculateReminder(scheduledAt, reminder, now = new Date()) {
  const scheduled = new Date(sqlToIso(scheduledAt));
  const remind = reminder.atTime
    ? scheduled
    : new Date(
        scheduled.getTime() - Number(reminder.value) * units[reminder.unit],
      );
  if (
    !reminder.atTime &&
    (!units[reminder.unit] ||
      !Number.isInteger(Number(reminder.value)) ||
      Number(reminder.value) <= 0)
  )
    throw new ApiError(
      400,
      "A positive reminder value and valid unit are required",
    );
  if (remind <= now)
    throw new ApiError(
      400,
      "This reminder would occur in the past. Choose a shorter reminder.",
      "REMINDER_IN_PAST",
    );
  return toSqlDateTime(remind);
}

export async function insertReminder(
  connection,
  workId,
  scheduledAt,
  reminder,
  now = new Date(),
  occurrenceId = null,
) {
  const atTime = Boolean(reminder.atTime);
  const remindAt = calculateReminder(scheduledAt, reminder, now);
  const [result] = await connection.execute(
    `INSERT INTO scheduled_work_reminders(scheduled_work_id,occurrence_id,reminder_type,reminder_value,reminder_unit,remind_at)
     VALUES(?,?,?,?,?,?)`,
    [
      workId,
      occurrenceId,
      atTime ? "AT_TIME" : "BEFORE",
      atTime ? null : reminder.value,
      atTime ? null : reminder.unit,
      remindAt,
    ],
  );
  return result.insertId;
}

export async function createInitialReminders(
  connection,
  workId,
  scheduledAt,
  reminders = [],
  now = new Date(),
) {
  const seen = new Set();
  for (const reminder of reminders) {
    const key = `${reminder.value}:${reminder.unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await insertReminder(connection, workId, scheduledAt, reminder, now);
  }
  await insertReminder(connection, workId, scheduledAt, { atTime: true }, now);
}

export async function recalculateReminders(
  connection,
  workId,
  scheduledAt,
  now = new Date(),
) {
  const [history] = await connection.execute(
    `SELECT DISTINCT reminder_type reminderType,reminder_value value,reminder_unit unit
     FROM scheduled_work_reminders WHERE scheduled_work_id=? AND status<>'CANCELLED'`,
    [workId],
  );
  await connection.execute(
    "UPDATE scheduled_work_reminders SET status='CANCELLED' WHERE scheduled_work_id=? AND status='PENDING'",
    [workId],
  );
  for (const reminder of history.filter((x) => x.reminderType === "BEFORE")) {
    try {
      await insertReminder(connection, workId, scheduledAt, reminder, now);
    } catch (error) {
      if (error.code !== "REMINDER_IN_PAST") throw error;
    }
  }
  await insertReminder(connection, workId, scheduledAt, { atTime: true }, now);
}

async function ownedWork(id, actor, connection = pool, lock = false) {
  if (!actor.employee_id)
    throw new ApiError(403, "An employee profile is required");
  const [[work]] = await connection.execute(
    `SELECT id,title,scheduled_at scheduledAt,status FROM scheduled_work WHERE id=? AND assigned_to=?${lock ? " FOR UPDATE" : ""}`,
    [id, actor.employee_id],
  );
  if (!work) throw new ApiError(404, "Scheduled work was not found.");
  return work;
}
const audit = (connection, actor, action, workId, data) =>
  connection.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
   VALUES(?,?,?,?,?,?,?)`,
    [
      actor.id,
      actor.employee_id,
      action,
      "SCHEDULED_WORK",
      workId,
      `${action.replaceAll("_", " ").toLowerCase()}.`,
      JSON.stringify(data),
    ],
  );
export async function list(workId, actor) {
  await ownedWork(workId, actor);
  const [rows] = await pool.execute(
    `${reminderSelect} WHERE scheduled_work_id=? ORDER BY remind_at ASC,id ASC`,
    [workId],
  );
  return rows.map(present);
}
export async function add(workId, reminder, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const work = await ownedWork(workId, actor, connection, true);
    if (work.status !== "UPCOMING")
      throw new ApiError(
        409,
        "Completed or cancelled work cannot receive new reminders.",
      );
    const [[duplicate]] = await connection.execute(
      "SELECT id FROM scheduled_work_reminders WHERE scheduled_work_id=? AND reminder_type='BEFORE' AND reminder_value=? AND reminder_unit=? AND status='PENDING' LIMIT 1",
      [workId, reminder.value, reminder.unit],
    );
    if (duplicate)
      throw new ApiError(409, "This reminder is already scheduled.");
    const id = await insertReminder(
      connection,
      workId,
      work.scheduledAt,
      reminder,
    );
    await audit(connection, actor, "SCHEDULED_WORK_REMINDER_ADDED", workId, {
      scheduledWorkId: Number(workId),
      reminderId: id,
      value: reminder.value,
      unit: reminder.unit,
    });
    await connection.commit();
    const [[row]] = await pool.execute(`${reminderSelect} WHERE id=?`, [id]);
    return present(row);
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
export async function remove(workId, reminderId, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ownedWork(workId, actor, connection, true);
    const [result] = await connection.execute(
      "UPDATE scheduled_work_reminders SET status='CANCELLED' WHERE id=? AND scheduled_work_id=? AND reminder_type='BEFORE' AND status='PENDING'",
      [reminderId, workId],
    );
    if (!result.affectedRows)
      throw new ApiError(404, "Pending reminder was not found.");
    await audit(connection, actor, "SCHEDULED_WORK_REMINDER_REMOVED", workId, {
      scheduledWorkId: Number(workId),
      reminderId: Number(reminderId),
    });
    await connection.commit();
    return { id: Number(reminderId), status: "CANCELLED" };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
const human = (row) =>
  `${row.value} ${String(row.unit).toLowerCase().replace(/s$/, "")}${Number(row.value) === 1 ? "" : "s"}`;
async function processOne(id) {
  const connection = await pool.getConnection();
  let notification = null;
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute(
      `SELECT r.id,r.reminder_type reminderType,r.reminder_value value,r.reminder_unit unit,r.status,
       w.id workId,w.title,COALESCE(o.scheduled_at,w.scheduled_at) scheduledAt,
       COALESCE(o.status,w.status) workStatus,u.id userId,r.occurrence_id occurrenceId
       FROM scheduled_work_reminders r JOIN scheduled_work w ON w.id=r.scheduled_work_id
       LEFT JOIN scheduled_work_occurrences o ON o.id=r.occurrence_id
       JOIN users u ON u.employee_id=COALESCE(o.assigned_to,w.assigned_to) AND u.status='ACTIVE'
       WHERE r.id=? FOR UPDATE`,
      [id],
    );
    if (!row || row.status !== "PENDING") {
      await connection.rollback();
      return false;
    }
    if (row.workStatus !== "UPCOMING") {
      await connection.execute(
        "UPDATE scheduled_work_reminders SET status='CANCELLED' WHERE id=?",
        [id],
      );
      await connection.commit();
      return true;
    }
    const type =
      row.reminderType === "AT_TIME"
        ? "SCHEDULED_WORK_DUE"
        : "SCHEDULED_WORK_REMINDER";
    const missed =
      row.reminderType === "AT_TIME" &&
      new Date(sqlToIso(row.scheduledAt)).getTime() < Date.now() - 60000;
    const [[policy]] = await connection.execute(
      "SELECT enabled,audience_type audienceType,in_app_enabled inApp,desktop_enabled desktop,sound_enabled sound FROM notification_policies WHERE event_type=?",
      [type],
    );
    if (!policy) throw new Error(`Notification policy ${type} is unavailable`);
    const delivery =
      policy?.enabled && policy.audienceType !== "NOBODY"
        ? await resolveDelivery(row.userId, type, {
            inApp: Boolean(policy.inApp),
            desktop: Boolean(policy.desktop),
            sound: Boolean(policy.sound),
          })
        : null;
    if (delivery && Object.values(delivery).some(Boolean)) {
      notification = await createNotification(
        {
          userId: row.userId,
          type,
          category: "SCHEDULED_WORK",
          title:
            row.reminderType === "AT_TIME"
              ? missed
                ? "Scheduled Work Missed"
                : "Scheduled Work Due Now"
              : "Scheduled Work Reminder",
          message:
            row.reminderType === "AT_TIME"
              ? missed
                ? `${row.title} was scheduled earlier and is now overdue.${row.occurrenceId ? " This recurring occurrence remains open." : ""}`
                : `${row.title} is scheduled for now.${row.occurrenceId ? " This recurring work is due now." : ""}`
              : `${row.title} is scheduled in ${human(row)}.${row.occurrenceId ? " Recurring work." : ""}`,
          referenceType: row.occurrenceId
            ? "SCHEDULED_WORK_OCCURRENCE"
            : "SCHEDULED_WORK",
          referenceId: row.occurrenceId || row.workId,
          actionUrl: `/scheduled-work?work=${row.workId}${row.occurrenceId ? `&occurrence=${row.occurrenceId}` : ""}`,
          priority: row.reminderType === "AT_TIME" ? "IMPORTANT" : "NORMAL",
          eventKey: `scheduled-work-reminder:${row.id}`,
          delivery,
        },
        connection,
      );
      if (!notification) {
        const [[existing]] = await connection.execute(
          "SELECT id FROM notifications WHERE event_key=? AND user_id=?",
          [`scheduled-work-reminder:${row.id}`, row.userId],
        );
        notification = existing || null;
      }
    }
    await connection.execute(
      "UPDATE scheduled_work_reminders SET status='TRIGGERED',triggered_at=CURRENT_TIMESTAMP,notification_id=? WHERE id=? AND status='PENDING'",
      [notification?.id || null, row.id],
    );
    await connection.commit();
    if (notification?.userId) emitNotification(notification);
    return true;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
export async function processDueReminders({ batchSize = 100 } = {}) {
  const [rows] = await pool.execute(
    "SELECT id FROM scheduled_work_reminders WHERE status='PENDING' AND remind_at<=CURRENT_TIMESTAMP ORDER BY remind_at ASC,id ASC LIMIT ?",
    [batchSize],
  );
  let processed = 0,
    failed = 0;
  for (const { id } of rows) {
    try {
      if (await processOne(id)) processed++;
    } catch (error) {
      failed++;
      console.error("Scheduled work reminder failed", {
        reminderId: id,
        message: error.message,
      });
    }
  }
  return {
    found: rows.length,
    processed,
    failed,
    hasMore: rows.length === batchSize,
  };
}
export async function processReminderQueue({
  batchSize = 100,
  maxBatches = 10,
} = {}) {
  const total = {
    found: 0,
    processed: 0,
    failed: 0,
    batches: 0,
    hasMore: false,
  };
  do {
    const result = await processDueReminders({ batchSize });
    total.found += result.found;
    total.processed += result.processed;
    total.failed += result.failed;
    total.batches += 1;
    total.hasMore = result.hasMore;
  } while (total.hasMore && total.batches < maxBatches);
  return total;
}
