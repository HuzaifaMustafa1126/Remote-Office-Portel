import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
const select = `SELECT ws.id,ws.name,TIME_FORMAT(ws.start_time,'%H:%i') startTime,TIME_FORMAT(ws.end_time,'%H:%i') endTime,ws.crosses_midnight crossesMidnight,ws.shift_span_minutes shiftSpanMinutes,ws.required_work_minutes requiredWorkMinutes,ws.break_allowance_minutes breakAllowanceMinutes,ws.grace_minutes graceMinutes,ws.status,COUNT(esa.id) assignedEmployees,GROUP_CONCAT(CONCAT(e.first_name,' ',e.last_name) ORDER BY e.first_name SEPARATOR ', ') assignedEmployeeNames FROM work_shifts ws LEFT JOIN employee_shift_assignments esa ON esa.shift_id=ws.id AND esa.status='ACTIVE' AND esa.effective_from<=CURRENT_DATE AND (esa.effective_to IS NULL OR esa.effective_to>=CURRENT_DATE) LEFT JOIN employees e ON e.id=esa.employee_id`;
const span = (start, end) => {
  const [a, b] = start.split(":").map(Number),
    [c, d] = end.split(":").map(Number);
  let n = c * 60 + d - a * 60 - b;
  if (n <= 0) n += 1440;
  return n;
};
export async function listShifts() {
  const [rows] = await pool.execute(
    `${select} GROUP BY ws.id ORDER BY ws.status,ws.name`,
  );
  return rows;
}
export async function saveShift(id, data, actor) {
  const shiftSpan = span(data.startTime, data.endTime);
  if (data.requiredWorkMinutes + data.breakAllowanceMinutes > shiftSpan)
    throw new ApiError(
      400,
      "Required work plus break allowance cannot exceed shift span",
    );
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    let shiftId = id;
    if (id) {
      const [[old]] = await c.execute(
        "SELECT * FROM work_shifts WHERE id=? FOR UPDATE",
        [id],
      );
      if (!old) throw new ApiError(404, "Shift not found");
      await c.execute(
        "UPDATE work_shifts SET name=?,start_time=?,end_time=?,crosses_midnight=?,shift_span_minutes=?,required_work_minutes=?,break_allowance_minutes=?,grace_minutes=? WHERE id=?",
        [
          data.name,
          data.startTime,
          data.endTime,
          data.endTime <= data.startTime,
          shiftSpan,
          data.requiredWorkMinutes,
          data.breakAllowanceMinutes,
          data.graceMinutes,
          id,
        ],
      );
    } else {
      const [r] = await c.execute(
        "INSERT INTO work_shifts(name,start_time,end_time,crosses_midnight,shift_span_minutes,required_work_minutes,break_allowance_minutes,grace_minutes,created_by) VALUES(?,?,?,?,?,?,?,?,?)",
        [
          data.name,
          data.startTime,
          data.endTime,
          data.endTime <= data.startTime,
          shiftSpan,
          data.requiredWorkMinutes,
          data.breakAllowanceMinutes,
          data.graceMinutes,
          actor.id,
        ],
      );
      shiftId = r.insertId;
    }
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,?,'SHIFT',?,?)",
      [
        actor.id,
        actor.employee_id,
        id ? "SHIFT_UPDATED" : "SHIFT_CREATED",
        shiftId,
        `${data.name} was ${id ? "updated" : "created"}.`,
      ],
    );
    await c.commit();
    return { id: shiftId };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function deactivateShift(id, actor) {
  const [[assigned]] = await pool.execute(
    "SELECT COUNT(*) count FROM employee_shift_assignments WHERE shift_id=? AND status='ACTIVE' AND effective_from<=CURRENT_DATE AND(effective_to IS NULL OR effective_to>=CURRENT_DATE)",
    [id],
  );
  if (Number(assigned.count))
    throw new ApiError(
      409,
      `This shift is currently assigned to ${assigned.count} employees. Assign replacement schedules before deactivation.`,
    );
  const [r] = await pool.execute(
    "UPDATE work_shifts SET status='INACTIVE',is_default=FALSE WHERE id=?",
    [id],
  );
  if (!r.affectedRows) throw new ApiError(404, "Shift not found");
  await pool.execute(
    "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,'SHIFT_DEACTIVATED','SHIFT',?,'Shift template was deactivated.')",
    [actor.id, actor.employee_id, id],
  );
  return { id: Number(id), status: "INACTIVE" };
}
export async function assignShift(employeeId, data, actor) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[e]] = await c.execute(
      "SELECT CONCAT(first_name,' ',last_name) name FROM employees WHERE id=? FOR UPDATE",
      [employeeId],
    );
    const [[s]] = await c.execute(
      "SELECT name FROM work_shifts WHERE id=? AND status='ACTIVE'",
      [data.shiftId],
    );
    if (!e || !s) throw new ApiError(404, "Employee or active shift not found");
    const [[next]] = await c.execute(
      "SELECT effective_from FROM employee_shift_assignments WHERE employee_id=? AND effective_from>? ORDER BY effective_from LIMIT 1",
      [employeeId, data.effectiveFrom],
    );
    await c.execute(
      "UPDATE employee_shift_assignments SET effective_to=DATE_SUB(?,INTERVAL 1 DAY) WHERE employee_id=? AND effective_from<? AND (effective_to IS NULL OR effective_to>=?)",
      [data.effectiveFrom, employeeId, data.effectiveFrom, data.effectiveFrom],
    );
    await c.execute(
      "INSERT INTO employee_shift_assignments(employee_id,shift_id,effective_from,effective_to,assigned_by) VALUES(?,?,?,IF(? IS NULL,NULL,DATE_SUB(?,INTERVAL 1 DAY)),?) ON DUPLICATE KEY UPDATE shift_id=VALUES(shift_id),effective_to=VALUES(effective_to),status='ACTIVE',assigned_by=VALUES(assigned_by)",
      [
        employeeId,
        data.shiftId,
        data.effectiveFrom,
        next?.effective_from || null,
        next?.effective_from || null,
        actor.id,
      ],
    );
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,'SHIFT_ASSIGNED','EMPLOYEE',?,?)",
      [
        actor.id,
        actor.employee_id,
        employeeId,
        `${s.name} assigned to ${e.name} effective ${data.effectiveFrom}.`,
      ],
    );
    await c.commit();
    return { employeeId: Number(employeeId), shiftId: data.shiftId };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function applicableShift(employeeId, date, executor = pool) {
  const [[row]] = await executor.execute(
    `SELECT ws.id,ws.name,TIME_FORMAT(ws.start_time,'%H:%i') clockInTime,TIME_FORMAT(ws.end_time,'%H:%i') clockOutTime,ws.crosses_midnight crossesMidnight,ws.grace_minutes graceMinutes,ws.required_work_minutes requiredWorkMinutes,ws.break_allowance_minutes breakAllowanceMinutes,esa.effective_from effectiveFrom,esa.effective_to effectiveUntil FROM employee_shift_assignments esa JOIN work_shifts ws ON ws.id=esa.shift_id WHERE esa.employee_id=? AND esa.status='ACTIVE' AND esa.effective_from<=? AND (esa.effective_to IS NULL OR esa.effective_to>=?) ORDER BY esa.effective_from DESC LIMIT 1`,
    [employeeId, date, date],
  );
  return row || null;
}
