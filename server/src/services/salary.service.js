import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
const select = `SELECT esp.id,esp.employee_id employeeId,CONCAT(e.first_name,' ',e.last_name) employeeName,e.employee_code employeeCode,esp.monthly_salary monthlySalary,esp.salary_divisor salaryDivisor,esp.currency,esp.effective_from effectiveFrom,esp.effective_until effectiveUntil FROM employee_salary_profiles esp JOIN employees e ON e.id=esp.employee_id`;
export async function list() {
  const [rows] = await pool.execute(
    `${select} ORDER BY e.first_name,esp.effective_from DESC`,
  );
  return rows;
}
export async function mine(user) {
  if (!user.employee_id) throw new ApiError(404, "Employee profile not found");
  const [rows] = await pool.execute(
    `${select} WHERE esp.employee_id=? ORDER BY esp.effective_from DESC`,
    [user.employee_id],
  );
  return rows;
}
