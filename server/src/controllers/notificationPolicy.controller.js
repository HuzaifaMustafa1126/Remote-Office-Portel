import * as s from "../services/notificationPolicy.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.list() });
}
export async function update(req, res) {
  res.json({ success: true, data: await s.update(req.body, req.user) });
}
