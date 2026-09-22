import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { notifyByPolicy } from "./notification.service.js";

async function activeAttendance(user, executor = pool, lock = false) {
  if (!user.employee_id) throw new ApiError(403, "Employee profile required");
  const [[record]] = await executor.execute(
    `SELECT id,employee_id employeeId,work_date reportDate,clock_in_at clockInAt,status
     FROM attendance_records WHERE employee_id=? AND status IN('WORKING','ON_BREAK')
     ORDER BY id DESC LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [user.employee_id],
  );
  if (!record) throw new ApiError(409, "Clock in before creating a Day-End Report", "ATTENDANCE_REQUIRED");
  return record;
}

async function existing(attendanceId, executor = pool) {
  const [[report]] = await executor.execute(
    `SELECT id,attendance_id attendanceId,report_date reportDate,status,submitted_at submittedAt,
       other_work otherWork,blocker_type blockerType,blocker_details blockerDetails,
       tomorrow_priority tomorrowPriority
     FROM day_end_reports WHERE attendance_id=?`,
    [attendanceId],
  );
  return report || null;
}

export async function workItemsForAttendance(record, employeeId, executor = pool) {
  const [tasks] = await executor.execute(
    `SELECT t.id sourceId,'TASK' sourceType,t.title,t.status,
       FLOOR(SUM(GREATEST(0,TIMESTAMPDIFF(SECOND,
         GREATEST(tws.started_at,?),LEAST(COALESCE(tws.ended_at,CURRENT_TIMESTAMP),CURRENT_TIMESTAMP))))/60) trackedMinutes,
       NULL summaryPrefill,NULL whatsLeftPrefill
     FROM task_work_sessions tws JOIN tasks t ON t.id=tws.task_id
     WHERE tws.employee_id=? AND tws.started_at<CURRENT_TIMESTAMP
       AND COALESCE(tws.ended_at,CURRENT_TIMESTAMP)>?
     GROUP BY t.id,t.title,t.status ORDER BY MAX(tws.started_at) DESC`,
    [record.clockInAt, employeeId, record.clockInAt],
  );
  const [ongoing] = await executor.execute(
    `SELECT ow.id sourceId,'ONGOING_WORK' sourceType,ow.title,ow.status,
       FLOOR(COALESCE(SUM(GREATEST(0,TIMESTAMPDIFF(SECOND,
         GREATEST(s.started_at,?),LEAST(COALESCE(s.ended_at,CURRENT_TIMESTAMP),CURRENT_TIMESTAMP)))),0)/60) trackedMinutes,
       ow.description summaryPrefill,NULL whatsLeftPrefill
     FROM ongoing_work ow
     LEFT JOIN ongoing_work_sessions s ON s.ongoing_work_id=ow.id
       AND s.started_at<CURRENT_TIMESTAMP AND COALESCE(s.ended_at,CURRENT_TIMESTAMP)>?
     WHERE ow.employee_id=? AND ow.deleted_at IS NULL
       AND (s.id IS NOT NULL OR ow.created_at>=? OR ow.updated_at>=?)
     GROUP BY ow.id,ow.title,ow.status,ow.description
     ORDER BY MAX(COALESCE(s.started_at,ow.updated_at)) DESC`,
    [record.clockInAt, record.clockInAt, employeeId, record.clockInAt, record.clockInAt],
  );
  return [...tasks, ...ongoing].map((row) => ({ ...row, sourceId: Number(row.sourceId), trackedMinutes: Number(row.trackedMinutes || 0) }));
}

export async function today(user) {
  const record = await activeAttendance(user);
  return { attendanceId: record.id, reportDate: record.reportDate, submitted: await existing(record.id) };
}

export async function todayWorkItems(user) {
  const record = await activeAttendance(user);
  return { reportDate: record.reportDate, items: await workItemsForAttendance(record, user.employee_id) };
}

export async function submit(data, user) {
  const connection = await pool.getConnection();
  let outcome;
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [user.employee_id]);
    const record = await activeAttendance(user, connection, true);
    const prior = await existing(record.id, connection);
    if (prior) {
      await connection.commit();
      return { report: prior, alreadySubmitted: true };
    }
    const available = await workItemsForAttendance(record, user.employee_id, connection);
    const byKey = new Map(available.map((item) => [`${item.sourceType}:${item.sourceId}`, item]));
    const unique = new Set();
    const resolved = data.items.map((input) => {
      const key = `${input.sourceType}:${input.sourceId}`;
      if (unique.has(key)) throw new ApiError(400, "A work item can only be included once");
      unique.add(key);
      const source = byKey.get(key);
      if (!source) throw new ApiError(403, "Selected work is not part of this employee's current workday");
      if (source.status !== "COMPLETED" && (!input.whatsLeft || !input.estimatedRemainingMinutes))
        throw new ApiError(400, `What's left and estimated remaining time are required for “${source.title}”`);
      return { input, source };
    });
    const [created] = await connection.execute(
      `INSERT INTO day_end_reports(employee_id,attendance_id,report_date,other_work,blocker_type,
       blocker_details,tomorrow_priority,status,submitted_at)
       VALUES(?,?,?,?,?,?,?,'SUBMITTED',CURRENT_TIMESTAMP)`,
      [user.employee_id, record.id, record.reportDate, data.otherWork || null, data.blockerType, data.blockerDetails || null, data.tomorrowPriority],
    );
    for (const { input, source } of resolved)
      await connection.execute(
        `INSERT INTO day_end_report_items(report_id,source_type,task_id,ongoing_work_id,title_snapshot,
         status_snapshot,tracked_minutes_snapshot,summary,whats_left,estimated_remaining_minutes)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [created.insertId, source.sourceType, source.sourceType === "TASK" ? source.sourceId : null,
          source.sourceType === "ONGOING_WORK" ? source.sourceId : null, source.title, source.status,
          source.trackedMinutes, input.summary || null, source.status === "COMPLETED" ? null : input.whatsLeft,
          source.status === "COMPLETED" ? null : input.estimatedRemainingMinutes],
      );
    await connection.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
       VALUES(?,?,'DAY_END_REPORT_SUBMITTED','DAY_END_REPORT',?,'Day-End Report submitted.',?)`,
      [user.id, user.employee_id, created.insertId, JSON.stringify({ attendanceId: record.id, reportDate: record.reportDate, itemCount: resolved.length })],
    );
    const report = await existing(record.id, connection);
    await connection.commit();
    outcome = { report, alreadySubmitted: false };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      const record = await activeAttendance(user);
      return { report: await existing(record.id), alreadySubmitted: true };
    }
    throw error;
  } finally { connection.release(); }
  await notifyByPolicy("DAY_END_REPORT_SUBMITTED", user, {
    title: "Day-End Report submitted", message: `An employee submitted their Day-End Report for ${outcome.report.reportDate}.`,
    referenceType: "DAY_END_REPORT", referenceId: outcome.report.id, actionUrl: "/dashboard",
    eventKey: `DAY_END_REPORT_SUBMITTED:${outcome.report.id}`,
  });
  return outcome;
}

export async function assertSubmittedForAttendance(executor, attendanceId, employeeId) {
  const [[row]] = await executor.execute(
    "SELECT id FROM day_end_reports WHERE attendance_id=? AND employee_id=? AND status IN('SUBMITTED','REVIEWED') LIMIT 1",
    [attendanceId, employeeId],
  );
  if (!row) throw new ApiError(409, "Complete your Day-End Report before clocking out.", "DAY_END_REPORT_REQUIRED");
  return row.id;
}
