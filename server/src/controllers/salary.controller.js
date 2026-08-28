import * as s from "../services/salary.service.js";
import * as accrual from "../services/salaryAccrual.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.list() });
}
export async function mine(req, res) {
  res.json({ success: true, data: await s.mine(req.user) });
}
export async function myAccrual(req, res) {
  res.json({
    success: true,
    data: await accrual.getOwnSalaryAccrual(req.user),
  });
}
export async function employeeAccrual(req, res) {
  res.json({
    success: true,
    data: await accrual.getEmployeeSalaryAccrual(req.params.id),
  });
}
