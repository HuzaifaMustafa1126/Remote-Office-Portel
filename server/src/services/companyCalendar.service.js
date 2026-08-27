import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getCompanyDayStatus } from "../utils/workingDay.js";
import { recalculatePayrollPeriodsForDates } from "./leave.service.js";
async function reconcile(c, dates) {
  const employees = new Set();
  for (const date of dates) {
    const [rows] = await c.execute(
      `SELECT DISTINCT employee_id FROM leave_days WHERE leave_date=?`,
      [date],
    );
    rows.forEach((r) => employees.add(r.employee_id));
    const day = await getCompanyDayStatus(date, c);
    if (!day.isWorkingDay)
      await c.execute(
        `UPDATE attendance_records SET status=IF(clock_in_at IS NULL,'OFF_DAY','WORKED_HOLIDAY'),day_status=IF(clock_in_at IS NULL,'OFF_DAY','WORKED_HOLIDAY') WHERE work_date=?`,
        [date],
      );
  }
  for (const employeeId of employees)
    await recalculatePayrollPeriodsForDates(c,employeeId,dates);
  for(const date of dates) await c.execute("UPDATE payroll_runs SET review_required=TRUE WHERE status IN ('APPROVED','PAID') AND ?>=period_start AND ?<=period_end",[date,date]);
  const [requests] = await c.execute(
    `SELECT DISTINCT leave_request_id id FROM leave_days WHERE leave_date IN (${dates.map(() => "?").join(",")})`,
    dates,
  );
  for (const r of requests)
    await c.execute(
      `UPDATE leave_requests lr SET total_days=(SELECT COUNT(*) FROM leave_days ld WHERE ld.leave_request_id=lr.id AND ld.deduction_status IN ('FREE','DEDUCTIBLE')) WHERE lr.id=?`,
      [r.id],
    );
}
async function transaction(fn) {
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
export async function listDays(f = {}) {
  const [rows] = await pool.execute(
    `SELECT id,calendar_date calendarDate,day_type dayType,title,description,status,created_at createdAt,updated_at updatedAt FROM company_calendar_days WHERE (? IS NULL OR calendar_date>=?) AND (? IS NULL OR calendar_date<=?) AND (? IS NULL OR status=?) ORDER BY calendar_date`,
    [
      f.from || null,
      f.from || null,
      f.to || null,
      f.to || null,
      f.status || null,
      f.status || null,
    ],
  );
  return rows;
}
export async function getUpcoming() {
  const [rows] = await pool.execute(
    `SELECT id,calendar_date calendarDate,day_type dayType,title,description FROM company_calendar_days WHERE status='ACTIVE' AND day_type<>'WORKING_DAY' AND calendar_date>=CURRENT_DATE ORDER BY calendar_date LIMIT 6`,
  );
  return rows;
}
export const getDay = (date) => getCompanyDayStatus(date);
export async function createDays(data, user) {
  if (data.endDate < data.startDate)
    throw new ApiError(400, "End date must be on or after start date");
  const dates = [],
    cursor = new Date(`${data.startDate}T00:00:00Z`),
    end = new Date(`${data.endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return transaction(async (c) => {
    for (const date of dates)
      await c.execute(
        `INSERT INTO company_calendar_days(calendar_date,day_type,title,description,created_by,status) VALUES(?,?,?,?,?,'ACTIVE') ON DUPLICATE KEY UPDATE day_type=VALUES(day_type),title=VALUES(title),description=VALUES(description),created_by=VALUES(created_by),status='ACTIVE'`,
        [date, data.dayType, data.title, data.description || null, user.id],
      );
    await reconcile(c, dates);
    const action =
      data.dayType === "SPECIAL_OFF_DAY"
        ? "SPECIAL_OFF_DAY_CREATED"
        : "HOLIDAY_CREATED";
    await c.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,description) VALUES(?,?,?,'COMPANY_CALENDAR',?)`,
      [
        user.id,
        user.employee_id,
        action,
        `${data.title} was added to the company calendar from ${data.startDate} to ${data.endDate}.`,
      ],
    );
    return { datesCreated: dates.length };
  });
}
export async function updateDay(id, data, user) {
  return transaction(async (c) => {
    const [[old]] = await c.execute(
      `SELECT calendar_date FROM company_calendar_days WHERE id=? FOR UPDATE`,
      [id],
    );
    if (!old) throw new ApiError(404, "Calendar day not found");
    await c.execute(
      `UPDATE company_calendar_days SET calendar_date=?,day_type=?,title=?,description=?,status='ACTIVE' WHERE id=?`,
      [
        data.calendarDate,
        data.dayType,
        data.title,
        data.description || null,
        id,
      ],
    );
    await reconcile(c, [old.calendar_date, data.calendarDate]);
    await c.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,'HOLIDAY_UPDATED','COMPANY_CALENDAR',?,?)`,
      [
        user.id,
        user.employee_id,
        id,
        `${data.title} was updated in the company calendar.`,
      ],
    );
    return { id };
  });
}
export async function cancelDay(id, user) {
  return transaction(async (c) => {
    const [[row]] = await c.execute(
      `SELECT calendar_date,title FROM company_calendar_days WHERE id=? FOR UPDATE`,
      [id],
    );
    if (!row) throw new ApiError(404, "Calendar day not found");
    await c.execute(
      `UPDATE company_calendar_days SET status='CANCELLED' WHERE id=?`,
      [id],
    );
    await reconcile(c, [row.calendar_date]);
    await c.execute(
      `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',?,?)`,
      [
        user.id,
        user.employee_id,
        id,
        `${row.title} was cancelled in the company calendar.`,
      ],
    );
    return { id, status: "CANCELLED" };
  });
}
