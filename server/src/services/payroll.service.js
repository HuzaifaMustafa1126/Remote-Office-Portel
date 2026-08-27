import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getPayrollSettings, periodForDate } from "../utils/payrollPeriod.js";
import { getWorkingDays } from "../utils/workingDay.js";
export async function listPayroll() {
  const [rows] = await pool.execute(
    "SELECT id,period_label periodLabel,period_start periodStart,period_end periodEnd,status,review_required reviewRequired,created_at createdAt,approved_at approvedAt,paid_at paidAt FROM payroll_runs ORDER BY period_start DESC",
  );
  return rows;
}
export async function getPayroll(id, user, own = false) {
  const params = [id],
    ownSql = own ? "AND u.id=?" : "";
  if (own) params.push(user.id);
  const [[run]] = await pool.execute(
    "SELECT id,period_label periodLabel,period_start periodStart,period_end periodEnd,status,created_at createdAt FROM payroll_runs WHERE id=?",
    [id],
  );
  if (!run) throw new ApiError(404, "Payroll not found");
  const [items] = await pool.execute(
    `SELECT pi.*,CONCAT(e.first_name,' ',e.last_name) employeeName,e.employee_code employeeCode FROM payroll_items pi JOIN employees e ON e.id=pi.employee_id JOIN users u ON u.employee_id=e.id WHERE pi.payroll_run_id=? ${ownSql} ORDER BY e.first_name`,
    params,
  );
  return { ...run, items };
}
export async function generate(label, actor, recalculate = false) {
  const settings = await getPayrollSettings(),
    period = periodForDate(`${label}-04`, Number(settings.cycleStartDay)),
    days = await getWorkingDays(period.start, period.endInclusive);
  const [missing] = await pool.execute(
    `SELECT CONCAT(e.first_name," ",e.last_name) name,NOT EXISTS(SELECT 1 FROM employee_shift_assignments esa WHERE esa.employee_id=e.id AND esa.status="ACTIVE" AND esa.effective_from<=? AND(esa.effective_to IS NULL OR esa.effective_to>=?)) missingShift,NOT EXISTS(SELECT 1 FROM employee_salary_profiles esp WHERE esp.employee_id=e.id AND esp.effective_from<=? AND(esp.effective_until IS NULL OR esp.effective_until>=?)) missingSalary FROM employees e WHERE e.status="ACTIVE" AND e.track_attendance=TRUE HAVING missingShift OR missingSalary`,
    [period.endInclusive, period.start, period.endInclusive, period.start],
  );
  if (missing.length)
    throw new ApiError(
      409,
      `Payroll cannot be generated until employee setup is complete: `,
    );
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    let [[run]] = await c.execute(
      "SELECT * FROM payroll_runs WHERE period_start=? AND period_end=? FOR UPDATE",
      [period.start, period.endInclusive],
    );
    if (run && run.status !== "DRAFT")
      throw new ApiError(409, "Approved or paid payroll is locked");
    if (!run) {
      const [r] = await c.execute(
        "INSERT INTO payroll_runs(period_label,period_start,period_end,generated_by)VALUES(?,?,?,?)",
        [label, period.start, period.endInclusive, actor.id],
      );
      run = { id: r.insertId, status: "DRAFT" };
    } else
      await c.execute("DELETE FROM payroll_items WHERE payroll_run_id=?", [
        run.id,
      ]);
    const [employees] = await c.execute(
      "SELECT id FROM employees WHERE status='ACTIVE' AND track_attendance=TRUE",
    );
    for (const e of employees) {
      const [[salary]] = await c.execute(
        "SELECT * FROM employee_salary_profiles WHERE employee_id=? AND effective_from<=? AND(effective_until IS NULL OR effective_until>=?)ORDER BY effective_from DESC LIMIT 1",
        [e.id, period.endInclusive, period.start],
      );
      if (!salary) continue;
      const [[a]] = await c.execute(
        "SELECT SUM(day_status='PRESENT') present,SUM(day_status='ABSENT') absent FROM attendance_records WHERE employee_id=? AND work_date>=? AND work_date<?",
        [e.id, period.start, period.endExclusive],
      );
      const [[l]] = await c.execute(
        "SELECT SUM(deduction_status='FREE') freeDays,SUM(deduction_status='DEDUCTIBLE') deductibleDays FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=? AND ld.leave_date>=? AND ld.leave_date<? AND lr.status='APPROVED'",
        [e.id, period.start, period.endExclusive],
      );
      const divisor = Number(salary.salary_divisor),
        base = Number(salary.monthly_salary),
        perDay = base / divisor,
        leaveDays = Number(l.deductibleDays || 0),
        absence = Number(a.absent || 0),
        leaveDeduction = perDay * leaveDays,
        absenceDeduction = perDay * absence,
        net = base - leaveDeduction - absenceDeduction;
      await c.execute(
        `INSERT INTO payroll_items(payroll_run_id,employee_id,salary_profile_id,base_salary,salary_divisor,working_days,present_days,free_leave_days,deductible_leave_days,absence_days,leave_deduction,absence_deduction,net_salary)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          run.id,
          e.id,
          salary.id,
          base,
          divisor,
          days.length,
          Number(a.present || 0),
          Number(l.freeDays || 0),
          leaveDays,
          absence,
          leaveDeduction,
          absenceDeduction,
          net,
        ],
      );
    }
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,?,'PAYROLL',?,?)",
      [
        actor.id,
        actor.employee_id,
        recalculate ? "PAYROLL_RECALCULATED" : "PAYROLL_GENERATED",
        run.id,
        `${label} payroll ${recalculate ? "recalculated" : "generated"} for ${period.start} through ${period.endInclusive}.`,
      ],
    );
    await c.commit();
    return getPayroll(run.id, actor);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
async function transition(id, from, to, actor, action) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [r] = await c.execute(
      `UPDATE payroll_runs SET status=?,${to === "APPROVED" ? "approved_by=?,approved_at=CURRENT_TIMESTAMP" : "paid_by=?,paid_at=CURRENT_TIMESTAMP"} WHERE id=? AND status=?`,
      [to, actor.id, id, from],
    );
    if (!r.affectedRows)
      throw new ApiError(409, `Payroll must be ${from.toLowerCase()}`);
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,?,'PAYROLL',?,'Payroll status changed.')",
      [actor.id, actor.employee_id, action, id],
    );
    await c.commit();
    return { id: Number(id), status: to };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export const approve = (id, actor) =>
  transition(id, "DRAFT", "APPROVED", actor, "PAYROLL_APPROVED");
export const markPaid = (id, actor) =>
  transition(id, "APPROVED", "PAID", actor, "PAYROLL_MARKED_PAID");
