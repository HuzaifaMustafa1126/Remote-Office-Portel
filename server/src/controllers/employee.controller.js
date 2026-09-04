import * as s from "../services/employee.service.js";
import * as work from "../services/workSettings.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.listEmployees(req.query, req.user) });
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
export async function workSettings(req, res) {
  res.json({
    success: true,
    data: await work.getEmployeeSettings(req.params.id),
  });
}
export async function saveWorkSettings(req, res) {
  res.json({
    success: true,
    message: "Work and salary settings saved.",
    data: await work.saveEmployeeSettings(req.params.id, req.body, req.user),
  });
}
export async function resetPassword(req, res) {
  await s.resetEmployeePassword(req.params.id, req.body, req.user);
  res.json({ success: true, message: "Employee password reset successfully." });
}
export async function remove(req, res) {
  await s.archiveEmployee(req.params.id, req.user);
  res.json({ success: true, message: "Employee deleted successfully." });
}
export async function archived(req, res) {
  res.json({ success: true, data: await s.listArchivedEmployees() });
}
export async function restore(req, res) {
  res.json({ success: true, message: "Employee restored successfully.", data: await s.restoreEmployee(req.params.id, req.user) });
}
