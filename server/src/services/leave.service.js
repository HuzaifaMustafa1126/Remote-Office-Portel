import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getWorkingDays, monthKey } from "../utils/workingDay.js";
import { notifyRoles, notifyUser } from "./notification.service.js";
const base = `SELECT lr.id,lr.employee_id AS employeeId,lr.leave_type AS leaveType,lr.start_date AS startDate,lr.end_date AS endDate,lr.total_days AS totalDays,lr.reason,lr.status,lr.reviewed_by AS reviewedBy,lr.reviewed_at AS reviewedAt,lr.review_comment AS reviewComment,lr.created_at AS createdAt,CONCAT(e.first_name,' ',e.last_name) AS employeeName,e.employee_code AS employeeCode,e.department FROM leave_requests lr JOIN employees e ON e.id=lr.employee_id`;
async function tx(fn) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
async function employee(c, id) {
  const [[e]] = await c.execute(
    `SELECT id,CONCAT(first_name,' ',last_name) name,track_attendance trackAttendance FROM employees WHERE id=?`,
    [id],
  );
  if (!e) throw new ApiError(404, "Employee profile not found");
  if (!e.trackAttendance)
    throw new ApiError(403, "This account is not eligible for leave requests");
  return e;
}
async function log(c, { userId, employeeId, action, entityId, description }) {
  await c.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?, ?, ?, 'LEAVE', ?, ?)`,
    [userId, employeeId, action, entityId, description],
  );
}
export async function recalculateMonthlyLeaveDeductions(c, employeeId, month) {
  await c.execute(
    `UPDATE leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id SET ld.deduction_status='PENDING' WHERE ld.employee_id=? AND DATE_FORMAT(ld.leave_date,'%Y-%m')=? AND lr.status='APPROVED'`,
    [employeeId, month],
  );
  const [days] = await c.execute(
    `SELECT ld.id FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id LEFT JOIN company_calendar_days cd ON cd.calendar_date=ld.leave_date AND cd.status='ACTIVE' WHERE ld.employee_id=? AND DATE_FORMAT(ld.leave_date,'%Y-%m')=? AND lr.status='APPROVED' AND COALESCE(cd.day_type,IF(DAYOFWEEK(ld.leave_date)=1,'WEEKLY_OFF','WORKING_DAY'))='WORKING_DAY' ORDER BY ld.leave_date,ld.id FOR UPDATE`,
    [employeeId, month],
  );
  for (let i = 0; i < days.length; i++)
    await c.execute(
      `UPDATE leave_days SET approval_status='APPROVED',deduction_status=? WHERE id=?`,
      [i === 0 ? "FREE" : "DEDUCTIBLE", days[i].id],
    );
  return days.length;
}
async function recalcMonths(c, employeeId, dates) {
  for (const month of new Set(dates.map(monthKey)))
    await recalculateMonthlyLeaveDeductions(c, employeeId, month);
}
export async function createLeave(user, data) {
  if (data.endDate < data.startDate)
    throw new ApiError(400, "End date must be on or after start date");
  const result = await tx(async (c) => {
    const days = await getWorkingDays(data.startDate, data.endDate, c);
    if (!days.length)
      throw new ApiError(400, "The selected range contains no working days");
    const e = await employee(c, user.employee_id);
    const [[overlap]] = await c.execute(
      `SELECT id FROM leave_requests WHERE employee_id=? AND status IN ('PENDING','APPROVED') AND start_date<=? AND end_date>=? LIMIT 1 FOR UPDATE`,
      [e.id, data.endDate, data.startDate],
    );
    if (overlap)
      throw new ApiError(
        409,
        "You already have a leave request covering this date",
      );
    const [r] = await c.execute(
      `INSERT INTO leave_requests(employee_id,leave_type,start_date,end_date,total_days,reason) VALUES(?,?,?,?,?,?)`,
      [
        e.id,
        data.leaveType,
        data.startDate,
        data.endDate,
        days.length,
        data.reason,
      ],
    );
    for (const day of days)
      await c.execute(
        `INSERT INTO leave_days(leave_request_id,employee_id,leave_date) VALUES(?,?,?)`,
        [r.insertId, e.id, day],
      );
    await log(c, {
      userId: user.id,
      employeeId: e.id,
      action: "LEAVE_REQUESTED",
      entityId: r.insertId,
      description: `${e.name} requested leave from ${data.startDate} to ${data.endDate}.`,
    });
    return { id: r.insertId, totalDays: days.length, employeeName: e.name };
  });
  await notifyRoles(["CEO", "ADMIN"], {
    type: "LEAVE_REQUESTED", title: "New Leave Request",
    message: `${result.employeeName} requested ${data.leaveType.replaceAll("_", " ")} from ${data.startDate} to ${data.endDate}.`,
    referenceType: "LEAVE", referenceId: result.id, actionUrl: `/leave-requests?open=${result.id}`,
  });
  return { id: result.id, totalDays: result.totalDays };
}
export async function getMyLeaves(user) {
  const [rows] = await pool.execute(
    `${base} WHERE lr.employee_id=? ORDER BY lr.created_at DESC`,
    [user.employee_id],
  );
  return rows;
}
export async function getSummary(user) {
  const [[row]] = await pool.execute(
    `SELECT SUM(status='PENDING') pendingRequests,SUM(status='REJECTED') rejectedRequests FROM leave_requests WHERE employee_id=? AND DATE_FORMAT(start_date,'%Y-%m')=DATE_FORMAT(CURRENT_DATE,'%Y-%m')`,
    [user.employee_id],
  );
  const [[days]] = await pool.execute(
    `SELECT SUM(deduction_status IN ('FREE','DEDUCTIBLE')) approvedDays,SUM(deduction_status='FREE') freeDays,SUM(deduction_status='DEDUCTIBLE') deductibleDays FROM leave_days WHERE employee_id=? AND DATE_FORMAT(leave_date,'%Y-%m')=DATE_FORMAT(CURRENT_DATE,'%Y-%m')`,
    [user.employee_id],
  );
  return {
    pendingRequests: Number(row.pendingRequests || 0),
    rejectedRequests: Number(row.rejectedRequests || 0),
    approvedDays: Number(days.approvedDays || 0),
    freeDays: Number(days.freeDays || 0),
    deductibleDays: Number(days.deductibleDays || 0),
  };
}
export async function getLeaves(f = {}) {
  const where = ["e.track_attendance=TRUE"],
    params = [];
  if (f.search) {
    where.push(
      `(CONCAT(e.first_name,' ',e.last_name) LIKE ? OR e.employee_code LIKE ? OR lr.reason LIKE ?)`,
    );
    params.push(`%${f.search}%`, `%${f.search}%`, `%${f.search}%`);
  }
  if (f.status) {
    where.push("lr.status=?");
    params.push(f.status);
  }
  if (f.leaveType) {
    where.push("lr.leave_type=?");
    params.push(f.leaveType);
  }
  if (f.employeeId) {
    where.push("lr.employee_id=?");
    params.push(f.employeeId);
  }
  if (f.department) {
    where.push("e.department=?");
    params.push(f.department);
  }
  if (f.from) {
    where.push("lr.end_date>=?");
    params.push(f.from);
  }
  if (f.to) {
    where.push("lr.start_date<=?");
    params.push(f.to);
  }
  const [rows] = await pool.execute(
    `${base} WHERE ${where.join(" AND ")} ORDER BY FIELD(lr.status,'PENDING','APPROVED','REJECTED','CANCELLED'),lr.created_at DESC`,
    params,
  );
  const [[summary]] = await pool.execute(
    `SELECT SUM(lr.status='PENDING') pending,SUM(lr.status='APPROVED') approved,SUM(lr.status='REJECTED') rejected,COALESCE(SUM(CASE WHEN lr.status='APPROVED' THEN lr.total_days ELSE 0 END),0) approvedDays FROM leave_requests lr JOIN employees e ON e.id=lr.employee_id WHERE e.track_attendance=TRUE`,
  );
  const [[deduct]] = await pool.execute(
    `SELECT SUM(ld.deduction_status='DEDUCTIBLE') deductibleDays FROM leave_days ld JOIN employees e ON e.id=ld.employee_id WHERE e.track_attendance=TRUE`,
  );
  return {
    rows,
    summary: {
      pending: Number(summary.pending || 0),
      approved: Number(summary.approved || 0),
      rejected: Number(summary.rejected || 0),
      approvedDays: Number(summary.approvedDays || 0),
      deductibleDays: Number(deduct.deductibleDays || 0),
    },
  };
}
export async function getLeave(id) {
  const [rows] = await pool.execute(
    `${base} WHERE lr.id=? AND e.track_attendance=TRUE`,
    [id],
  );
  if (!rows[0]) throw new ApiError(404, "Leave request not found");
  const [days] = await pool.execute(
    `SELECT ld.id,ld.leave_date AS leaveDate,ld.approval_status AS approvalStatus,ld.deduction_status AS deductionStatus,ld.has_attendance_conflict AS hasAttendanceConflict,ar.status AS attendanceStatus FROM leave_days ld LEFT JOIN attendance_records ar ON ar.id=ld.attendance_id WHERE ld.leave_request_id=? ORDER BY ld.leave_date`,
    [id],
  );
  return { ...rows[0], days };
}
export async function cancelLeave(id, user) {
  return tx(async (c) => {
    const [[r]] = await c.execute(
      `SELECT lr.*,CONCAT(e.first_name,' ',e.last_name) name FROM leave_requests lr JOIN employees e ON e.id=lr.employee_id WHERE lr.id=? FOR UPDATE`,
      [id],
    );
    if (!r || r.employee_id !== user.employee_id)
      throw new ApiError(404, "Leave request not found");
    if (r.status !== "PENDING")
      throw new ApiError(409, "Only pending leave requests can be cancelled");
    await c.execute(`UPDATE leave_requests SET status='CANCELLED' WHERE id=?`, [
      id,
    ]);
    await c.execute(
      `UPDATE leave_days SET approval_status='CANCELLED',deduction_status='PENDING' WHERE leave_request_id=?`,
      [id],
    );
    await log(c, {
      userId: user.id,
      employeeId: user.employee_id,
      action: "LEAVE_CANCELLED",
      entityId: id,
      description: `${r.name} cancelled a leave request.`,
    });
    return { id, status: "CANCELLED" };
  });
}
export async function reviewLeave(id, status, comment, reviewer) {
  const result = await tx(async (c) => {
    const [[r]] = await c.execute(
      `SELECT lr.*,CONCAT(e.first_name,' ',e.last_name) name FROM leave_requests lr JOIN employees e ON e.id=lr.employee_id WHERE lr.id=? AND e.track_attendance=TRUE FOR UPDATE`,
      [id],
    );
    if (!r) throw new ApiError(404, "Leave request not found");
    if (r.status !== "PENDING")
      throw new ApiError(409, "This leave request has already been reviewed");
    const [days] = await c.execute(
      `SELECT leave_date FROM leave_days WHERE leave_request_id=? ORDER BY leave_date FOR UPDATE`,
      [id],
    );
    await c.execute(
      `UPDATE leave_requests SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_comment=? WHERE id=?`,
      [status, reviewer.id, comment || null, id],
    );
    await c.execute(
      `UPDATE leave_days SET approval_status=?,deduction_status='PENDING' WHERE leave_request_id=?`,
      [status, id],
    );
    if (status === "APPROVED") {
      await recalcMonths(
        c,
        r.employee_id,
        days.map((x) => x.leave_date),
      );
      for (const d of days) {
        const [[a]] = await c.execute(
          `SELECT id,clock_in_at FROM attendance_records WHERE employee_id=? AND attendance_date=?`,
          [r.employee_id, d.leave_date],
        );
        if (a?.clock_in_at)
          await c.execute(
            `UPDATE leave_days SET attendance_id=?,has_attendance_conflict=TRUE WHERE leave_request_id=? AND leave_date=?`,
            [a.id, id, d.leave_date],
          );
        else if (d.leave_date < new Date().toISOString().slice(0, 10)) {
          const [ar] = await c.execute(
            `INSERT INTO attendance_records(employee_id,attendance_date,clock_in_at,status,day_status) VALUES(?,?,NULL,'LEAVE','LEAVE') ON DUPLICATE KEY UPDATE day_status='LEAVE'`,
            [r.employee_id, d.leave_date],
          );
          const attendanceId = ar.insertId || a?.id;
          await c.execute(
            `UPDATE leave_days SET attendance_id=? WHERE leave_request_id=? AND leave_date=?`,
            [attendanceId, id, d.leave_date],
          );
        }
      }
    } else
      await recalcMonths(
        c,
        r.employee_id,
        days.map((x) => x.leave_date),
      );
    const action = status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED";
    await log(c, {
      userId: reviewer.id,
      employeeId: reviewer.employee_id,
      action,
      entityId: id,
      description: `Leave request for ${r.name} was ${status.toLowerCase()} by management.`,
    });
    const [[owner]] = await c.execute("SELECT id FROM users WHERE employee_id=? AND status='ACTIVE' LIMIT 1", [r.employee_id]);
    return { id, status, ownerUserId: owner?.id, startDate: r.start_date, endDate: r.end_date };
  });
  if (result.ownerUserId) {
    const rejectedReason = status === "REJECTED" && comment ? ` Reason: ${comment}` : "";
    await notifyUser({
      userId: result.ownerUserId,
      type: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
      message: `Your leave request from ${result.startDate} to ${result.endDate} has been ${status.toLowerCase()}.${rejectedReason}`,
      referenceType: "LEAVE", referenceId: Number(id), actionUrl: "/leave",
    });
  }
  return { id: result.id, status: result.status };
}
export async function getMonthlyReport({ month, employeeId }) {
  const [[m]] = await pool.execute(
    `SELECT COALESCE(?,DATE_FORMAT(CURRENT_DATE,'%Y-%m')) month`,
    [month || null],
  );
  const where = employeeId ? "AND e.id=?" : "",
    params = employeeId ? [m.month, employeeId] : [m.month];
  const [rows] = await pool.execute(
    `SELECT e.id employeeId,CONCAT(e.first_name,' ',e.last_name) employeeName,e.employee_code employeeCode,e.department,COUNT(DISTINCT CASE WHEN ld.approval_status='APPROVED' THEN ld.id END) approvedLeaveDays,SUM(ld.deduction_status='FREE') freeLeaveDays,SUM(ld.deduction_status='DEDUCTIBLE') deductibleLeaveDays,(SELECT COUNT(*) FROM attendance_records ar WHERE ar.employee_id=e.id AND DATE_FORMAT(ar.attendance_date,'%Y-%m')=? AND ar.day_status='ABSENT') unauthorizedAbsenceDays FROM employees e LEFT JOIN leave_days ld ON ld.employee_id=e.id AND DATE_FORMAT(ld.leave_date,'%Y-%m')=? WHERE e.track_attendance=TRUE ${where} GROUP BY e.id ORDER BY e.first_name`,
    [m.month, ...params],
  );
  return {
    month: m.month,
    rows: rows.map((r) => ({
      ...r,
      approvedLeaveDays: Number(r.approvedLeaveDays || 0),
      freeLeaveDays: Number(r.freeLeaveDays || 0),
      deductibleLeaveDays: Number(r.deductibleLeaveDays || 0),
      unauthorizedAbsenceDays: Number(r.unauthorizedAbsenceDays || 0),
    })),
  };
}
export async function finalizeAttendanceDay(date, actor) {
  const today = new Date().toISOString().slice(0, 10);
  if (date >= today)
    throw new ApiError(400, "Only completed previous days can be finalized");
  if (!(await getWorkingDays(date, date)).length) return { date, processed: 0 };
  return tx(async (c) => {
    const [employees] = await c.execute(
      `SELECT id FROM employees WHERE status='ACTIVE' AND track_attendance=TRUE FOR UPDATE`,
    );
    let processed = 0;
    for (const e of employees) {
      const [[attendance]] = await c.execute(
        `SELECT id,clock_in_at FROM attendance_records WHERE employee_id=? AND attendance_date=? FOR UPDATE`,
        [e.id, date],
      );
      const [[leave]] = await c.execute(
        `SELECT ld.id FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=? AND ld.leave_date=? AND lr.status='APPROVED' AND ld.deduction_status IN ('FREE','DEDUCTIBLE') LIMIT 1`,
        [e.id, date],
      );
      if (attendance?.clock_in_at) {
        if (leave)
          await c.execute(
            `UPDATE leave_days SET attendance_id=?,has_attendance_conflict=TRUE WHERE id=?`,
            [attendance.id, leave.id],
          );
        continue;
      }
      const dayStatus = leave ? "LEAVE" : "ABSENT",
        status = leave ? "LEAVE" : "ABSENT";
      if (attendance)
        await c.execute(
          `UPDATE attendance_records SET status=?,day_status=? WHERE id=?`,
          [status, dayStatus, attendance.id],
        );
      else
        await c.execute(
          `INSERT INTO attendance_records(employee_id,attendance_date,clock_in_at,status,day_status) VALUES(?,?,NULL,?,?)`,
          [e.id, date, status, dayStatus],
        );
      if (leave) {
        const [[ar]] = await c.execute(
          `SELECT id FROM attendance_records WHERE employee_id=? AND attendance_date=?`,
          [e.id, date],
        );
        await c.execute(`UPDATE leave_days SET attendance_id=? WHERE id=?`, [
          ar.id,
          leave.id,
        ]);
      }
      processed++;
    }
    await log(c, {
      userId: actor.id,
      employeeId: actor.employee_id,
      action: "ATTENDANCE_UPDATED",
      entityId: null,
      description: `Attendance for ${date} was finalized.`,
    });
    return { date, processed };
  });
}
