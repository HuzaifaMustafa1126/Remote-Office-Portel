import * as service from "../services/notification.service.js";
export async function list(req, res) {
  res.json({
    success: true,
    data: await service.getUserNotifications(req.user.id, req.validatedQuery),
  });
}
export async function unread(req, res) {
  res.json({
    success: true,
    data: { count: await service.getUnreadCount(req.user.id) },
  });
}
export async function read(req, res) {
  res.json({
    success: true,
    data: await service.markAsRead(req.params.id, req.user.id),
  });
}
export async function readAll(req, res) {
  res.json({ success: true, data: await service.markAllAsRead(req.user.id) });
}
export async function preferences(req, res) {
  res.json({ success: true, data: await service.getPreferences(req.user.id) });
}
export async function updatePreferences(req, res) {
  res.json({
    success: true,
    data: await service.updatePreferences(req.user.id, req.body),
  });
}
