import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getPayrollSettings, periodForDate } from "../utils/payrollPeriod.js";
const money = (n) => Number(Number(n || 0).toFixed(2));
async function audit(
  c,
  {
    actor,
    action,
    id,
    employeeId,
    description,
    oldValues,
    newValues,
    reason,
    run,
  },
) {
  await c.execute(
    `INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,old_values,new_values,reason,payroll_period_start,payroll_period_end)VALUES(?,?,?,'PAYROLL',?,?,CAST(? AS JSON),CAST(? AS JSON),?,?,?)`,
    [
      actor.id,
      employeeId ?? actor.employee_id,
      action,
      id,
      description,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      reason || null,
      run?.period_start || null,
      run?.period_end || null,
    ],
  );
}
export async function listPayroll() {
  const [rows] = await pool.execute(
    `SELECT pr.id,pr.period_label periodLabel,pr.period_start periodStart,pr.period_end periodEnd,pr.status,pr.review_required reviewRequired,pr.created_at createdAt,pr.approved_at approvedAt,pr.paid_at paidAt,COUNT(pi.id) employeeCount,COALESCE(SUM(pi.net_salary),0) totalNet FROM payroll_runs pr LEFT JOIN payroll_items pi ON pi.payroll_run_id=pr.id GROUP BY pr.id ORDER BY pr.period_start DESC`,
  );
  return rows;
}
export async function getPayroll(id, user, own = false) {
  const [[run]] = await pool.execute(
    `SELECT pr.id,pr.period_label periodLabel,pr.period_start periodStart,pr.period_end periodEnd,pr.status,pr.review_required reviewRequired,pr.created_at createdAt,pr.approved_at approvedAt,pr.reopened_at reopenedAt,pr.reopen_reason reopenReason,pr.paid_at paidAt,pr.payment_method paymentMethod,pr.payment_date paymentDate,pr.payment_reference paymentReference,pr.payment_note paymentNote FROM payroll_runs pr WHERE pr.id=?`,
    [id],
  );
  if (!run) throw new ApiError(404, "Payroll not found");
  const params = [id];
  if (own) params.push(user.id);
  const [items] = await pool.execute(
    `SELECT pi.*,CONCAT(e.first_name,' ',e.last_name) employeeName,e.employee_code employeeCode FROM payroll_items pi JOIN employees e ON e.id=pi.employee_id JOIN users u ON u.employee_id=e.id WHERE pi.payroll_run_id=?${own ? " AND u.id=?" : ""} ORDER BY e.first_name`,
    params,
  );
  if (own && !items.length) throw new ApiError(404, "Payroll item not found");
  let days = [],
    adjustments = [];
  const ids = items.map((x) => x.id);
  if (ids.length) {
    const q = ids.map(() => "?").join(",");
    [days] = await pool.execute(
      `SELECT d.*,pi.employee_id employeeId FROM payroll_day_details d JOIN payroll_items pi ON pi.id=d.payroll_item_id WHERE d.payroll_item_id IN(${q}) ORDER BY d.work_date`,
      ids,
    );
    [adjustments] = await pool.execute(
      `SELECT pa.id,pa.employee_id employeeId,pa.title,pa.adjustment_type type,pa.amount,pa.reason,pa.created_at createdAt,CONCAT(e.first_name,' ',e.last_name) createdBy FROM payroll_adjustments pa LEFT JOIN users u ON u.id=pa.created_by LEFT JOIN employees e ON e.id=u.employee_id WHERE pa.payroll_run_id=?${own ? " AND pa.employee_id=?" : ""} ORDER BY pa.created_at`,
      own ? [id, user.employee_id] : [id],
    );
  }
  let activity = [];
  if (!own)
    [activity] = await pool.execute(
      `SELECT a.id,a.action,a.description,a.old_values oldValues,a.new_values newValues,a.reason,a.created_at createdAt,CONCAT(e.first_name,' ',e.last_name) performedBy FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN employees e ON e.id=u.employee_id WHERE a.entity_type='PAYROLL' AND a.entity_id=? ORDER BY a.created_at`,
      [id],
    );
  return { ...run, items, days, adjustments, activity };
}
async function adj(c, runId, employeeId) {
  const [[a]] = await c.execute(
    `SELECT COALESCE(SUM(IF(adjustment_type='ALLOWANCE',amount,0)),0) allowances,COALESCE(SUM(IF(adjustment_type='DEDUCTION',amount,0)),0) manualDeductions,COALESCE(SUM(IF(adjustment_type='POSITIVE_ADJUSTMENT',amount,0)),0) positiveAdjustments,COALESCE(SUM(IF(adjustment_type='NEGATIVE_ADJUSTMENT',amount,0)),0) negativeAdjustments FROM payroll_adjustments WHERE payroll_run_id=? AND employee_id=?`,
    [runId, employeeId],
  );
  return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, money(v)]));
}
function calc(base, leave, absence, a) {
  const gross = money(base + a.allowances + a.positiveAdjustments),
    deductions = money(
      leave + absence + a.manualDeductions + a.negativeAdjustments,
    );
  return { gross, deductions, net: money(gross - deductions) };
}
async function classify(c, employeeId, date, perDay) {
  const [[cal]] = await c.execute(
      "SELECT id,day_type dayType FROM company_calendar_days WHERE calendar_date=? AND status='ACTIVE' LIMIT 1",
      [date],
    ),
    sunday = new Date(`${date}T00:00:00Z`).getUTCDay() === 0,
    off =
      cal && cal.dayType !== "WORKING_DAY"
        ? cal.dayType
        : sunday
          ? "WEEKLY_OFF"
          : null;
  if (off)
    return {
      classification: off,
      calendarId: cal?.id || null,
      deduction: 0,
      working: false,
    };
  const [[leave]] = await c.execute(
    `SELECT ld.id,ld.deduction_status deductionStatus FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=? AND ld.leave_date=? AND lr.status='APPROVED' LIMIT 1`,
    [employeeId, date],
  );
  const [[attendance]] = await c.execute(
    "SELECT id,day_status dayStatus FROM attendance_records WHERE employee_id=? AND work_date=? ORDER BY id DESC LIMIT 1",
    [employeeId, date],
  );
  if (leave) {
    const d = leave.deductionStatus === "DEDUCTIBLE";
    return {
      classification: d ? "DEDUCTIBLE_APPROVED_LEAVE" : "FREE_APPROVED_LEAVE",
      leaveId: leave.id,
      attendanceId: attendance?.id || null,
      deduction: d ? perDay : 0,
      working: true,
    };
  }
  if (
    attendance &&
    !["ABSENT", "LEAVE", "OFF_DAY"].includes(attendance.dayStatus)
  )
    return {
      classification: "PRESENT",
      attendanceId: attendance.id,
      deduction: 0,
      working: true,
    };
  return {
    classification: "UNAUTHORIZED_ABSENCE",
    attendanceId: attendance?.id || null,
    deduction: perDay,
    working: true,
  };
}
export async function generate(label, actor, recalculate = false) {
  const settings = await getPayrollSettings(),
    period = periodForDate(`${label}-04`, Number(settings.cycleStartDay)),
    c = await pool.getConnection();
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
      run = {
        id: r.insertId,
        status: "DRAFT",
        period_start: period.start,
        period_end: period.endInclusive,
      };
    } else
      await c.execute("DELETE FROM payroll_items WHERE payroll_run_id=?", [
        run.id,
      ]);
    const [employees] = await c.execute(
        "SELECT id,CONCAT(first_name,' ',last_name) name FROM employees WHERE status='ACTIVE' AND track_attendance=TRUE",
      ),
      missing = [];
    for (const e of employees) {
      const [[salary]] = await c.execute(
        "SELECT * FROM employee_salary_profiles WHERE employee_id=? AND effective_from<=? AND(effective_until IS NULL OR effective_until>=?)ORDER BY effective_from DESC LIMIT 1",
        [e.id, period.endInclusive, period.start],
      );
      const [[shift]] = await c.execute(
        "SELECT id FROM employee_shift_assignments WHERE employee_id=? AND status='ACTIVE' AND effective_from<=? AND(effective_to IS NULL OR effective_to>=?)LIMIT 1",
        [e.id, period.endInclusive, period.start],
      );
      if (!salary || !shift) {
        missing.push(e.name);
        continue;
      }
      const base = money(salary.monthly_salary),
        divisor = Number(salary.salary_divisor),
        perDay = money(base / divisor),
        rows = [];
      let working = 0,
        present = 0,
        free = 0,
        deductible = 0,
        absent = 0;
      for (
        let d = new Date(`${period.start}T00:00:00Z`),
          end = new Date(`${period.endInclusive}T00:00:00Z`);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const date = d.toISOString().slice(0, 10),
          day = await classify(c, e.id, date, perDay);
        rows.push({ date, ...day });
        if (day.working) working++;
        if (day.classification === "PRESENT") present++;
        if (day.classification === "FREE_APPROVED_LEAVE") free++;
        if (day.classification === "DEDUCTIBLE_APPROVED_LEAVE") deductible++;
        if (day.classification === "UNAUTHORIZED_ABSENCE") absent++;
      }
      const leave = money(deductible * perDay),
        absence = money(absent * perDay),
        a = await adj(c, run.id, e.id),
        t = calc(base, leave, absence, a);
      const [item] = await c.execute(
        `INSERT INTO payroll_items(payroll_run_id,employee_id,salary_profile_id,base_salary,salary_divisor,per_day_salary,working_days,present_days,free_leave_days,deductible_leave_days,absence_days,leave_deduction,absence_deduction,allowances,manual_deductions,positive_adjustments,negative_adjustments,adjustments,gross_salary,total_deductions,net_salary)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          run.id,
          e.id,
          salary.id,
          base,
          divisor,
          perDay,
          working,
          present,
          free,
          deductible,
          absent,
          leave,
          absence,
          a.allowances,
          a.manualDeductions,
          a.positiveAdjustments,
          a.negativeAdjustments,
          money(
            a.allowances +
              a.positiveAdjustments -
              a.manualDeductions -
              a.negativeAdjustments,
          ),
          t.gross,
          t.deductions,
          t.net,
        ],
      );
      for (const day of rows)
        await c.execute(
          "INSERT INTO payroll_day_details(payroll_item_id,work_date,classification,attendance_id,leave_day_id,calendar_day_id,deduction_amount)VALUES(?,?,?,?,?,?,?)",
          [
            item.insertId,
            day.date,
            day.classification,
            day.attendanceId || null,
            day.leaveId || null,
            day.calendarId || null,
            day.deduction,
          ],
        );
    }
    if (missing.length)
      throw new ApiError(
        409,
        `Payroll cannot be generated until setup is complete: ${missing.join(", ")}`,
      );
    await audit(c, {
      actor,
      action: recalculate ? "PAYROLL_RECALCULATED" : "PAYROLL_GENERATED",
      id: run.id,
      description: `${label} payroll ${recalculate ? "recalculated" : "generated"} for ${period.start} through ${period.endInclusive}.`,
      run,
    });
    await c.commit();
    return getPayroll(run.id, actor);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
async function recompute(c, runId, employeeId) {
  const [[i]] = await c.execute(
    "SELECT * FROM payroll_items WHERE payroll_run_id=? AND employee_id=? FOR UPDATE",
    [runId, employeeId],
  );
  if (!i) throw new ApiError(404, "Payroll employee not found");
  const a = await adj(c, runId, employeeId),
    t = calc(
      Number(i.base_salary),
      Number(i.leave_deduction),
      Number(i.absence_deduction),
      a,
    );
  await c.execute(
    `UPDATE payroll_items SET allowances=?,manual_deductions=?,positive_adjustments=?,negative_adjustments=?,adjustments=?,gross_salary=?,total_deductions=?,net_salary=?,calculation_status='VERIFIED' WHERE id=?`,
    [
      a.allowances,
      a.manualDeductions,
      a.positiveAdjustments,
      a.negativeAdjustments,
      money(
        a.allowances +
          a.positiveAdjustments -
          a.manualDeductions -
          a.negativeAdjustments,
      ),
      t.gross,
      t.deductions,
      t.net,
      i.id,
    ],
  );
  return { oldNet: money(i.net_salary), newNet: t.net };
}
export async function addAdjustment(runId, data, actor) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[run]] = await c.execute(
      "SELECT * FROM payroll_runs WHERE id=? FOR UPDATE",
      [runId],
    );
    if (!run) throw new ApiError(404, "Payroll not found");
    if (run.status !== "DRAFT")
      throw new ApiError(409, "Only draft payroll can be adjusted");
    const [r] = await c.execute(
      "INSERT INTO payroll_adjustments(payroll_run_id,employee_id,title,adjustment_type,amount,reason,created_by)VALUES(?,?,?,?,?,?,?)",
      [
        runId,
        data.employeeId,
        data.title,
        data.type,
        data.amount,
        data.reason,
        actor.id,
      ],
    );
    const net = await recompute(c, runId, data.employeeId);
    await audit(c, {
      actor,
      action: "PAYROLL_ADJUSTMENT_ADDED",
      id: Number(runId),
      employeeId: data.employeeId,
      description: `${data.title} (${data.type}) of PKR ${data.amount} added to payroll.`,
      newValues: data,
      reason: data.reason,
      run,
    });
    await c.commit();
    return { id: r.insertId, ...net };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function removeAdjustment(runId, adjustmentId, actor) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[run]] = await c.execute(
      "SELECT * FROM payroll_runs WHERE id=? FOR UPDATE",
      [runId],
    );
    if (!run) throw new ApiError(404, "Payroll not found");
    if (run.status !== "DRAFT")
      throw new ApiError(409, "Only draft payroll can be adjusted");
    const [[a]] = await c.execute(
      "SELECT * FROM payroll_adjustments WHERE id=? AND payroll_run_id=?",
      [adjustmentId, runId],
    );
    if (!a) throw new ApiError(404, "Adjustment not found");
    await c.execute("DELETE FROM payroll_adjustments WHERE id=?", [a.id]);
    await recompute(c, runId, a.employee_id);
    await audit(c, {
      actor,
      action: "PAYROLL_ADJUSTMENT_REMOVED",
      id: Number(runId),
      employeeId: a.employee_id,
      description: `${a.title} adjustment of PKR ${a.amount} removed from payroll.`,
      oldValues: a,
      reason: a.reason,
      run,
    });
    await c.commit();
    return { removed: true };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function updateAdjustment(runId, adjustmentId, data, actor) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[run]] = await c.execute(
      "SELECT * FROM payroll_runs WHERE id=? FOR UPDATE",
      [runId],
    );
    if (!run) throw new ApiError(404, "Payroll not found");
    if (run.status !== "DRAFT")
      throw new ApiError(409, "Only draft payroll can be adjusted");
    const [[old]] = await c.execute(
      "SELECT * FROM payroll_adjustments WHERE id=? AND payroll_run_id=?",
      [adjustmentId, runId],
    );
    if (!old) throw new ApiError(404, "Adjustment not found");
    const next = {
      title: data.title ?? old.title,
      type: data.type ?? old.adjustment_type,
      amount: data.amount ?? Number(old.amount),
      reason: data.reason ?? old.reason,
    };
    await c.execute(
      "UPDATE payroll_adjustments SET title=?,adjustment_type=?,amount=?,reason=?,updated_by=? WHERE id=?",
      [next.title, next.type, next.amount, next.reason, actor.id, old.id],
    );
    await recompute(c, runId, old.employee_id);
    await audit(c, {
      actor,
      action: "PAYROLL_ADJUSTMENT_UPDATED",
      id: Number(runId),
      employeeId: old.employee_id,
      description: `${old.title} adjustment updated from PKR ${old.amount} to PKR ${next.amount}.`,
      oldValues: old,
      newValues: next,
      reason: next.reason,
      run,
    });
    await c.commit();
    return { id: Number(adjustmentId) };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function verifyPayrollCalculation(id) {
  const [items] = await pool.execute(
    "SELECT * FROM payroll_items WHERE payroll_run_id=?",
    [id],
  );
  if (!items.length) throw new ApiError(404, "Payroll not found");
  const results = items.map((i) => {
    const expected = money(
      Number(i.base_salary) +
        Number(i.allowances) +
        Number(i.positive_adjustments) -
        Number(i.leave_deduction) -
        Number(i.absence_deduction) -
        Number(i.manual_deductions) -
        Number(i.negative_adjustments),
    );
    return {
      itemId: i.id,
      employeeId: i.employee_id,
      expectedNet: expected,
      storedNet: money(i.net_salary),
      status:
        Math.abs(expected - Number(i.net_salary)) < 0.01
          ? "VERIFIED"
          : "CALCULATION_MISMATCH",
    };
  });
  return {
    status: results.every((x) => x.status === "VERIFIED")
      ? "VERIFIED"
      : "CALCULATION_MISMATCH",
    items: results,
  };
}
async function transition(id, from, to, actor, action, x = {}) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[run]] = await c.execute(
      "SELECT * FROM payroll_runs WHERE id=? FOR UPDATE",
      [id],
    );
    if (!run) throw new ApiError(404, "Payroll not found");
    if (run.status !== from)
      throw new ApiError(409, `Payroll must be ${from.toLowerCase()}`);
    if (to === "APPROVED") {
      const v = await verifyPayrollCalculation(id);
      if (v.status !== "VERIFIED")
        throw new ApiError(409, "Payroll calculation mismatch requires review");
      await c.execute(
        "UPDATE payroll_runs SET status='APPROVED',approved_by=?,approved_at=CURRENT_TIMESTAMP,review_required=FALSE WHERE id=?",
        [actor.id, id],
      );
    } else if (to === "DRAFT")
      await c.execute(
        "UPDATE payroll_runs SET status='DRAFT',reopened_by=?,reopened_at=CURRENT_TIMESTAMP,reopen_reason=?,review_required=TRUE WHERE id=?",
        [actor.id, x.reason, id],
      );
    else
      await c.execute(
        "UPDATE payroll_runs SET status='PAID',paid_by=?,paid_at=CURRENT_TIMESTAMP,payment_method=?,payment_date=?,payment_reference=?,payment_note=? WHERE id=?",
        [
          actor.id,
          x.paymentMethod,
          x.paymentDate,
          x.paymentReference,
          x.note || null,
          id,
        ],
      );
    await audit(c, {
      actor,
      action,
      id: Number(id),
      description:
        to === "PAID"
          ? `Payroll marked paid via ${x.paymentMethod}.`
          : `Payroll changed from ${from} to ${to}.`,
      reason: x.reason,
      newValues: x,
      run,
    });
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
export const reopen = (id, data, actor) =>
  transition(id, "APPROVED", "DRAFT", actor, "PAYROLL_REOPENED", data);
export const markPaid = (id, data, actor) =>
  transition(id, "APPROVED", "PAID", actor, "PAYROLL_MARKED_PAID", data);
