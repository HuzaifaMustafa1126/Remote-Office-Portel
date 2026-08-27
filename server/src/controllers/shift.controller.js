import * as s from "../services/shift.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.listShifts() });
}
export async function create(req, res) {
  res
    .status(201)
    .json({ success: true, data: await s.saveShift(null, req.body, req.user) });
}
export async function update(req, res) {
  res.json({
    success: true,
    data: await s.saveShift(req.params.id, req.body, req.user),
  });
}
export async function deactivate(req, res) {
  res.json({
    success: true,
    data: await s.deactivateShift(req.params.id, req.user),
  });
}
export async function assign(req, res) {
  res.json({
    success: true,
    data: await s.assignShift(req.params.employeeId, req.body, req.user),
  });
}
