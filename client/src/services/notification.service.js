import api from "./api";
export const list = (params) =>
  api.get("/notifications", { params }).then((r) => r.data.data);
export const unreadCount = () =>
  api.get("/notifications/unread-count").then((r) => r.data.data.count);
export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data.data);
export const markAllRead = () =>
  api.patch("/notifications/read-all").then((r) => r.data.data);
export const getPreferences = () =>
  api.get("/notifications/preferences").then((r) => r.data.data);
export const updatePreferences = (data) =>
  api.patch("/notifications/preferences", data).then((r) => r.data.data);
