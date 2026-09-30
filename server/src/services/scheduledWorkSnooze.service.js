import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { createNotification, resolveDelivery } from "./notification.service.js";
import { emitNotification } from "../sockets/notification.socket.js";
import { sqlToIso, toSqlDateTime } from "../utils/scheduledWorkTime.js";

const multipliers = { MINUTES: 60000, HOURS: 3600000, DAYS: 86400000 };
const select = `SELECT id,scheduled_work_id scheduledWorkId,reminder_id reminderId,employee_id employeeId,
 snooze_value value,snooze_unit unit,snoozed_at snoozedAt,snoozed_until snoozedUntil,status,
 triggered_at triggeredAt,notification_id notificationId,created_at createdAt FROM scheduled_work_snoozes`;
const present = (row) => {
  const result = { ...row };
  for (const key of ["snoozedAt", "snoozedUntil", "triggeredAt", "createdAt"])
    result[key] = sqlToIso(result[key]);
  return result;
};
const pakistanDateParts = (date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((x) => x.type !== "literal")
      .map((x) => [x.type, x.value]),
  );
export function calculateSnooze(data, now = new Date()) {
  if (data.unit === "TOMORROW") {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time || ""))
      throw new ApiError(400, "Choose a valid time for tomorrow.");
    const p = pakistanDateParts(new Date(now.getTime() + 86400000));
    const date = new Date(
      `${p.year}-${p.month}-${p.day}T${data.time}:00+05:00`,
    );
    if (date <= now)
      throw new ApiError(
        400,
        "Tomorrow's reminder time must be in the future.",
      );
    return date;
  }
  const value = Number(data.value),
    multiplier = multipliers[data.unit];
  if (!Number.isInteger(value) || value <= 0 || !multiplier)
    throw new ApiError(400, "Invalid reminder duration.");
  if (value * multiplier > 365 * 86400000)
    throw new ApiError(400, "Reminder duration cannot exceed one year.");
  return new Date(now.getTime() + value * multiplier);
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
export async function snooze(workId, data, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const work = await ownedWork(workId, actor, connection, true);
    if (work.status !== "UPCOMING")
      throw new ApiError(
        409,
        `This scheduled work was ${work.status.toLowerCase()}.`,
      );
    const until = calculateSnooze(data);
    await connection.execute(
      "UPDATE scheduled_work_snoozes SET status='CANCELLED' WHERE scheduled_work_id=? AND status='PENDING'",
      [workId],
    );
    const [result] = await connection.execute(
      `INSERT INTO scheduled_work_snoozes(scheduled_work_id,reminder_id,employee_id,snooze_value,snooze_unit,snoozed_until) VALUES(?,?,?,?,?,?)`,
      [
        workId,
        data.reminderId || null,
        actor.employee_id,
        data.unit === "TOMORROW" ? null : data.value,
        data.unit,
        toSqlDateTime(until),
      ],
    );
    await connection.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values) VALUES(?,?,?,'SCHEDULED_WORK',?,?,?)`,
      [
        actor.id,
        actor.employee_id,
        "SCHEDULED_WORK_SNOOZED",
        workId,
        "Scheduled work reminder postponed.",
        JSON.stringify({
          scheduledWorkId: Number(workId),
          snoozeId: result.insertId,
          snoozeValue: data.value || null,
          snoozeUnit: data.unit,
          snoozedUntil: toSqlDateTime(until),
        }),
      ],
    );
    await connection.commit();
    const [[row]] = await pool.execute(`${select} WHERE id=?`, [
      result.insertId,
    ]);
    return present(row);
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
export async function list(workId, actor) {
  await ownedWork(workId, actor);
  const [rows] = await pool.execute(
    `${select} WHERE scheduled_work_id=? ORDER BY created_at DESC,id DESC`,
    [workId],
  );
  return rows.map(present);
}

async function processOne(id) {
  const connection = await pool.getConnection();
  let notification = null;
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute(
      `SELECT s.id,s.status,w.id workId,w.title,w.scheduled_at scheduledAt,w.status workStatus,u.id userId FROM scheduled_work_snoozes s JOIN scheduled_work w ON w.id=s.scheduled_work_id JOIN users u ON u.employee_id=w.assigned_to AND u.status='ACTIVE' WHERE s.id=? FOR UPDATE`,
      [id],
    );
    if (!row || row.status !== "PENDING") {
      await connection.rollback();
      return false;
    }
    if (row.workStatus !== "UPCOMING") {
      await connection.execute(
        "UPDATE scheduled_work_snoozes SET status='CANCELLED' WHERE id=?",
        [id],
      );
      await connection.commit();
      return true;
    }
    const [[policy]] = await connection.execute(
      "SELECT enabled,audience_type audienceType,in_app_enabled inApp,desktop_enabled desktop,sound_enabled sound FROM notification_policies WHERE event_type='SCHEDULED_WORK_REMINDER'",
    );
    if (!policy)
      throw new Error("Scheduled work notification policy is unavailable");
    const delivery =
      policy.enabled && policy.audienceType !== "NOBODY"
        ? await resolveDelivery(row.userId, "SCHEDULED_WORK_REMINDER", {
            inApp: Boolean(policy.inApp),
            desktop: Boolean(policy.desktop),
            sound: Boolean(policy.sound),
          })
        : null;
    if (delivery && Object.values(delivery).some(Boolean)) {
      notification = await createNotification(
        {
          userId: row.userId,
          type: "SCHEDULED_WORK_REMINDER",
          category: "SCHEDULED_WORK",
          title: "Scheduled Work Reminder",
          message: `${row.title}: you asked to be reminded again now.`,
          referenceType: "SCHEDULED_WORK",
          referenceId: row.workId,
          actionUrl: `/scheduled-work?work=${row.workId}`,
          priority: "IMPORTANT",
          eventKey: `scheduled-work-snooze:${row.id}`,
          delivery,
        },
        connection,
      );
      if (!notification) {
        const [[existing]] = await connection.execute(
          "SELECT id FROM notifications WHERE event_key=? AND user_id=?",
          [`scheduled-work-snooze:${row.id}`, row.userId],
        );
        notification = existing || null;
      }
    }
    await connection.execute(
      "UPDATE scheduled_work_snoozes SET status='TRIGGERED',triggered_at=CURRENT_TIMESTAMP,notification_id=? WHERE id=? AND status='PENDING'",
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
export async function processSnoozeQueue({
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
    const [rows] = await pool.execute(
      "SELECT id FROM scheduled_work_snoozes WHERE status='PENDING' AND snoozed_until<=CURRENT_TIMESTAMP ORDER BY snoozed_until,id LIMIT ?",
      [batchSize],
    );
    total.found += rows.length;
    for (const { id } of rows) {
      try {
        if (await processOne(id)) total.processed++;
      } catch (error) {
        total.failed++;
        console.error("Scheduled work snooze failed", {
          snoozeId: id,
          message: error.message,
        });
      }
    }
    total.batches++;
    total.hasMore = rows.length === batchSize;
  } while (total.hasMore && total.batches < maxBatches);
  return total;
}
