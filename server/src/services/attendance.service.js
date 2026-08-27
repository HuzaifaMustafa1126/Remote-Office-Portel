import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { formatAuditTime } from "../utils/attendanceTime.js";
import { getCompanyDayStatus } from "../utils/workingDay.js";
import { notifyRoles } from "./notification.service.js";

const attendanceSelect = `
  SELECT ar.id, ar.employee_id AS employeeId, ar.attendance_date AS attendanceDate,
    ar.clock_in_at AS clockInAt, ar.clock_out_at AS clockOutAt,
    ar.total_break_minutes AS totalBreakMinutes, ar.total_work_minutes AS totalWorkMinutes,
    ar.status, ar.day_status AS dayStatus,
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
     WHERE employee_id = ? AND attendance_date = CURRENT_DATE
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [employeeId],
  );
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
    const [[clock]] = await conn.execute("SELECT CURRENT_DATE AS today");
    const companyDay = await getCompanyDayStatus(clock.today, conn);
    if (!companyDay.isWorkingDay)
      throw new ApiError(
        409,
        `Attendance is not required today: ${companyDay.title}`,
      );
    if (await currentRecord(conn, user.employee_id, true))
      throw new ApiError(409, "You are already clocked in");
    const [result] = await conn.execute(
      `INSERT INTO attendance_records (employee_id, attendance_date, clock_in_at, status, day_status)
       VALUES (?, CURRENT_DATE, CURRENT_TIMESTAMP, 'WORKING', 'PRESENT')`,
      [user.employee_id],
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
    return { data: await getToday(user, conn), name, recordId: result.insertId, at: record.clock_in_at };
  });
  await notifyRoles(["CEO", "ADMIN"], { type: "ATTENDANCE_CLOCK_IN", title: "Employee Clocked In",
    message: `${outcome.name} clocked in at ${formatAuditTime(outcome.at)}.`, referenceType: "ATTENDANCE",
    referenceId: outcome.recordId, actionUrl: "/attendance" });
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
    return { data: await getToday(user, conn), name, recordId: record.id, at: entry.break_start_at };
  });
  await notifyRoles(["CEO", "ADMIN"], { type: "BREAK_STARTED", title: "Break Started",
    message: `${outcome.name} started a break at ${formatAuditTime(outcome.at)}.`, referenceType: "ATTENDANCE",
    referenceId: outcome.recordId, actionUrl: "/attendance" });
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
    return { data: await getToday(user, conn), name, recordId: record.id, duration: Number(entry.duration_minutes || 0) };
  });
  await notifyRoles(["CEO", "ADMIN"], { type: "BREAK_ENDED", title: "Break Ended",
    message: `${outcome.name} returned from break. Duration: ${outcome.duration} minutes.`, referenceType: "ATTENDANCE",
    referenceId: outcome.recordId, actionUrl: "/attendance" });
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
           )
       WHERE id = ?`,
      [record.id, record.id, record.id],
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
    return { data: await getToday(user, conn), name, recordId: record.id, at: entry.clock_out_at };
  });
  await notifyRoles(["CEO", "ADMIN"], { type: "ATTENDANCE_CLOCK_OUT", title: "Employee Clocked Out",
    message: `${outcome.name} clocked out at ${formatAuditTime(outcome.at)}.`, referenceType: "ATTENDANCE",
    referenceId: outcome.recordId, actionUrl: "/attendance" });
  return outcome.data;
}

export async function getToday(user, executor = pool) {
  const [[clock]] = await executor.execute("SELECT CURRENT_DATE AS today");
  const companyDay = await getCompanyDayStatus(clock.today, executor);
  const [records] = await executor.execute(
    `${attendanceSelect} WHERE ar.employee_id = ? AND ar.attendance_date = CURRENT_DATE LIMIT 1`,
    [user.employee_id],
  );
  if (!records[0])
    return {
      status: companyDay.isWorkingDay ? "NOT_CLOCKED_IN" : companyDay.dayType,
      companyDay,
      record: null,
      breaks: [],
      timeline: [],
      serverTime: new Date().toISOString(),
    };
  const record = records[0];
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
      AND (? IS NULL OR ar.attendance_date >= ?)
      AND (? IS NULL OR ar.attendance_date <= ?)
     ORDER BY ar.attendance_date DESC`,
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
      GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, ar.clock_in_at, COALESCE(ar.clock_out_at, CURRENT_TIMESTAMP)), 0) -
        COALESCE((SELECT SUM(TIMESTAMPDIFF(SECOND, b.break_start_at, COALESCE(b.break_end_at, CURRENT_TIMESTAMP))) FROM attendance_breaks b WHERE b.attendance_id = ar.id), 0)) AS workSeconds,
      COALESCE((SELECT TIMESTAMPDIFF(SECOND, b.break_start_at, CURRENT_TIMESTAMP) FROM attendance_breaks b WHERE b.attendance_id = ar.id AND b.status = 'ACTIVE' LIMIT 1), 0) AS currentBreakSeconds
     FROM employees e LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.attendance_date = CURRENT_DATE
     WHERE e.status = 'ACTIVE' AND e.track_attendance = TRUE ORDER BY FIELD(COALESCE(ar.status, 'NOT_CLOCKED_IN'), 'ON_BREAK','WORKING','CLOCKED_OUT','NOT_CLOCKED_IN'), e.first_name, e.last_name`,
  );
  const stats = {
    totalEmployees: employees.length,
    presentToday: 0,
    workingNow: 0,
    onBreak: 0,
    clockedOut: 0,
    notClockedIn: 0,
  };
  for (const e of employees) {
    if (e.status !== "NOT_CLOCKED_IN") stats.presentToday += 1;
    if (e.status === "WORKING") stats.workingNow += 1;
    if (e.status === "ON_BREAK") stats.onBreak += 1;
    if (e.status === "CLOCKED_OUT") stats.clockedOut += 1;
    if (e.status === "NOT_CLOCKED_IN") stats.notClockedIn += 1;
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
      AND (? IS NULL OR ar.attendance_date >= ?)
      AND (? IS NULL OR ar.attendance_date <= ?)
      AND (? IS NULL OR ar.status = ?)
     ORDER BY ar.attendance_date DESC, e.first_name`,
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
     FROM employees e LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.attendance_date = ?
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
  const start = `${clock.reportMonth}-01`;
  const [[dates]] = await pool.execute("SELECT LAST_DAY(?) AS monthEnd", [
    start,
  ]);
  const effectiveEnd =
    clock.today < dates.monthEnd ? clock.today : dates.monthEnd;
  const calendar = {
    calendarDays: Number(dates.monthEnd.slice(-2)),
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
       AND ar.attendance_date BETWEEN ? AND ?
     WHERE e.status = 'ACTIVE' AND e.track_attendance = TRUE GROUP BY e.id ORDER BY e.first_name, e.last_name`,
    [workingDays, workingDays, start, effectiveEnd],
  );
  return { month: clock.reportMonth, workingDays, calendar, rows };
}
