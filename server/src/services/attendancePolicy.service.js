import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
export async function list() {
  const [rows] = await pool.execute(
    "SELECT * FROM attendance_policies ORDER BY effective_from DESC,id DESC",
  );
  return rows;
}
export async function current(
  date = new Date().toISOString().slice(0, 10),
  executor = pool,
) {
  const [[row]] = await executor.execute(
    "SELECT * FROM attendance_policies WHERE scope_type='COMPANY' AND is_active=TRUE AND effective_from<=? AND (effective_to IS NULL OR effective_to>?) ORDER BY effective_from DESC,id DESC LIMIT 1",
    [date, date],
  );
  if (!row) throw new ApiError(500, "No attendance policy is configured");
  return row;
}
export async function save(data, actor) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    await c.execute(
      "UPDATE attendance_policies SET effective_to=? WHERE scope_type='COMPANY' AND effective_from<? AND (effective_to IS NULL OR effective_to>?)",
      [data.effective_from, data.effective_from, data.effective_from],
    );
    const [r] = await c.execute(
      `INSERT INTO attendance_policies(name,late_rule_enabled,grace_minutes,late_accumulation_enabled,late_instances_required,late_penalty_type,late_penalty_quantity,half_day_rule_enabled,half_day_after_minutes,half_day_salary_deduction_percent,count_half_day_as_late,late_counter_period,effective_from,created_by,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.name,
        ...[
          "late_rule_enabled",
          "grace_minutes",
          "late_accumulation_enabled",
          "late_instances_required",
          "late_penalty_type",
          "late_penalty_quantity",
          "half_day_rule_enabled",
          "half_day_after_minutes",
          "half_day_salary_deduction_percent",
          "count_half_day_as_late",
          "late_counter_period",
          "effective_from",
        ].map((k) => data[k]),
        actor.id,
        actor.id,
      ],
    );
    await c.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values) VALUES(?,?,?,'ATTENDANCE_POLICY',?,?,?)",
      [
        actor.id,
        actor.employee_id,
        "ATTENDANCE_POLICY_UPDATED",
        r.insertId,
        `Attendance policy effective ${data.effective_from} created.`,
        JSON.stringify(data),
      ],
    );
    await c.commit();
    return { id: r.insertId };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
