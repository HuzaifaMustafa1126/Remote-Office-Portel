import * as s from "../services/companyCalendar.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await s.listDays(req.validatedQuery) });
}
export async function upcoming(req, res) {
  res.json({ success: true, data: await s.getUpcoming() });
}
export async function day(req, res) {
  res.json({ success: true, data: await s.getDay(req.params.date) });
}
export async function create(req, res) {
  res.status(201).json({
    success: true,
    message: "Company calendar updated successfully.",
    data: await s.createDays(req.body, req.user),
  });
}
export async function update(req, res) {
  res.json({
    success: true,
    message: "Calendar day updated successfully.",
    data: await s.updateDay(req.params.id, req.body, req.user),
  });
}
export async function cancel(req, res) {
  res.json({
    success: true,
    message: "Calendar day cancelled successfully.",
    data: await s.cancelDay(req.params.id, req.user),
  });
}
