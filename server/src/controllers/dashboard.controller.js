import { getDashboard } from "../services/dashboard.service.js";
export async function show(req, res) {
  res.json({ success: true, data: await getDashboard() });
}
