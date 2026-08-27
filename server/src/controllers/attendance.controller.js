import * as service from "../services/attendance.service.js";

const send = (message) => async (req, res) =>
  res.json({
    success: true,
    message,
    data: await service[messageMap[message]](req.user),
  });
const messageMap = {
  "Clocked in successfully.": "clockIn",
  "Break started.": "startBreak",
  "Break ended.": "endBreak",
  "Clocked out successfully.": "clockOut",
};

export const clockIn = send("Clocked in successfully.");
export const startBreak = send("Break started.");
export const endBreak = send("Break ended.");
export const clockOut = send("Clocked out successfully.");
export async function today(req, res) {
  res.json({ success: true, data: await service.getToday(req.user) });
}
export async function history(req, res) {
  res.json({
    success: true,
    data: await service.getHistory(req.user, req.validatedQuery),
  });
}
export async function list(req, res) {
  res.json({
    success: true,
    data: await service.getAttendance(req.validatedQuery),
  });
}
export async function live(req, res) {
  res.json({ success: true, data: await service.getLiveOffice() });
}
export async function activity(req, res) {
  res.json({ success: true, data: await service.getActivity() });
}
export async function daily(req, res) {
  res.json({
    success: true,
    data: await service.getDailyReport(req.validatedQuery.date),
  });
}
export async function monthly(req, res) {
  res.json({
    success: true,
    data: await service.getMonthlyReport(req.validatedQuery.month),
  });
}
