import api from "./api";
export const listScheduledWork = (params = {}) =>
  api.get("/scheduled-work", { params }).then((r) => r.data.data);
export const todayScheduledWork = (params = {}) =>
  api.get("/scheduled-work/today", { params }).then((r) => r.data.data);
export const getScheduledWork = (id) =>
  api.get(`/scheduled-work/${id}`).then((r) => r.data.data);
export const createScheduledWork = (data) =>
  api.post("/scheduled-work", data).then((r) => r.data.data);
export const updateScheduledWork = (id, data) =>
  api.patch(`/scheduled-work/${id}`, data).then((r) => r.data.data);
export const rescheduleScheduledWork = (id, data) =>
  api.post(`/scheduled-work/${id}/reschedule`, data).then((r) => r.data.data);
export const completeScheduledWork = (id) =>
  api.post(`/scheduled-work/${id}/complete`).then((r) => r.data.data);
export const startScheduledWork = (id) =>
  api.post(`/scheduled-work/${id}/start`).then((r) => r.data.data);
export const snoozeScheduledWork = (id, data) =>
  api.post(`/scheduled-work/${id}/snooze`, data).then((r) => r.data.data);
export const listSnoozes = (id) =>
  api.get(`/scheduled-work/${id}/snoozes`).then((r) => r.data.data);
export const cancelScheduledWork = (id) =>
  api.post(`/scheduled-work/${id}/cancel`).then((r) => r.data.data);
export const listReminders = (id) =>
  api.get(`/scheduled-work/${id}/reminders`).then((r) => r.data.data);
export const addReminder = (id, data) =>
  api.post(`/scheduled-work/${id}/reminders`, data).then((r) => r.data.data);
export const removeReminder = (id, reminderId) =>
  api.delete(`/scheduled-work/${id}/reminders/${reminderId}`).then((r) => r.data.data);
