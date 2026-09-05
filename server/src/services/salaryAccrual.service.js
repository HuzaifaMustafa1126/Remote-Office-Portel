import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { payrollPeriodForDate } from "../utils/payrollPeriod.js";
const n = (v) => Number(v || 0),
  money = (v) => Number(n(v).toFixed(2));
const iso = (d) => d.toISOString().slice(0, 10);
export async function getEmployeeSalaryAccrual(
  employeeId,
  value = iso(new Date()),
  executor = pool,
) {
  const period = await payrollPeriodForDate(value, executor),
    today = value;
  const [[employee]] = await executor.execute(
    "SELECT id,CONCAT(first_name,' ',last_name) employeeName,employee_code employeeCode,department FROM employees WHERE id=? AND status='ACTIVE'",
    [employeeId],
  );
  if (!employee) throw new ApiError(404, "Employee not found");
  const [[salary]] = await executor.execute(
    "SELECT id,monthly_salary monthlySalary,salary_divisor salaryDivisor,currency,effective_from effectiveFrom FROM employee_salary_profiles WHERE employee_id=? AND effective_from<=? AND(effective_until IS NULL OR effective_until>=?)ORDER BY effective_from DESC LIMIT 1",
    [employeeId, today, today],
  );
  if (!salary) throw new ApiError(404, "Salary profile is not configured");
  const base = money(salary.monthlySalary),
    dailyRate = money(base / n(salary.salaryDivisor));
  const [[payroll]] = await executor.execute(
    `SELECT pr.id,pr.status,pr.payment_date paymentDate,pi.id itemId,pi.net_salary netSalary,pi.allowances,pi.manual_deductions manualDeductions,pi.positive_adjustments positiveAdjustments,pi.negative_adjustments negativeAdjustments FROM payroll_runs pr JOIN payroll_items pi ON pi.payroll_run_id=pr.id WHERE pi.employee_id=? AND pr.period_start=? AND pr.period_end=? LIMIT 1`,
    [employeeId, period.start, period.endInclusive],
  );
  const [adjustments] = payroll
    ? await executor.execute(
        "SELECT id,title,adjustment_type type,amount,reason FROM payroll_adjustments WHERE payroll_run_id=? AND employee_id=? ORDER BY created_at",
        [payroll.id, employeeId],
      )
    : [[]];
  const ledger = [];
  let presentDays = 0,
    paidOffDays = 0,
    freeLeaveDays = 0,
    deductibleLeaveDays = 0,
    unauthorizedAbsenceDays = 0,
    validPaidDays = 0,
    processedDays = 0,
    lateDays = 0,
    shortMinutes = 0,
    extraMinutes = 0;
  const last = today < period.endInclusive ? today : period.endInclusive;
  for (
    let cursor = new Date(`${period.start}T00:00:00Z`),
      end = new Date(`${last}T00:00:00Z`);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = iso(cursor);
    const [[calendar]] = await executor.execute(
      "SELECT id,day_type dayType,title FROM company_calendar_days WHERE calendar_date=? AND status='ACTIVE' LIMIT 1",
      [date],
    );
    const sunday = cursor.getUTCDay() === 0,
      off =
        calendar
          ? calendar.dayType === "WORKING_DAY" ? null : calendar.dayType
          : sunday
            ? "WEEKLY_OFF"
            : null;
    if (off) {
      paidOffDays++;
      validPaidDays++;
      processedDays++;
      ledger.push({
        date,
        classification: off,
        label: calendar?.title || "Sunday / Weekly Off",
        earned: dailyRate,
        deduction: 0,
        isOffDay: true,
        source: { calendarId: calendar?.id || null },
      });
      continue;
    }
    const [[leave]] = await executor.execute(
      `SELECT ld.id,ld.deduction_status deductionStatus FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=? AND ld.leave_date=? AND lr.status='APPROVED' LIMIT 1`,
      [employeeId, date],
    );
    const [[attendance]] = await executor.execute(
      "SELECT id,status,day_status dayStatus,late_minutes lateMinutes,short_minutes shortMinutes,extra_minutes extraMinutes FROM attendance_records WHERE employee_id=? AND work_date=? ORDER BY id DESC LIMIT 1",
      [employeeId, date],
    );
    if (leave) {
      const deductible = leave.deductionStatus === "DEDUCTIBLE";
      deductible ? deductibleLeaveDays++ : freeLeaveDays++;
      processedDays++;
      if (!deductible) validPaidDays++;
      ledger.push({
        date,
        classification: deductible
          ? "DEDUCTIBLE_APPROVED_LEAVE"
          : "FREE_APPROVED_LEAVE",
        label: deductible
          ? "Approved Leave — Deductible"
          : "Approved Leave — Free",
        earned: deductible ? 0 : dailyRate,
        deduction: deductible ? dailyRate : 0,
        source: { leaveDayId: leave.id, attendanceId: attendance?.id || null },
      });
      continue;
    }
    const valid =
      attendance &&
      !["ABSENT", "LEAVE", "OFF_DAY"].includes(attendance.dayStatus) &&
      (date < today || attendance.status === "CLOCKED_OUT");
    if (valid) {
      presentDays++;
      validPaidDays++;
      processedDays++;
      if (n(attendance.lateMinutes) > 0) lateDays++;
      shortMinutes += n(attendance.shortMinutes);
      extraMinutes += n(attendance.extraMinutes);
      ledger.push({
        date,
        classification: "PRESENT",
        label: "Present",
        earned: dailyRate,
        deduction: 0,
        source: { attendanceId: attendance.id },
      });
      continue;
    }
    if (date === today) {
      const [[shift]] = await executor.execute(
        `SELECT ws.end_time endTime,ws.crosses_midnight crossesMidnight,(NOW()<TIMESTAMP(DATE_ADD(?,INTERVAL ws.crosses_midnight DAY),ws.end_time)) inProgress FROM employee_shift_assignments esa JOIN work_shifts ws ON ws.id=esa.shift_id WHERE esa.employee_id=? AND esa.status='ACTIVE' AND esa.effective_from<=? AND(esa.effective_to IS NULL OR esa.effective_to>=?)ORDER BY esa.effective_from DESC LIMIT 1`,
        [date, employeeId, date, date],
      );
      if (!shift || shift.inProgress) {
        ledger.push({
          date,
          classification: "SHIFT_IN_PROGRESS",
          label: "Shift In Progress",
          earned: null,
          deduction: null,
          pending: true,
          source: { attendanceId: attendance?.id || null },
        });
        continue;
      }
    }
    unauthorizedAbsenceDays++;
    processedDays++;
    ledger.push({
      date,
      classification: "UNAUTHORIZED_ABSENCE",
      label: "Unauthorized Absence",
      earned: 0,
      deduction: dailyRate,
      source: { attendanceId: attendance?.id || null },
    });
  }
  const earnedSoFar = money(validPaidDays * dailyRate),
    knownLeaveDeduction = money(deductibleLeaveDays * dailyRate),
    knownAbsenceDeduction = money(unauthorizedAbsenceDays * dailyRate),
    knownDeductions = money(knownLeaveDeduction + knownAbsenceDeduction);
  const positive = money(
      adjustments
        .filter((x) => ["ALLOWANCE", "POSITIVE_ADJUSTMENT"].includes(x.type))
        .reduce((s, x) => s + n(x.amount), 0),
    ),
    negative = money(
      adjustments
        .filter((x) => ["DEDUCTION", "NEGATIVE_ADJUSTMENT"].includes(x.type))
        .reduce((s, x) => s + n(x.amount), 0),
    );
  const estimatedRemaining = money(
      Math.max(0, base - knownDeductions - earnedSoFar),
    ),
    estimatedNet = money(base - knownDeductions + positive - negative),
    finalized = ["APPROVED", "PAID"].includes(payroll?.status);
  return {
    ...employee,
    period: { start: period.start, end: period.endInclusive },
    payrollStatus: payroll?.status || "LIVE_ESTIMATE",
    isFinal: finalized,
    paymentDate: payroll?.paymentDate || null,
    monthlySalary: base,
    salaryDivisor: n(salary.salaryDivisor),
    dailyRate,
    earnedSoFar,
    estimatedRemaining,
    knownDeductions,
    knownLeaveDeduction,
    knownAbsenceDeduction,
    projectedNet: finalized ? money(payroll.netSalary) : estimatedNet,
    validPaidDays,
    processedDays,
    presentDays,
    paidOffDays,
    freeLeaveDays,
    deductibleLeaveDays,
    unauthorizedAbsenceDays,
    lateDays,
    shortMinutes,
    extraMinutes,
    adjustments,
    dailyBreakdown: ledger,
    policy: {
      lateDeductionEnabled: false,
      shortHoursDeductionEnabled: false,
      overtimePaymentEnabled: false,
    },
  };
}
export async function getOwnSalaryAccrual(user) {
  if (!user.employee_id) throw new ApiError(404, "Employee profile not found");
  return getEmployeeSalaryAccrual(user.employee_id);
}
