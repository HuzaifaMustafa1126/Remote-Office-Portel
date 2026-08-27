import * as s from "../services/payroll.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.listPayroll() });
}
export async function get(req, res) {
  res.json({
    success: true,
    data: await s.getPayroll(req.params.id, req.user),
  });
}
export async function mine(req, res) {
  res.json({
    success: true,
    data: await s.getPayroll(req.params.id, req.user, true),
  });
}
export async function generate(req, res) {
  res
    .status(201)
    .json({ success: true, data: await s.generate(req.body.label, req.user) });
}
export async function recalculate(req, res) {
  res.json({
    success: true,
    data: await s.generate(req.body.label, req.user, true),
  });
}
export async function approve(req, res) {
  res.json({ success: true, data: await s.approve(req.params.id, req.user) });
}
export async function paid(req, res) {
  res.json({ success: true, data: await s.markPaid(req.params.id, req.user) });
}
