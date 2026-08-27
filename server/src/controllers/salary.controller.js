import * as s from "../services/salary.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.list() });
}
export async function mine(req, res) {
  res.json({ success: true, data: await s.mine(req.user) });
}
