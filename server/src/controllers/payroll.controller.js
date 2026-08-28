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
  res.json({ success: true, data: await s.markPaid(req.params.id, req.body, req.user) });
}
export async function reopen(req,res){res.json({success:true,data:await s.reopen(req.params.id,req.body,req.user)})}
export async function addAdjustment(req,res){res.status(201).json({success:true,data:await s.addAdjustment(req.params.id,req.body,req.user)})}
export async function removeAdjustment(req,res){res.json({success:true,data:await s.removeAdjustment(req.params.id,req.params.adjustmentId,req.user)})}
export async function updateAdjustment(req,res){res.json({success:true,data:await s.updateAdjustment(req.params.id,req.params.adjustmentId,req.body,req.user)})}
export async function verify(req,res){res.json({success:true,data:await s.verifyPayrollCalculation(req.params.id)})}
