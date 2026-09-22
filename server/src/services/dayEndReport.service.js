import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { notifyByPolicy } from "./notification.service.js";
import { getCompanyDayStatus } from "../utils/workingDay.js";

async function activeAttendance(user, executor = pool, lock = false) {
  if (!user.employee_id) throw new ApiError(403, "Employee profile required");
  const [[record]] = await executor.execute(
    `SELECT id,employee_id employeeId,work_date reportDate,clock_in_at clockInAt,status
     FROM attendance_records WHERE employee_id=? AND status IN('WORKING','ON_BREAK')
     ORDER BY id DESC LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [user.employee_id],
  );
  if (!record)
    throw new ApiError(
      409,
      "Clock in before creating a Day-End Report",
      "ATTENDANCE_REQUIRED",
    );
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

async function isManagement(user, executor = pool) {
  const [[row]] = await executor.execute(
    "SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) yes",
    [user.id],
  );
  return Boolean(row.yes);
}

async function reportDetails(id, executor = pool) {
  const [[report]] = await executor.execute(
    `SELECT r.id,r.employee_id employeeId,r.attendance_id attendanceId,r.report_date reportDate,
      r.other_work otherWork,r.blocker_type blockerType,r.blocker_details blockerDetails,
      r.tomorrow_priority tomorrowPriority,r.status,r.submitted_at submittedAt,r.updated_at updatedAt,
      r.reviewed_at reviewedAt,r.reviewed_by reviewedBy,
      CONCAT(e.first_name,' ',e.last_name) employeeName,
      CONCAT(re.first_name,' ',re.last_name) reviewerName
     FROM day_end_reports r JOIN employees e ON e.id=r.employee_id
     LEFT JOIN users ru ON ru.id=r.reviewed_by LEFT JOIN employees re ON re.id=ru.employee_id
     WHERE r.id=?`,
    [id],
  );
  if (!report) throw new ApiError(404, "Day-End Report not found");
  const [items] = await executor.execute(
    `SELECT id,source_type sourceType,COALESCE(task_id,ongoing_work_id) sourceId,
      title_snapshot title,status_snapshot status,tracked_minutes_snapshot trackedMinutes,
      summary,whats_left whatsLeft,estimated_remaining_minutes estimatedRemainingMinutes
     FROM day_end_report_items WHERE report_id=? ORDER BY id`,
    [id],
  );
  return { ...report, items };
}

export async function workItemsForAttendance(
  record,
  employeeId,
  executor = pool,
) {
  const [[clock]] = await executor.execute("SELECT CURRENT_TIMESTAMP boundary");
  const boundary = record.clockOutAt || clock.boundary;
  const [tasks] = await executor.execute(
    `SELECT t.id sourceId,'TASK' sourceType,t.title,t.status,
       FLOOR(SUM(GREATEST(0,TIMESTAMPDIFF(SECOND,
         GREATEST(tws.started_at,?),LEAST(COALESCE(tws.ended_at,?),?))))/60) trackedMinutes,
       NULL summaryPrefill,NULL whatsLeftPrefill
     FROM task_work_sessions tws JOIN tasks t ON t.id=tws.task_id
     WHERE tws.employee_id=? AND tws.started_at<?
       AND COALESCE(tws.ended_at,CURRENT_TIMESTAMP)>?
     GROUP BY t.id,t.title,t.status ORDER BY MAX(tws.started_at) DESC`,
    [
      record.clockInAt,
      boundary,
      boundary,
      employeeId,
      boundary,
      record.clockInAt,
    ],
  );
  const [ongoing] = await executor.execute(
    `SELECT ow.id sourceId,'ONGOING_WORK' sourceType,ow.title,ow.status,
       FLOOR(COALESCE(SUM(GREATEST(0,TIMESTAMPDIFF(SECOND,
         GREATEST(s.started_at,?),LEAST(COALESCE(s.ended_at,?),?)))),0)/60) trackedMinutes,
       ow.description summaryPrefill,NULL whatsLeftPrefill
     FROM ongoing_work ow
     LEFT JOIN ongoing_work_sessions s ON s.ongoing_work_id=ow.id
       AND s.started_at<? AND COALESCE(s.ended_at,?)>?
     WHERE ow.employee_id=? AND ow.deleted_at IS NULL
       AND (s.id IS NOT NULL OR ow.created_at>=? OR ow.updated_at>=?)
     GROUP BY ow.id,ow.title,ow.status,ow.description
     ORDER BY MAX(COALESCE(s.started_at,ow.updated_at)) DESC`,
    [
      record.clockInAt,
      boundary,
      boundary,
      boundary,
      boundary,
      record.clockInAt,
      employeeId,
      record.clockInAt,
      record.clockInAt,
    ],
  );
  return [...tasks, ...ongoing].map((row) => ({
    ...row,
    sourceId: Number(row.sourceId),
    trackedMinutes: Number(row.trackedMinutes || 0),
  }));
}

export async function today(user) {
  let record;
  try {
    record = await activeAttendance(user);
  } catch {
    [[record]] = await pool.execute(
      `SELECT ar.id,ar.work_date reportDate,ar.clock_in_at clockInAt,ar.clock_out_at clockOutAt,ar.status
       FROM attendance_records ar JOIN day_end_reports r ON r.attendance_id=ar.id
       WHERE ar.employee_id=? ORDER BY ar.id DESC LIMIT 1`,
      [user.employee_id],
    );
    if (!record) throw new ApiError(404, "No Day-End Report found");
  }
  const submitted = await existing(record.id);
  return {
    attendanceId: record.id,
    reportDate: record.reportDate,
    submitted: submitted ? await reportDetails(submitted.id) : null,
  };
}

export async function todayWorkItems(user) {
  const record = await activeAttendance(user);
  return {
    reportDate: record.reportDate,
    items: await workItemsForAttendance(record, user.employee_id),
  };
}

export async function submit(data, user) {
  const connection = await pool.getConnection();
  let outcome;
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      user.employee_id,
    ]);
    const record = await activeAttendance(user, connection, true);
    const prior = await existing(record.id, connection);
    if (prior) {
      await connection.commit();
      return { report: prior, alreadySubmitted: true };
    }
    const available = await workItemsForAttendance(
      record,
      user.employee_id,
      connection,
    );
    const byKey = new Map(
      available.map((item) => [`${item.sourceType}:${item.sourceId}`, item]),
    );
    const unique = new Set();
    const resolved = data.items.map((input) => {
      const key = `${input.sourceType}:${input.sourceId}`;
      if (unique.has(key))
        throw new ApiError(400, "A work item can only be included once");
      unique.add(key);
      const source = byKey.get(key);
      if (!source)
        throw new ApiError(
          403,
          "Selected work is not part of this employee's current workday",
        );
      if (
        source.status !== "COMPLETED" &&
        (!input.whatsLeft || !input.estimatedRemainingMinutes)
      )
        throw new ApiError(
          400,
          `What's left and estimated remaining time are required for “${source.title}”`,
        );
      return { input, source };
    });
    const [created] = await connection.execute(
      `INSERT INTO day_end_reports(employee_id,attendance_id,report_date,other_work,blocker_type,
       blocker_details,tomorrow_priority,status,submitted_at)
       VALUES(?,?,?,?,?,?,?,'SUBMITTED',CURRENT_TIMESTAMP)`,
      [
        user.employee_id,
        record.id,
        record.reportDate,
        data.otherWork || null,
        data.blockerType,
        data.blockerDetails || null,
        data.tomorrowPriority,
      ],
    );
    for (const { input, source } of resolved)
      await connection.execute(
        `INSERT INTO day_end_report_items(report_id,source_type,task_id,ongoing_work_id,title_snapshot,
         status_snapshot,tracked_minutes_snapshot,summary,whats_left,estimated_remaining_minutes)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [
          created.insertId,
          source.sourceType,
          source.sourceType === "TASK" ? source.sourceId : null,
          source.sourceType === "ONGOING_WORK" ? source.sourceId : null,
          source.title,
          source.status,
          source.trackedMinutes,
          input.summary || null,
          source.status === "COMPLETED" ? null : input.whatsLeft,
          source.status === "COMPLETED"
            ? null
            : input.estimatedRemainingMinutes,
        ],
      );
    await connection.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)
       VALUES(?,?,'DAY_END_REPORT_SUBMITTED','DAY_END_REPORT',?,'Day-End Report submitted.',?)`,
      [
        user.id,
        user.employee_id,
        created.insertId,
        JSON.stringify({
          attendanceId: record.id,
          reportDate: record.reportDate,
          itemCount: resolved.length,
        }),
      ],
    );
    const report = await reportDetails(created.insertId, connection);
    await connection.commit();
    outcome = { report, alreadySubmitted: false };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      const record = await activeAttendance(user);
      return { report: await existing(record.id), alreadySubmitted: true };
    }
    throw error;
  } finally {
    connection.release();
  }
  await notifyByPolicy("DAY_END_REPORT_SUBMITTED", user, {
    title: "Day-End Report submitted",
    message: `${outcome.report.employeeName} submitted a Day-End Report for ${outcome.report.reportDate}.`,
    referenceType: "DAY_END_REPORT",
    referenceId: outcome.report.id,
    actionUrl: "/day-end-reports",
    eventKey: `DAY_END_REPORT_SUBMITTED:${outcome.report.id}`,
  });
  return outcome;
}

export async function assertSubmittedForAttendance(
  executor,
  attendanceId,
  employeeId,
) {
  const [[row]] = await executor.execute(
    "SELECT id FROM day_end_reports WHERE attendance_id=? AND employee_id=? AND status IN('SUBMITTED','REVIEWED') LIMIT 1",
    [attendanceId, employeeId],
  );
  if (!row)
    throw new ApiError(
      409,
      "Complete your Day-End Report before clocking out.",
      "DAY_END_REPORT_REQUIRED",
    );
  return row.id;
}

export async function update(id, data, user) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      user.employee_id,
    ]);
    const [[report]] = await connection.execute(
      `SELECT r.id,r.employee_id employeeId,r.attendance_id attendanceId,r.status,
        ar.work_date reportDate,ar.clock_in_at clockInAt,ar.clock_out_at clockOutAt
       FROM day_end_reports r JOIN attendance_records ar ON ar.id=r.attendance_id
       WHERE r.id=? AND r.employee_id=? FOR UPDATE`,
      [id, user.employee_id],
    );
    if (!report) throw new ApiError(404, "Day-End Report not found");
    if (report.status === "REVIEWED")
      throw new ApiError(
        409,
        "This Day-End Report has already been reviewed and can no longer be edited.",
        "DAY_END_REPORT_LOCKED",
      );
    const available = await workItemsForAttendance(
      report,
      user.employee_id,
      connection,
    );
    const byKey = new Map(
      available.map((item) => [`${item.sourceType}:${item.sourceId}`, item]),
    );
    const seen = new Set(),
      resolved = data.items.map((input) => {
        const key = `${input.sourceType}:${input.sourceId}`,
          source = byKey.get(key);
        if (seen.has(key))
          throw new ApiError(400, "A work item can only be included once");
        seen.add(key);
        if (!source)
          throw new ApiError(
            403,
            "Selected work is not part of this employee's workday",
          );
        if (
          source.status !== "COMPLETED" &&
          (!input.whatsLeft || !input.estimatedRemainingMinutes)
        )
          throw new ApiError(
            400,
            `What's left and estimated remaining time are required for “${source.title}”`,
          );
        return { input, source };
      });
    await connection.execute(
      `UPDATE day_end_reports SET other_work=?,blocker_type=?,blocker_details=?,tomorrow_priority=? WHERE id=? AND status='SUBMITTED'`,
      [
        data.otherWork || null,
        data.blockerType,
        data.blockerDetails || null,
        data.tomorrowPriority,
        id,
      ],
    );
    await connection.execute(
      "DELETE FROM day_end_report_items WHERE report_id=?",
      [id],
    );
    for (const { input, source } of resolved)
      await connection.execute(
        `INSERT INTO day_end_report_items(report_id,source_type,task_id,ongoing_work_id,title_snapshot,status_snapshot,tracked_minutes_snapshot,summary,whats_left,estimated_remaining_minutes) VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          source.sourceType,
          source.sourceType === "TASK" ? source.sourceId : null,
          source.sourceType === "ONGOING_WORK" ? source.sourceId : null,
          source.title,
          source.status,
          source.trackedMinutes,
          input.summary || null,
          source.status === "COMPLETED" ? null : input.whatsLeft,
          source.status === "COMPLETED"
            ? null
            : input.estimatedRemainingMinutes,
        ],
      );
    await connection.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values) VALUES(?,?,'DAY_END_REPORT_UPDATED','DAY_END_REPORT',?,'Day-End Report updated.',?)`,
      [
        user.id,
        user.employee_id,
        id,
        JSON.stringify({ itemCount: resolved.length }),
      ],
    );
    const result = await reportDetails(id, connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function managementList(user, query) {
  if (!(await isManagement(user)))
    throw new ApiError(403, "Management access required");
  const date = query.date;
  const day = await getCompanyDayStatus(date);
  if (!day.isWorkingDay)
    return {
      summary: {
        expected: 0,
        submitted: 0,
        needsReview: 0,
        reviewed: 0,
        blockers: 0,
      },
      items: [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 1,
      },
    };
  const where = [
      "e.status='ACTIVE'",
      "e.track_attendance=TRUE",
      "NOT EXISTS(SELECT 1 FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=e.id AND ld.leave_date=? AND lr.status='APPROVED')",
    ],
    params = [date];
  if (query.search) {
    where.push("CONCAT(e.first_name,' ',e.last_name) LIKE ?");
    params.push(`%${query.search}%`);
  }
  if (query.status === "SUBMITTED") where.push("r.status='SUBMITTED'");
  if (query.status === "REVIEWED") where.push("r.status='REVIEWED'");
  if (query.status === "NOT_SUBMITTED") where.push("r.id IS NULL");
  if (query.blocker === "HAS_BLOCKER") where.push("r.blocker_type<>'NONE'");
  if (query.blocker === "NO_BLOCKER")
    where.push("(r.blocker_type='NONE' OR r.id IS NULL)");
  const joins = ` FROM employees e LEFT JOIN day_end_reports r ON r.employee_id=e.id AND r.report_date=? LEFT JOIN attendance_records ar ON ar.employee_id=e.id AND ar.work_date=? LEFT JOIN (SELECT report_id,COUNT(*) itemCount,SUM(status_snapshot='COMPLETED') completedCount,SUM(status_snapshot<>'COMPLETED') pendingCount,SUM(CASE WHEN source_type='TASK' THEN tracked_minutes_snapshot ELSE 0 END) trackedMinutes FROM day_end_report_items GROUP BY report_id) x ON x.report_id=r.id`;
  const base = [date, date, ...params];
  const [[count]] = await pool.execute(
    `SELECT COUNT(DISTINCT e.id) total${joins} WHERE ${where.join(" AND ")}`,
    base,
  );
  const [items] = await pool.execute(
    `SELECT e.id employeeId,CONCAT(e.first_name,' ',e.last_name) employeeName,r.id reportId,r.status reportStatus,r.submitted_at submittedAt,r.updated_at updatedAt,r.blocker_type blockerType,COALESCE(x.itemCount,0) itemCount,COALESCE(x.completedCount,0) completedCount,COALESCE(x.pendingCount,0) pendingCount,COALESCE(x.trackedMinutes,0) trackedMinutes,CASE WHEN r.id IS NOT NULL THEN r.status WHEN ar.status IN('WORKING','ON_BREAK') THEN 'WORKING' WHEN ar.status='CLOCKED_OUT' THEN 'MISSING' ELSE 'NOT_SUBMITTED' END displayStatus${joins} WHERE ${where.join(" AND ")} ORDER BY (r.id IS NULL),employeeName LIMIT ? OFFSET ?`,
    [...base, query.limit, (query.page - 1) * query.limit],
  );
  const [[summary]] = await pool.execute(
    `SELECT COUNT(DISTINCT e.id) expected,COUNT(DISTINCT r.id) submitted,SUM(r.status='SUBMITTED') needsReview,SUM(r.status='REVIEWED') reviewed,SUM(r.blocker_type<>'NONE') blockers${joins} WHERE e.status='ACTIVE' AND e.track_attendance=TRUE AND NOT EXISTS(SELECT 1 FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=e.id AND ld.leave_date=? AND lr.status='APPROVED')`,
    [date, date, date],
  );
  const total = Number(count.total || 0);
  return {
    summary: Object.fromEntries(
      Object.entries(summary).map(([k, v]) => [k, Number(v || 0)]),
    ),
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function managementDetails(user, id) {
  if (!(await isManagement(user)))
    throw new ApiError(403, "Management access required");
  return reportDetails(id);
}

export async function review(user, id) {
  if (!(await isManagement(user)))
    throw new ApiError(403, "Management access required");
  const connection = await pool.getConnection();
  let result;
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute(
      "SELECT id,employee_id employeeId,report_date reportDate,status FROM day_end_reports WHERE id=? FOR UPDATE",
      [id],
    );
    if (!row) throw new ApiError(404, "Day-End Report not found");
    if (row.status !== "REVIEWED") {
      await connection.execute(
        "UPDATE day_end_reports SET status='REVIEWED',reviewed_at=CURRENT_TIMESTAMP,reviewed_by=? WHERE id=? AND status='SUBMITTED'",
        [user.id, id],
      );
      await connection.execute(
        `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values) VALUES(?,?,'DAY_END_REPORT_REVIEWED','DAY_END_REPORT',?,'Day-End Report reviewed.',?)`,
        [
          user.id,
          user.employee_id,
          id,
          JSON.stringify({ employeeId: row.employeeId }),
        ],
      );
    }
    result = await reportDetails(id, connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  const [[recipient]] = await pool.execute(
    "SELECT id FROM users WHERE employee_id=? AND status='ACTIVE'",
    [result.employeeId],
  );
  if (recipient)
    await notifyByPolicy("DAY_END_REPORT_REVIEWED", user, {
      title: "Day-End Report Reviewed",
      message: `Your Day-End Report for ${result.reportDate} was reviewed by ${result.reviewerName || "management"}.`,
      referenceType: "DAY_END_REPORT",
      referenceId: id,
      actionUrl: "/",
      recipientUserIds: [recipient.id],
      eventKey: `DAY_END_REPORT_REVIEWED:${id}`,
    });
  return result;
}
