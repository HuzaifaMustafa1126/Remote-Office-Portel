import * as s from "../services/employee.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.listEmployees(req.query) });
}
export async function get(req, res) {
  res.json({ success: true, data: await s.getEmployee(req.params.id) });
}
export async function create(req, res) {
  res.status(201).json({
    success: true,
    message: "Employee created successfully",
    data: await s.createEmployee(req.body, req.user),
  });
}
export async function update(req, res) {
  res.json({
    success: true,
    message: "Employee updated successfully",
    data: await s.updateEmployee(req.params.id, req.body, req.user),
  });
}
export async function status(req, res) {
  res.json({
    success: true,
    message: `Employee ${req.body.status === "ACTIVE" ? "activated" : "deactivated"} successfully`,
    data: await s.setEmployeeStatus(req.params.id, req.body.status, req.user),
  });
}
export async function role(req, res) {
  res.json({
    success: true,
    message: "Role assigned successfully",
    data: await s.assignRole(req.params.id, req.body.roleId, req.user),
  });
}
