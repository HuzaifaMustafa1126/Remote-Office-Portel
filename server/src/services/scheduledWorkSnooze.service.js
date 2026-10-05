import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { createNotification, resolveDelivery } from "./notification.service.js";
import { emitNotification } from "../sockets/notification.socket.js";
import { sqlToIso, toSqlDateTime } from "../utils/scheduledWorkTime.js";
import { randomUUID } from "node:crypto";

const multipliers = { MINUTES: 60000, HOURS: 3600000, DAYS: 86400000 };
const MAX_ATTEMPTS = 5;
const retryDelayMinutes = (attempt) => Math.min(60, 2 ** Math.max(0, attempt - 1));
const safeError = (error) => String(error?.message || "Temporary notification error").slice(0, 500);
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
    if (data.reminderId) {
      const [[reminder]] = await connection.execute(
        "SELECT id FROM scheduled_work_reminders WHERE id=? AND scheduled_work_id=? AND occurrence_id IS NULL",
        [data.reminderId, workId],
      );
      if (!reminder) throw new ApiError(404, "The selected reminder does not belong to this scheduled work.");
    }
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
export async function snoozeOccurrence(workId, occurrenceId, data, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ownedWork(workId, actor, connection, true);
    const [[occurrence]] = await connection.execute(
      "SELECT id,status FROM scheduled_work_occurrences WHERE id=? AND scheduled_work_id=? AND assigned_to=? FOR UPDATE",
      [occurrenceId, workId, actor.employee_id],
    );
    if (!occurrence) throw new ApiError(404, "Scheduled work occurrence was not found.");
    if (occurrence.status !== "UPCOMING")
      throw new ApiError(409, `This occurrence is already ${occurrence.status.toLowerCase()}.`);
    const until = calculateSnooze(data);
    if (data.reminderId) {
      const [[reminder]] = await connection.execute(
        "SELECT id FROM scheduled_work_reminders WHERE id=? AND scheduled_work_id=? AND occurrence_id=?",
        [data.reminderId, workId, occurrenceId],
      );
      if (!reminder) throw new ApiError(404, "The selected reminder does not belong to this occurrence.");
    }
    await connection.execute(
      "UPDATE scheduled_work_snoozes SET status='CANCELLED' WHERE occurrence_id=? AND status='PENDING'",
      [occurrenceId],
    );
    const [result] = await connection.execute(
      `INSERT INTO scheduled_work_snoozes(scheduled_work_id,occurrence_id,reminder_id,employee_id,snooze_value,snooze_unit,snoozed_until)
       VALUES(?,?,?,?,?,?,?)`,
      [workId, occurrenceId, data.reminderId || null, actor.employee_id, data.unit === "TOMORROW" ? null : data.value, data.unit, toSqlDateTime(until)],
    );
    await connection.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
       VALUES(?,?,?,'SCHEDULED_WORK_OCCURRENCE',?,?,?)`,
      [actor.id,actor.employee_id,"SCHEDULED_WORK_SNOOZED",occurrenceId,"Recurring occurrence reminder postponed.",JSON.stringify({scheduledWorkId:Number(workId),occurrenceId:Number(occurrenceId),snoozeId:result.insertId,snoozeValue:data.value||null,snoozeUnit:data.unit,snoozedUntil:toSqlDateTime(until)})],
    );
    await connection.commit();
    const [[row]] = await pool.execute(`${select} WHERE id=?`, [result.insertId]);
    return present(row);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function processOne(id, claimToken) {
  const connection = await pool.getConnection();
  let notification = null;
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute(
      `SELECT s.id,s.status,w.id workId,w.title,COALESCE(o.scheduled_at,w.scheduled_at) scheduledAt,
       COALESCE(o.status,w.status) workStatus,u.id userId,s.occurrence_id occurrenceId,
       s.next_attempt_at nextAttemptAt
       FROM scheduled_work_snoozes s JOIN scheduled_work w ON w.id=s.scheduled_work_id
       LEFT JOIN scheduled_work_occurrences o ON o.id=s.occurrence_id
       JOIN users u ON u.employee_id=COALESCE(o.assigned_to,w.assigned_to) AND u.status='ACTIVE'
       WHERE s.id=? AND s.claim_token=? FOR UPDATE`,
      [id, claimToken],
    );
    if (!row || row.status !== "PROCESSING") {
      await connection.rollback();
      return false;
    }
    if (row.workStatus !== "UPCOMING") {
      await connection.execute(
        "UPDATE scheduled_work_snoozes SET status='CANCELLED',claim_token=NULL,claimed_at=NULL WHERE id=?",
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
          referenceType: row.occurrenceId ? "SCHEDULED_WORK_OCCURRENCE" : "SCHEDULED_WORK",
          referenceId: row.occurrenceId || row.workId,
          actionUrl: `/scheduled-work?work=${row.workId}${row.occurrenceId ? `&occurrence=${row.occurrenceId}` : ""}`,
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
      "UPDATE scheduled_work_snoozes SET status='TRIGGERED',triggered_at=CURRENT_TIMESTAMP,notification_id=?,claim_token=NULL,claimed_at=NULL WHERE id=? AND status='PROCESSING' AND claim_token=?",
      [notification?.id || null, row.id, claimToken],
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
async function recordFailure(id, claimToken, error) {
  const message = safeError(error);
  await pool.execute(
    `UPDATE scheduled_work_snoozes
     SET attempts_count=attempts_count+1,last_error=?,
       status=IF(attempts_count+1>=?,'FAILED','PENDING'),
       failed_at=IF(attempts_count+1>=?,CURRENT_TIMESTAMP,NULL),
       next_attempt_at=NULL,claim_token=NULL,claimed_at=NULL
     WHERE id=? AND status='PROCESSING' AND claim_token=?`,
    [message, MAX_ATTEMPTS, MAX_ATTEMPTS, id, claimToken],
  );
  const [[state]] = await pool.execute("SELECT attempts_count attemptsCount,status FROM scheduled_work_snoozes WHERE id=?", [id]);
  if (state?.status === "PENDING") {
    await pool.execute("UPDATE scheduled_work_snoozes SET next_attempt_at=DATE_ADD(CURRENT_TIMESTAMP,INTERVAL ? MINUTE) WHERE id=? AND status='PENDING'", [retryDelayMinutes(state.attemptsCount), id]);
  }
  return state;
}
async function claimDue(batchSize) {
  const connection = await pool.getConnection();
  const token = randomUUID();
  try {
    await connection.beginTransaction();
    await connection.execute("UPDATE scheduled_work_snoozes SET status='PENDING',claim_token=NULL,claimed_at=NULL WHERE status='PROCESSING' AND claimed_at<DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 10 MINUTE)");
    const [rows] = await connection.execute(
      "SELECT id FROM scheduled_work_snoozes WHERE status='PENDING' AND snoozed_until<=CURRENT_TIMESTAMP AND (next_attempt_at IS NULL OR next_attempt_at<=CURRENT_TIMESTAMP) ORDER BY snoozed_until,id LIMIT ? FOR UPDATE SKIP LOCKED",
      [batchSize],
    );
    if (rows.length) {
      const marks = rows.map(() => "?").join(",");
      await connection.execute(`UPDATE scheduled_work_snoozes SET status='PROCESSING',claim_token=?,claimed_at=CURRENT_TIMESTAMP WHERE id IN(${marks}) AND status='PENDING'`, [token, ...rows.map((row) => row.id)]);
    }
    await connection.commit();
    return { token, rows };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
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
    const { token, rows } = await claimDue(batchSize);
    total.found += rows.length;
    for (const { id } of rows) {
      try {
        if (await processOne(id, token)) total.processed++;
      } catch (error) {
        total.failed++;
        const state = await recordFailure(id, token, error).catch(() => null);
        console.error("Scheduled work snooze failed", {
          snoozeId: id,
          attempt: state?.attemptsCount,
          terminal: state?.status === "FAILED",
          message: safeError(error),
        });
      }
    }
    total.batches++;
    total.hasMore = rows.length === batchSize;
  } while (total.hasMore && total.batches < maxBatches);
  return total;
}
