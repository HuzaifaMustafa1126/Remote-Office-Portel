import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getPayrollSettings } from "../utils/payrollPeriod.js";
import { applicableShift } from "./shift.service.js";
const salarySelect = `SELECT id,employee_id employeeId,monthly_salary monthlySalary,salary_divisor salaryDivisor,currency,effective_from effectiveFrom,effective_until effectiveUntil FROM employee_salary_profiles`;
export async function getEmployeeSettings(employeeId) {
  const [[employee]] = await pool.execute(
    "SELECT id,CONCAT(first_name,' ',last_name) name FROM employees WHERE id=?",
    [employeeId],
  );
  if (!employee) throw new ApiError(404, "Employee not found");
  const [assignments] = await pool.execute(
    `SELECT esa.id,esa.shift_id shiftId,ws.name,TIME_FORMAT(ws.start_time,'%H:%i') clockInTime,TIME_FORMAT(ws.end_time,'%H:%i') clockOutTime,ws.crosses_midnight crossesMidnight,ws.grace_minutes graceMinutes,ws.required_work_minutes requiredWorkMinutes,ws.break_allowance_minutes breakAllowanceMinutes,esa.effective_from effectiveFrom,esa.effective_to effectiveUntil FROM employee_shift_assignments esa JOIN work_shifts ws ON ws.id=esa.shift_id WHERE esa.employee_id=? ORDER BY esa.effective_from DESC`,
    [employeeId],
  );
  const [salaryHistory] = await pool.execute(
    `${salarySelect} WHERE employee_id=? ORDER BY effective_from DESC`,
    [employeeId],
  );
  const [shifts] = await pool.execute(
    "SELECT id,name,TIME_FORMAT(start_time,'%H:%i') startTime,TIME_FORMAT(end_time,'%H:%i') endTime,required_work_minutes requiredWorkMinutes,break_allowance_minutes breakAllowanceMinutes,grace_minutes graceMinutes FROM work_shifts WHERE status='ACTIVE' ORDER BY name",
  );
  const payroll = await getPayrollSettings();
  return {
    employee,
    work: assignments[0] || null,
    salary: salaryHistory[0] || null,
    workHistory: assignments,
    salaryHistory,
    shifts,
    policy: {
      weeklyOff: "Sunday",
      payrollCycle: `${payroll.cycleStartDay}th → day before next cycle`,
      currency: payroll.currency,
      defaultSalaryDivisor: payroll.defaultSalaryDivisor,
    },
  };
}
export async function saveEmployeeSettings(employeeId, data, actor) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[employee]] = await c.execute(
      "SELECT CONCAT(first_name,' ',last_name) name FROM employees WHERE id=? FOR UPDATE",
      [employeeId],
    );
    const [[shift]] = await c.execute(
      "SELECT name FROM work_shifts WHERE id=? AND status='ACTIVE'",
      [data.shiftId],
    );
    if (!employee || !shift)
      throw new ApiError(404, "Employee or shift not found");
    const [[oldSalary]] = await c.execute(
      `${salarySelect} WHERE employee_id=? AND effective_from<=? ORDER BY effective_from DESC LIMIT 1`,
      [employeeId, data.effectiveFrom],
    );
    const [[nextA]] = await c.execute(
      "SELECT effective_from FROM employee_shift_assignments WHERE employee_id=? AND effective_from>? ORDER BY effective_from LIMIT 1",
      [employeeId, data.effectiveFrom],
    );
    await c.execute(
      "UPDATE employee_shift_assignments SET effective_to=DATE_SUB(?,INTERVAL 1 DAY) WHERE employee_id=? AND effective_from<? AND(effective_to IS NULL OR effective_to>=?)",
      [data.effectiveFrom, employeeId, data.effectiveFrom, data.effectiveFrom],
    );
    await c.execute(
      "INSERT INTO employee_shift_assignments(employee_id,shift_id,effective_from,effective_to,assigned_by)VALUES(?,?,?,IF(? IS NULL,NULL,DATE_SUB(?,INTERVAL 1 DAY)),?)ON DUPLICATE KEY UPDATE shift_id=VALUES(shift_id),effective_to=VALUES(effective_to),status='ACTIVE',assigned_by=VALUES(assigned_by)",
      [
        employeeId,
        data.shiftId,
        data.effectiveFrom,
        nextA?.effective_from || null,
        nextA?.effective_from || null,
        actor.id,
      ],
    );
    const [[nextS]] = await c.execute(
      "SELECT effective_from FROM employee_salary_profiles WHERE employee_id=? AND effective_from>? ORDER BY effective_from LIMIT 1",
      [employeeId, data.effectiveFrom],
    );
    await c.execute(
      "UPDATE employee_salary_profiles SET effective_until=DATE_SUB(?,INTERVAL 1 DAY) WHERE employee_id=? AND effective_from<? AND(effective_until IS NULL OR effective_until>=?)",
      [data.effectiveFrom, employeeId, data.effectiveFrom, data.effectiveFrom],
    );
    await c.execute(
      `INSERT INTO employee_salary_profiles(employee_id,monthly_salary,salary_divisor,effective_from,effective_until,created_by)VALUES(?,?,?,?,IF(? IS NULL,NULL,DATE_SUB(?,INTERVAL 1 DAY)),?)ON DUPLICATE KEY UPDATE monthly_salary=VALUES(monthly_salary),salary_divisor=VALUES(salary_divisor),effective_until=VALUES(effective_until),created_by=VALUES(created_by)`,
      [
        employeeId,
        data.monthlySalary,
        data.salaryDivisor,
        data.effectiveFrom,
        nextS?.effective_from || null,
        nextS?.effective_from || null,
        actor.id,
      ],
    );
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'SHIFT_ASSIGNED','EMPLOYEE',?,?)",
      [
        actor.id,
        actor.employee_id,
        employeeId,
        `${shift.name} assigned to ${employee.name} effective ${data.effectiveFrom}.`,
      ],
    );
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'SALARY_UPDATED','EMPLOYEE',?,?)",
      [
        actor.id,
        actor.employee_id,
        employeeId,
        `${employee.name}'s salary changed from PKR ${oldSalary?.monthlySalary || 0} to PKR ${data.monthlySalary} effective ${data.effectiveFrom}.`,
      ],
    );
    await c.commit();
    return getEmployeeSettings(employeeId);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export { applicableShift as applicableWorkSettings };
