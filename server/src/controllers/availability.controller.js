import * as service from "../services/availability.service.js";

export async function team(req, res) {
  res.json({ success: true, data: await service.getTeamAvailability() });
}
export async function mine(req, res) {
  res.json({ success: true, data: await service.getMyAvailability(req.user) });
}
export async function update(req, res) {
  res.json({ success: true, message: "Availability updated.", data: await service.setManualAvailability(req.body, req.user) });
}
export async function clear(req, res) {
  res.json({ success: true, message: "Availability cleared.", data: await service.clearManualAvailability(req.user) });
}
