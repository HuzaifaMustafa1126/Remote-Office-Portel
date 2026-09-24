import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { notifyByPolicy } from "./notification.service.js";

const systemActor = { id: 0, employee_id: null };
const settingsSelect = `SELECT reminder_enabled reminderEnabled,reminder_before_minutes reminderBeforeMinutes,
 overdue_grace_minutes overdueGraceMinutes,overdue_notifications_enabled overdueNotificationsEnabled,
 review_reminders_enabled reviewRemindersEnabled,review_reminder_after_minutes reviewReminderAfterMinutes,
 manual_reminder_cooldown_minutes manualReminderCooldownMinutes,updated_at updatedAt FROM day_end_report_settings WHERE id=1`;

export async function getSettings() {
  const [[row]] = await pool.execute(settingsSelect);
  return {
    ...row,
    reminderEnabled: Boolean(row.reminderEnabled),
    overdueNotificationsEnabled: Boolean(row.overdueNotificationsEnabled),
    reviewRemindersEnabled: Boolean(row.reviewRemindersEnabled),
    reminderBeforeMinutes: Number(row.reminderBeforeMinutes),
    overdueGraceMinutes: Number(row.overdueGraceMinutes),
    reviewReminderAfterMinutes: Number(row.reviewReminderAfterMinutes),
    manualReminderCooldownMinutes: Number(row.manualReminderCooldownMinutes),
  };
}

export async function updateSettings(data, user) {
  await pool.execute(
    `UPDATE day_end_report_settings SET reminder_enabled=?,reminder_before_minutes=?,overdue_grace_minutes=?,
     overdue_notifications_enabled=?,review_reminders_enabled=?,review_reminder_after_minutes=?,
     manual_reminder_cooldown_minutes=?,updated_by=? WHERE id=1`,
    [data.reminderEnabled, data.reminderBeforeMinutes, data.overdueGraceMinutes, data.overdueNotificationsEnabled,
      data.reviewRemindersEnabled, data.reviewReminderAfterMinutes, data.manualReminderCooldownMinutes, user.id],
  );
  await pool.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
     VALUES(?,?,'DAY_END_REPORT_SETTINGS_UPDATED','DAY_END_REPORT_SETTINGS',1,'Day-End Report reminder settings updated.',?)`,
    [user.id, user.employee_id, JSON.stringify(data)],
  );
  return getSettings();
}

async function managementUserIds() {
  const [rows] = await pool.execute(
    `SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id
     WHERE u.status='ACTIVE' AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')`,
  );
  return rows.map((row) => row.id);
}

async function claim({ employeeId = null, attendanceId = null, reportId = null, eventType, eventKey, sentBy = null }) {
  const [result] = await pool.execute(
    `INSERT IGNORE INTO day_end_report_followups(employee_id,attendance_id,report_id,event_type,event_key,sent_by)
     VALUES(?,?,?,?,?,?)`,
    [employeeId, attendanceId, reportId, eventType, eventKey, sentBy],
  );
  return Boolean(result.affectedRows);
}

async function auditOverdue(row) {
  await pool.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
     VALUES(NULL,?,'DAY_END_REPORT_OVERDUE_DETECTED','ATTENDANCE',?,'Day-End Report became overdue.',?)`,
    [row.employeeId, row.attendanceId, JSON.stringify({ workDate: row.workDate, scheduledClockOut: row.scheduledClockOut })],
  );
}

export async function processDayEndReportFollowups() {
  const settings = await getSettings();
  const [active] = await pool.execute(
    `SELECT ar.id attendanceId,ar.employee_id employeeId,ar.work_date workDate,ar.scheduled_clock_out scheduledClockOut,
      CONCAT(e.first_name,' ',e.last_name) employeeName,u.id userId,
      TIMESTAMPDIFF(MINUTE,CURRENT_TIMESTAMP,ar.scheduled_clock_out) minutesUntilEnd,
      TIMESTAMPDIFF(MINUTE,ar.scheduled_clock_out,CURRENT_TIMESTAMP) minutesPastEnd,
      CURRENT_TIMESTAMP<=ar.scheduled_clock_out beforeShiftEnd
     FROM attendance_records ar JOIN employees e ON e.id=ar.employee_id
     JOIN users u ON u.employee_id=e.id AND u.status='ACTIVE'
     LEFT JOIN day_end_reports der ON der.attendance_id=ar.id
     WHERE ar.status IN('WORKING','ON_BREAK') AND ar.scheduled_clock_out IS NOT NULL AND der.id IS NULL`,
  );
  const managers = await managementUserIds();
  for (const row of active) {
    if (settings.reminderEnabled && row.beforeShiftEnd && row.minutesUntilEnd <= settings.reminderBeforeMinutes) {
      const eventKey = `DAY_END_REPORT_DUE_SOON:${row.attendanceId}`;
      if (await claim({ employeeId: row.employeeId, attendanceId: row.attendanceId, eventType: "DAY_END_REPORT_DUE_SOON", eventKey }))
        await notifyByPolicy("DAY_END_REPORT_DUE_SOON", systemActor, {
          title: "Day-End Report Due Soon", message: `Your shift ends in approximately ${Math.max(0, row.minutesUntilEnd)} minutes. Complete your Day-End Report before clocking out.`,
          referenceType: "ATTENDANCE", referenceId: row.attendanceId, actionUrl: "/?dayEndReport=open",
          recipientUserIds: [row.userId], eventKey,
        });
    }
    if (row.minutesPastEnd >= settings.overdueGraceMinutes) {
      const eventKey = `DAY_END_REPORT_OVERDUE:${row.attendanceId}`;
      if (await claim({ employeeId: row.employeeId, attendanceId: row.attendanceId, eventType: "DAY_END_REPORT_OVERDUE", eventKey })) {
        await auditOverdue(row);
        if (settings.overdueNotificationsEnabled) {
          await notifyByPolicy("DAY_END_REPORT_OVERDUE", systemActor, {
            title: "Day-End Report Overdue", message: "Your workday has ended and your Day-End Report is still incomplete. Complete the report to Clock Out.",
            referenceType: "ATTENDANCE", referenceId: row.attendanceId, actionUrl: "/?dayEndReport=open",
            recipientUserIds: [row.userId], eventKey: `${eventKey}:EMPLOYEE`,
          });
          await notifyByPolicy("DAY_END_REPORT_OVERDUE", systemActor, {
            title: "Day-End Report Overdue", message: `${row.employeeName} has not completed the Day-End Report for ${row.workDate} and is still clocked in.`,
            referenceType: "ATTENDANCE", referenceId: row.attendanceId, actionUrl: `/day-end-reports?date=${row.workDate}&attention=1`,
            recipientUserIds: managers, eventKey: `${eventKey}:MANAGEMENT`,
          });
        }
      }
    }
  }
  if (settings.reviewRemindersEnabled) {
    const [pending] = await pool.execute(
      `SELECT id,employee_id employeeId,report_date reportDate FROM day_end_reports
       WHERE status='SUBMITTED' AND submitted_at<=DATE_SUB(CURRENT_TIMESTAMP,INTERVAL ? MINUTE)`,
      [settings.reviewReminderAfterMinutes],
    );
    const newlyDue = [];
    for (const row of pending)
      if (await claim({ employeeId: row.employeeId, reportId: row.id, eventType: "DAY_END_REPORT_AWAITING_REVIEW", eventKey: `DAY_END_REPORT_AWAITING_REVIEW:${row.id}` })) newlyDue.push(row);
    if (newlyDue.length)
      await notifyByPolicy("DAY_END_REPORT_AWAITING_REVIEW", systemActor, {
        title: "Day-End Reports Awaiting Review", message: `${newlyDue.length} Day-End Report${newlyDue.length === 1 ? " is" : "s are"} waiting for review.`,
        referenceType: "DAY_END_REPORT", actionUrl: "/day-end-reports?attention=1", recipientUserIds: managers,
        eventKey: `DAY_END_REPORT_AWAITING_REVIEW_BATCH:${newlyDue.map((x) => x.id).join("-")}`,
      });
  }
}

export async function sendManualReminder(attendanceId, user) {
  const settings = await getSettings();
  const [[row]] = await pool.execute(
    `SELECT ar.id attendanceId,ar.employee_id employeeId,ar.work_date workDate,ar.status,
      CONCAT(e.first_name,' ',e.last_name) employeeName,u.id userId
     FROM attendance_records ar JOIN employees e ON e.id=ar.employee_id JOIN users u ON u.employee_id=e.id AND u.status='ACTIVE'
     LEFT JOIN day_end_reports der ON der.attendance_id=ar.id WHERE ar.id=? AND ar.status IN('WORKING','ON_BREAK') AND der.id IS NULL`, [attendanceId]);
  if (!row) throw new ApiError(409, "This employee has already submitted the report or attendance is unavailable");
  const [[recent]] = await pool.execute(
    `SELECT sent_at sentAt,TIMESTAMPDIFF(SECOND,sent_at,CURRENT_TIMESTAMP) elapsedSeconds FROM day_end_report_followups
     WHERE attendance_id=? AND event_type='DAY_END_REPORT_MANUAL_REMINDER' ORDER BY sent_at DESC LIMIT 1`, [attendanceId]);
  const cooldownSeconds = settings.manualReminderCooldownMinutes * 60;
  if (recent && recent.elapsedSeconds < cooldownSeconds)
    throw new ApiError(429, `A reminder was sent recently. Try again in ${Math.ceil((cooldownSeconds - recent.elapsedSeconds) / 60)} minutes.`, "DAY_END_REPORT_REMINDER_COOLDOWN");
  const eventKey = `DAY_END_REPORT_MANUAL_REMINDER:${attendanceId}:${Date.now()}`;
  await claim({ employeeId: row.employeeId, attendanceId, eventType: "DAY_END_REPORT_MANUAL_REMINDER", eventKey, sentBy: user.id });
  const [[actor]] = await pool.execute("SELECT COALESCE(CONCAT(e.first_name,' ',e.last_name),u.email) name FROM users u LEFT JOIN employees e ON e.id=u.employee_id WHERE u.id=?", [user.id]);
  await notifyByPolicy("DAY_END_REPORT_MANUAL_REMINDER", user, {
    title: "Day-End Report Reminder", message: `${actor?.name || "Management"} requested that you complete your Day-End Report for ${row.workDate}.`,
    referenceType: "ATTENDANCE", referenceId: attendanceId, actionUrl: "/?dayEndReport=open",
    recipientUserIds: [row.userId], eventKey,
  });
  await pool.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
     VALUES(?,?,'DAY_END_REPORT_REMINDER_SENT','ATTENDANCE',?,'Manual Day-End Report reminder sent.',?)`,
    [user.id, user.employee_id, attendanceId, JSON.stringify({ recipientEmployeeId: row.employeeId, workDate: row.workDate })]);
  return { sent: true, sentAt: new Date(), cooldownMinutes: settings.manualReminderCooldownMinutes };
}
