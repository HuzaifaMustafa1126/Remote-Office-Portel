import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { formatAuditTime } from "../utils/attendanceTime.js";
import { getCompanyDayStatus } from "../utils/workingDay.js";
import { notifyRoles } from "./notification.service.js";
import { applicableShift } from "./shift.service.js";
import { getPayrollSettings, periodForDate } from "../utils/payrollPeriod.js";

const attendanceSelect = `
  SELECT ar.id, ar.employee_id AS employeeId, ar.work_date AS workDate,ar.attendance_date AS attendanceDate,
    ar.clock_in_at AS clockInAt, ar.clock_out_at AS clockOutAt,
    ar.total_break_minutes AS totalBreakMinutes, ar.total_work_minutes AS totalWorkMinutes,
    ar.scheduled_clock_in AS scheduledClockIn, ar.scheduled_clock_out AS scheduledClockOut,
    ar.grace_minutes AS graceMinutes, ar.required_work_minutes AS requiredWorkMinutes,
    ar.break_allowance_minutes AS breakAllowanceMinutes, ar.arrival_status AS arrivalStatus,
    ar.late_minutes AS lateMinutes, ar.short_minutes AS shortMinutes, ar.extra_minutes AS extraMinutes,
    ar.break_exceeded_minutes AS breakExceededMinutes,
    ar.status, ar.day_status AS dayStatus,CASE WHEN ar.status IN ('WORKING','ON_BREAK') AND ar.scheduled_clock_out<CURRENT_TIMESTAMP THEN 'OPEN_SHIFT' ELSE ar.reconciliation_status END AS reconciliationStatus,
    CONCAT(e.first_name, ' ', e.last_name) AS employeeName,
    e.employee_code AS employeeCode, e.department
  FROM attendance_records ar JOIN employees e ON e.id = ar.employee_id`;

async function audit(
  conn,
  { userId, employeeId, action, entityId, description },
) {
  await conn.execute(
    `INSERT INTO audit_logs (user_id, employee_id, action, entity_type, entity_id, description)
     VALUES (?, ?, ?, 'ATTENDANCE', ?, ?)`,
    [userId, employeeId, action, entityId, description],
  );
}

async function employeeName(conn, employeeId) {
  const [[employee]] = await conn.execute(
    `SELECT CONCAT(first_name, ' ', last_name) AS name, track_attendance AS trackAttendance FROM employees WHERE id = ?`,
    [employeeId],
  );
  if (!employee) throw new ApiError(404, "Employee profile not found");
  if (!employee.trackAttendance)
    throw new ApiError(
      403,
      "This account is not configured for attendance tracking",
    );
  return employee.name;
}

async function currentRecord(conn, employeeId, lock = false) {
  const [rows] = await conn.execute(
    `SELECT * FROM attendance_records
     WHERE employee_id = ? AND (work_date = CURRENT_DATE OR status IN ('WORKING','ON_BREAK'))
     ORDER BY (status IN ('WORKING','ON_BREAK')) DESC,work_date DESC
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [employeeId],
  );
  if (rows[0]?.scheduled_clock_out && rows[0].status !== "CLOCKED_OUT") {
    const [[overdue]] = await conn.execute(
      "SELECT CURRENT_TIMESTAMP>? overdue",
      [rows[0].scheduled_clock_out],
    );
    if (overdue.overdue) {
      await conn.execute(
        "UPDATE attendance_records SET reconciliation_status='OPEN_SHIFT' WHERE id=?",
        [rows[0].id],
      );
      rows[0].reconciliation_status = "OPEN_SHIFT";
    }
  }
  return rows[0];
}

async function transaction(action) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await action(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function clockIn(user) {
  const outcome = await transaction(async (conn) => {
    const name = await employeeName(conn, user.employee_id);
    const [[clock]] = await conn.execute(
      "SELECT CURRENT_DATE AS today,DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY) yesterday,TIME_FORMAT(CURRENT_TIME,'%H:%i') currentTime",
    );
    const todaySettings = await applicableShift(
      user.employee_id,
      clock.today,
      conn,
    );
    const previousSettings = await applicableShift(
      user.employee_id,
      clock.yesterday,
      conn,
    );
    const belongsToPrevious =
      previousSettings?.crossesMidnight &&
      clock.currentTime <= previousSettings.clockOutTime;
    const workDate = belongsToPrevious ? clock.yesterday : clock.today;
    const settings = belongsToPrevious ? previousSettings : todaySettings;
    const companyDay = await getCompanyDayStatus(workDate, conn);
    if (!companyDay.isWorkingDay)
      throw new ApiError(
        409,
        `Attendance is not required today: ${companyDay.title}`,
      );
    if (await currentRecord(conn, user.employee_id, true))
      throw new ApiError(409, "You are already clocked in");
    let snapshot = { scheduledIn: null, scheduledOut: null, lateMinutes: 0 };
    if (settings)
      [[snapshot]] = await conn.execute(
        `SELECT TIMESTAMP(?,?) scheduledIn,TIMESTAMP(DATE_ADD(?,INTERVAL ? DAY),?) scheduledOut,
         GREATEST(0,TIMESTAMPDIFF(MINUTE,DATE_ADD(TIMESTAMP(?,?),INTERVAL ? MINUTE),CURRENT_TIMESTAMP)) lateMinutes`,
        [
          workDate,
          settings.clockInTime,
          workDate,
          settings.crossesMidnight ? 1 : 0,
          settings.clockOutTime,
          workDate,
          settings.clockInTime,
          settings.graceMinutes,
        ],
      );
    const [result] = await conn.execute(
      `INSERT INTO attendance_records(employee_id,attendance_date,work_date,shift_id,scheduled_clock_in,scheduled_clock_out,
       grace_minutes,required_work_minutes,break_allowance_minutes,arrival_status,late_minutes,clock_in_at,status,day_status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,'WORKING','PRESENT')`,
      [
        user.employee_id,
        workDate,
        workDate,
        settings?.id || null,
        snapshot.scheduledIn,
        snapshot.scheduledOut,
        settings?.graceMinutes ?? null,
        settings?.requiredWorkMinutes ?? null,
        settings?.breakAllowanceMinutes ?? null,
        settings
          ? Number(snapshot.lateMinutes) > 0
            ? "LATE"
            : "ON_TIME"
          : null,
        Number(snapshot.lateMinutes || 0),
      ],
    );
    const [[record]] = await conn.execute(
      "SELECT clock_in_at FROM attendance_records WHERE id = ?",
      [result.insertId],
    );
    await audit(conn, {
      userId: user.id,
      employeeId: user.employee_id,
      action: "ATTENDANCE_CLOCK_IN",
      entityId: result.insertId,
      description: `${name} clocked in at ${formatAuditTime(record.clock_in_at)}.`,
    });
    return {
      data: await getToday(user, conn),
      name,
      recordId: result.insertId,
      at: record.clock_in_at,
      lateMinutes: Number(snapshot.lateMinutes || 0),
    };
  });
  await notifyRoles(["CEO", "ADMIN"], {
    type: outcome.lateMinutes
      ? "ATTENDANCE_LATE_ARRIVAL"
      : "ATTENDANCE_CLOCK_IN",
    title: outcome.lateMinutes ? "Late Arrival" : "Employee Clocked In",
    message: outcome.lateMinutes
      ? `${outcome.name} clocked in ${outcome.lateMinutes} minutes late.`
      : `${outcome.name} clocked in at ${formatAuditTime(outcome.at)}.`,
    referenceType: "ATTENDANCE",
    referenceId: outcome.recordId,
    actionUrl: "/attendance",
  });
  return outcome.data;
}

export async function startBreak(user) {
  const outcome = await transaction(async (conn) => {
    const name = await employeeName(conn, user.employee_id);
    const record = await currentRecord(conn, user.employee_id, true);
    if (!record)
      throw new ApiError(409, "You must clock in before starting a break");
    if (record.status === "CLOCKED_OUT")
      throw new ApiError(409, "Your workday has already been completed");
    if (record.status === "ON_BREAK")
      throw new ApiError(409, "You already have an active break");
    const [[active]] = await conn.execute(
      `SELECT id FROM attendance_breaks WHERE attendance_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE`,
      [record.id],
    );
    if (active) throw new ApiError(409, "You already have an active break");
    const [result] = await conn.execute(
      `INSERT INTO attendance_breaks (attendance_id, break_start_at, status) VALUES (?, CURRENT_TIMESTAMP, 'ACTIVE')`,
      [record.id],
    );
    await conn.execute(
      `UPDATE attendance_records SET status = 'ON_BREAK' WHERE id = ?`,
      [record.id],
    );
    const [[entry]] = await conn.execute(
      "SELECT break_start_at FROM attendance_breaks WHERE id = ?",
      [result.insertId],
    );
    await audit(conn, {
      userId: user.id,
      employeeId: user.employee_id,
      action: "BREAK_STARTED",
      entityId: record.id,
      description: `${name} started a break at ${formatAuditTime(entry.break_start_at)}.`,
    });
    return {
      data: await getToday(user, conn),
      name,
      recordId: record.id,
      at: entry.break_start_at,
    };
  });
  await notifyRoles(["CEO", "ADMIN"], {
    type: "BREAK_STARTED",
    title: "Break Started",
    message: `${outcome.name} started a break at ${formatAuditTime(outcome.at)}.`,
    referenceType: "ATTENDANCE",
    referenceId: outcome.recordId,
    actionUrl: "/attendance",
  });
  return outcome.data;
}

export async function endBreak(user) {
  const outcome = await transaction(async (conn) => {
    const name = await employeeName(conn, user.employee_id);
    const record = await currentRecord(conn, user.employee_id, true);
    if (!record)
      throw new ApiError(409, "You must clock in before ending a break");
    if (record.status === "CLOCKED_OUT")
      throw new ApiError(409, "Your workday has already been completed");
    const [[active]] = await conn.execute(
      `SELECT id FROM attendance_breaks WHERE attendance_id = ? AND status = 'ACTIVE' ORDER BY break_start_at DESC LIMIT 1 FOR UPDATE`,
      [record.id],
    );
    if (!active) throw new ApiError(409, "No active break was found");
    await conn.execute(
      `UPDATE attendance_breaks
       SET break_end_at = CURRENT_TIMESTAMP,
           duration_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, break_start_at, CURRENT_TIMESTAMP)),
           status = 'COMPLETED'
       WHERE id = ?`,
      [active.id],
    );
    await conn.execute(
      `UPDATE attendance_records
       SET status = 'WORKING', total_break_minutes = (
         SELECT COALESCE(SUM(duration_minutes), 0) FROM attendance_breaks WHERE attendance_id = ?
       ) WHERE id = ?`,
      [record.id, record.id],
    );
    const [[entry]] = await conn.execute(
      "SELECT break_end_at,duration_minutes FROM attendance_breaks WHERE id = ?",
      [active.id],
    );
    await audit(conn, {
      userId: user.id,
      employeeId: user.employee_id,
      action: "BREAK_ENDED",
      entityId: record.id,
      description: `${name} ended a break at ${formatAuditTime(entry.break_end_at)}.`,
    });
    return {
      data: await getToday(user, conn),
      name,
      recordId: record.id,
      duration: Number(entry.duration_minutes || 0),
    };
  });
  await notifyRoles(["CEO", "ADMIN"], {
    type: "BREAK_ENDED",
    title: "Break Ended",
    message: `${outcome.name} returned from break. Duration: ${outcome.duration} minutes.`,
    referenceType: "ATTENDANCE",
    referenceId: outcome.recordId,
    actionUrl: "/attendance",
  });
  return outcome.data;
}

export async function clockOut(user) {
  const outcome = await transaction(async (conn) => {
    const name = await employeeName(conn, user.employee_id);
    const record = await currentRecord(conn, user.employee_id, true);
    if (!record)
      throw new ApiError(409, "You must clock in before clocking out");
    if (record.status === "CLOCKED_OUT")
      throw new ApiError(409, "Your workday has already been completed");
    const [[active]] = await conn.execute(
      `SELECT id FROM attendance_breaks WHERE attendance_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE`,
      [record.id],
    );
    if (active || record.status === "ON_BREAK")
      throw new ApiError(409, "You must end your break before clocking out");
    await conn.execute(
      `UPDATE attendance_records
       SET clock_out_at = CURRENT_TIMESTAMP, status = 'CLOCKED_OUT',
           total_break_minutes = (SELECT COALESCE(SUM(duration_minutes), 0) FROM attendance_breaks WHERE attendance_id = ?),
           total_work_minutes = GREATEST(0,
             TIMESTAMPDIFF(MINUTE, clock_in_at, CURRENT_TIMESTAMP) -
             (SELECT COALESCE(SUM(duration_minutes), 0) FROM attendance_breaks WHERE attendance_id = ?)
           ),
           short_minutes=GREATEST(0,COALESCE(required_work_minutes,0)-GREATEST(0,TIMESTAMPDIFF(MINUTE,clock_in_at,CURRENT_TIMESTAMP)-(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?))),
           extra_minutes=GREATEST(0,GREATEST(0,TIMESTAMPDIFF(MINUTE,clock_in_at,CURRENT_TIMESTAMP)-(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?))-COALESCE(required_work_minutes,0)),
           break_exceeded_minutes=GREATEST(0,(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?)-COALESCE(break_allowance_minutes,0))
       WHERE id = ?`,
      [record.id, record.id, record.id, record.id, record.id, record.id],
    );
    const [[entry]] = await conn.execute(
      "SELECT clock_out_at FROM attendance_records WHERE id = ?",
      [record.id],
    );
    await audit(conn, {
      userId: user.id,
      employeeId: user.employee_id,
      action: "ATTENDANCE_CLOCK_OUT",
      entityId: record.id,
      description: `${name} clocked out at ${formatAuditTime(entry.clock_out_at)}.`,
    });
    return {
      data: await getToday(user, conn),
      name,
      recordId: record.id,
      at: entry.clock_out_at,
    };
  });
  await notifyRoles(["CEO", "ADMIN"], {
    type: "ATTENDANCE_CLOCK_OUT",
    title: "Employee Clocked Out",
    message: `${outcome.name} clocked out at ${formatAuditTime(outcome.at)}.`,
    referenceType: "ATTENDANCE",
    referenceId: outcome.recordId,
    actionUrl: "/attendance",
  });
  return outcome.data;
}

export async function getToday(user, executor = pool) {
  const [[clock]] = await executor.execute("SELECT CURRENT_DATE AS today");
  const companyDay = await getCompanyDayStatus(clock.today, executor);
  let currentSettings = await applicableShift(
    user.employee_id,
    clock.today,
    executor,
  );
  const [records] = await executor.execute(
    `${attendanceSelect} WHERE ar.employee_id = ? AND (ar.work_date=CURRENT_DATE OR ar.status IN ('WORKING','ON_BREAK'))
      ORDER BY (ar.status IN ('WORKING','ON_BREAK')) DESC,ar.work_date DESC LIMIT 1`,
    [user.employee_id],
  );
  if (!records[0])
    return {
      status: companyDay.isWorkingDay ? "NOT_CLOCKED_IN" : companyDay.dayType,
      companyDay,
      schedule: currentSettings,
      record: null,
      breaks: [],
      timeline: [],
      serverTime: new Date().toISOString(),
    };
  const record = records[0];
  if (record.workDate !== clock.today)
    currentSettings = await applicableShift(
      user.employee_id,
      record.workDate,
      executor,
    );
  const [[timer]] = await executor.execute(
    `SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, clock_in_at, COALESCE(clock_out_at, CURRENT_TIMESTAMP)) -
      COALESCE((SELECT SUM(TIMESTAMPDIFF(SECOND, b.break_start_at, COALESCE(b.break_end_at, CURRENT_TIMESTAMP)))
        FROM attendance_breaks b WHERE b.attendance_id = attendance_records.id), 0)) AS liveWorkSeconds
     FROM attendance_records WHERE id = ?`,
    [record.id],
  );
  record.liveWorkSeconds = Number(timer.liveWorkSeconds || 0);
  const [breaks] = await executor.execute(
    `SELECT id, break_start_at AS breakStartAt, break_end_at AS breakEndAt,
      duration_minutes AS durationMinutes, status,
      CASE WHEN status = 'ACTIVE' THEN TIMESTAMPDIFF(SECOND, break_start_at, CURRENT_TIMESTAMP) ELSE duration_minutes * 60 END AS liveDurationSeconds
     FROM attendance_breaks WHERE attendance_id = ? ORDER BY break_start_at`,
    [record.id],
  );
  const timeline = [
    { type: "CLOCK_IN", at: record.clockInAt, label: "Clocked In" },
  ];
  for (const item of breaks) {
    timeline.push({
      type: "BREAK_START",
      at: item.breakStartAt,
      label: "Break Started",
    });
    if (item.breakEndAt)
      timeline.push({
        type: "BREAK_END",
        at: item.breakEndAt,
        label: "Break Ended",
      });
  }
  if (record.clockOutAt)
    timeline.push({
      type: "CLOCK_OUT",
      at: record.clockOutAt,
      label: "Clocked Out",
    });
  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));
  return {
    status: record.status,
    companyDay,
    schedule: currentSettings,
    record,
    breaks,
    timeline,
    serverTime: new Date().toISOString(),
  };
}

async function canViewAll(user) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = ? AND p.name = 'attendance.view_all' LIMIT 1`,
    [user.id],
  );
  return rows.length > 0;
}

export async function getHistory(user, filters) {
  const employeeId = filters.employeeId || user.employee_id;
  if (
    Number(employeeId) !== Number(user.employee_id) &&
    !(await canViewAll(user))
  )
    throw new ApiError(403, "You cannot view another employee’s attendance");
  const [rows] = await pool.execute(
    `${attendanceSelect} WHERE ar.employee_id = ? AND e.track_attendance = TRUE
      AND (? IS NULL OR ar.work_date >= ?)
      AND (? IS NULL OR ar.work_date <= ?)
     ORDER BY ar.work_date DESC`,
    [
      employeeId,
      filters.from || null,
      filters.from || null,
      filters.to || null,
      filters.to || null,
    ],
  );
  return rows;
}

export async function getLiveOffice() {
  const [employees] = await pool.execute(
    `SELECT e.id AS employeeId, CONCAT(e.first_name, ' ', e.last_name) AS employeeName,
      e.employee_code AS employeeCode, e.department, e.job_title AS jobTitle,
      COALESCE(ar.status, 'NOT_CLOCKED_IN') AS status, ar.clock_in_at AS clockInAt,
      ar.work_date AS workDate,ar.arrival_status AS arrivalStatus,CASE WHEN ar.status IN ('WORKING','ON_BREAK') AND ar.scheduled_clock_out<CURRENT_TIMESTAMP THEN 'OPEN_SHIFT' ELSE ar.reconciliation_status END AS reconciliationStatus,
      GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, ar.clock_in_at, COALESCE(ar.clock_out_at, CURRENT_TIMESTAMP)), 0) -
        COALESCE((SELECT SUM(TIMESTAMPDIFF(SECOND, b.break_start_at, COALESCE(b.break_end_at, CURRENT_TIMESTAMP))) FROM attendance_breaks b WHERE b.attendance_id = ar.id), 0)) AS workSeconds,
      COALESCE((SELECT TIMESTAMPDIFF(SECOND, b.break_start_at, CURRENT_TIMESTAMP) FROM attendance_breaks b WHERE b.attendance_id = ar.id AND b.status = 'ACTIVE' LIMIT 1), 0) AS currentBreakSeconds
     FROM employees e LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND
       (ar.work_date=CURRENT_DATE OR (ar.status IN ('WORKING','ON_BREAK') AND ar.work_date<CURRENT_DATE))
     WHERE e.status = 'ACTIVE' AND e.track_attendance = TRUE ORDER BY FIELD(COALESCE(ar.status, 'NOT_CLOCKED_IN'), 'ON_BREAK','WORKING','CLOCKED_OUT','NOT_CLOCKED_IN'), e.first_name, e.last_name`,
  );
  const stats = {
    totalEmployees: employees.length,
    presentToday: 0,
    workingNow: 0,
    onBreak: 0,
    clockedOut: 0,
    notClockedIn: 0,
    late: 0,
    openShifts: 0,
  };
  for (const e of employees) {
    if (e.status !== "NOT_CLOCKED_IN") stats.presentToday += 1;
    if (e.status === "WORKING") stats.workingNow += 1;
    if (e.status === "ON_BREAK") stats.onBreak += 1;
    if (e.status === "CLOCKED_OUT") stats.clockedOut += 1;
    if (e.status === "NOT_CLOCKED_IN") stats.notClockedIn += 1;
    if (e.arrivalStatus === "LATE") stats.late += 1;
    if (e.reconciliationStatus === "OPEN_SHIFT") stats.openShifts += 1;
  }
  return { stats, employees, serverTime: new Date().toISOString() };
}

export async function getActivity() {
  const [rows] = await pool.execute(
    `SELECT id, action, description, created_at AS createdAt
     FROM audit_logs WHERE action IN ('ATTENDANCE_CLOCK_IN','BREAK_STARTED','BREAK_ENDED','ATTENDANCE_CLOCK_OUT','ATTENDANCE_UPDATED')
     ORDER BY created_at DESC LIMIT 8`,
  );
  return rows;
}

export async function getAttendance(filters) {
  const [rows] = await pool.execute(
    `${attendanceSelect} WHERE e.track_attendance = TRUE AND (? IS NULL OR ar.employee_id = ?)
      AND (? IS NULL OR e.department = ?)
      AND (? IS NULL OR ar.work_date >= ?)
      AND (? IS NULL OR ar.work_date <= ?)
      AND (? IS NULL OR ar.status = ?)
     ORDER BY ar.work_date DESC, e.first_name`,
    [
      filters.employeeId || null,
      filters.employeeId || null,
      filters.department || null,
      filters.department || null,
      filters.from || null,
      filters.from || null,
      filters.to || null,
      filters.to || null,
      filters.status || null,
      filters.status || null,
    ],
  );
  return rows;
}

export async function getDailyReport(date) {
  const [[clock]] = await pool.execute(
    "SELECT COALESCE(?, CURRENT_DATE) AS reportDate",
    [date || null],
  );
  const reportDate = clock.reportDate;
  const [rows] = await pool.execute(
    `SELECT e.id AS employeeId, CONCAT(e.first_name, ' ', e.last_name) AS employeeName,
      e.employee_code AS employeeCode, e.department, ar.clock_in_at AS clockInAt,
      ar.clock_out_at AS clockOutAt, COALESCE(ar.total_break_minutes, 0) AS totalBreakMinutes,
      COALESCE(ar.total_work_minutes, 0) AS totalWorkMinutes,
      COALESCE(ar.status, 'NOT_CLOCKED_IN') AS status
     FROM employees e LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.work_date = ?
     WHERE e.status = 'ACTIVE' AND e.track_attendance = TRUE ORDER BY e.first_name, e.last_name`,
    [reportDate],
  );
  const totals = {
    totalEmployees: rows.length,
    present: 0,
    leave: 0,
    absent: 0,
    notClockedIn: 0,
    working: 0,
    onBreak: 0,
    clockedOut: 0,
    totalWorkedMinutes: 0,
    totalBreakMinutes: 0,
  };
  for (const row of rows) {
    if (row.status === "NOT_CLOCKED_IN") totals.notClockedIn += 1;
    else if (row.status === "LEAVE") totals.leave += 1;
    else if (row.status === "ABSENT") totals.absent += 1;
    else totals.present += 1;
    if (row.status === "WORKING") totals.working += 1;
    if (row.status === "ON_BREAK") totals.onBreak += 1;
    if (row.status === "CLOCKED_OUT") totals.clockedOut += 1;
    totals.totalWorkedMinutes += Number(row.totalWorkMinutes || 0);
    totals.totalBreakMinutes += Number(row.totalBreakMinutes || 0);
  }
  return { date: reportDate, totals, rows };
}

export async function getMonthlyReport(month) {
  const [[clock]] = await pool.execute(
    `SELECT COALESCE(?, DATE_FORMAT(CURRENT_DATE, '%Y-%m')) AS reportMonth, CURRENT_DATE AS today`,
    [month || null],
  );
  const payroll = await getPayrollSettings(),
    period = periodForDate(
      `${clock.reportMonth}-04`,
      Number(payroll.cycleStartDay),
    );
  const start = period.start,
    effectiveEnd =
      clock.today < period.endInclusive ? clock.today : period.endInclusive;
  const calendar = {
    calendarDays: Math.round(
      (new Date(`${period.endExclusive}T00:00:00Z`) -
        new Date(`${start}T00:00:00Z`)) /
        86400000,
    ),
    workingDays: 0,
    weeklyOffDays: 0,
    officialHolidays: 0,
  };
  const cursor = new Date(`${start}T00:00:00Z`),
    last = new Date(`${effectiveEnd}T00:00:00Z`);
  while (cursor <= last) {
    const day = await getCompanyDayStatus(cursor.toISOString().slice(0, 10));
    if (day.isWorkingDay) calendar.workingDays += 1;
    else if (day.dayType === "WEEKLY_OFF") calendar.weeklyOffDays += 1;
    else calendar.officialHolidays += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const workingDays = calendar.workingDays;
  const [rows] = await pool.execute(
    `SELECT e.id AS employeeId, CONCAT(e.first_name, ' ', e.last_name) AS employeeName,
      e.employee_code AS employeeCode, e.department,
      ? AS totalWorkingDays, COALESCE(SUM(ar.day_status='PRESENT'),0) AS presentDays,
      COALESCE(SUM(ar.day_status='LEAVE'),0) AS leaveDays,
      GREATEST(0, ? - COALESCE(SUM(ar.day_status IN ('PRESENT','LEAVE')),0)) AS absentDays,
      COALESCE(SUM(ar.total_work_minutes), 0) AS totalWorkedMinutes,
      COALESCE(SUM(ar.total_break_minutes), 0) AS totalBreakMinutes,
      ROUND(COALESCE(SUM(ar.total_work_minutes), 0) / NULLIF(SUM(ar.day_status='PRESENT'), 0), 1) AS averageDailyWorkMinutes
     FROM employees e LEFT JOIN attendance_records ar ON ar.employee_id = e.id
       AND ar.work_date BETWEEN ? AND ?
     WHERE e.status = 'ACTIVE' AND e.track_attendance = TRUE GROUP BY e.id ORDER BY e.first_name, e.last_name`,
    [workingDays, workingDays, start, effectiveEnd],
  );
  return {
    month: clock.reportMonth,
    periodStart: period.start,
    periodEnd: period.endInclusive,
    workingDays,
    calendar,
    rows,
  };
}

export async function reconcileOpenShift(id, data, actor) {
  return transaction(async (conn) => {
    const [[record]] = await conn.execute(
      "SELECT * FROM attendance_records WHERE id=? FOR UPDATE",
      [id],
    );
    if (!record) throw new ApiError(404, "Attendance record not found");
    const clockOut = data.clockOutAt.replace("T", " ");
    const [[valid]] = await conn.execute(
      "SELECT ?>clock_in_at valid FROM attendance_records WHERE id=?",
      [clockOut, id],
    );
    if (!valid.valid)
      throw new ApiError(400, "Clock-out must be after clock-in");
    await conn.execute(
      `UPDATE attendance_records SET clock_out_at=?,status='CLOCKED_OUT',reconciliation_status='CORRECTED',
      total_break_minutes=(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?),
      total_work_minutes=GREATEST(0,TIMESTAMPDIFF(MINUTE,clock_in_at,?)-(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?)),
      short_minutes=GREATEST(0,COALESCE(required_work_minutes,0)-GREATEST(0,TIMESTAMPDIFF(MINUTE,clock_in_at,?)-(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?))),
      extra_minutes=GREATEST(0,GREATEST(0,TIMESTAMPDIFF(MINUTE,clock_in_at,?)-(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?))-COALESCE(required_work_minutes,0)),
      break_exceeded_minutes=GREATEST(0,(SELECT COALESCE(SUM(duration_minutes),0) FROM attendance_breaks WHERE attendance_id=?)-COALESCE(break_allowance_minutes,0)) WHERE id=?`,
      [
        clockOut,
        record.id,
        clockOut,
        record.id,
        clockOut,
        record.id,
        clockOut,
        record.id,
        record.id,
        id,
      ],
    );
    await audit(conn, {
      userId: actor.id,
      employeeId: actor.employee_id,
      action: "ATTENDANCE_CORRECTED",
      entityId: id,
      description: `Open shift #${id} was manually closed at ${clockOut}. Reason: ${data.comment}`,
    });
    await conn.execute(
      "UPDATE payroll_runs SET review_required=TRUE WHERE status IN ('APPROVED','PAID') AND ?>=period_start AND ?<=period_end",
      [record.work_date, record.work_date],
    );
    const [[updated]] = await conn.execute(
      `${attendanceSelect} WHERE ar.id=?`,
      [id],
    );
    return updated;
  });
}
