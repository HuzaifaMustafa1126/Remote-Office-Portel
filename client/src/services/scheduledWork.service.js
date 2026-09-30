import api from "./api";
export const listScheduledWork = (params = {}) =>
  api.get("/scheduled-work", { params }).then((r) => r.data.data);
export const todayScheduledWork = (params = {}) =>
  api.get("/scheduled-work/today", { params }).then((r) => r.data.data);
export const createScheduledWork = (data) =>
  api.post("/scheduled-work", data).then((r) => r.data.data);
export const updateScheduledWork = (id, data) =>
  api.patch(`/scheduled-work/${id}`, data).then((r) => r.data.data);
export const rescheduleScheduledWork = (id, data) =>
  api.post(`/scheduled-work/${id}/reschedule`, data).then((r) => r.data.data);
export const completeScheduledWork = (id) =>
  api.post(`/scheduled-work/${id}/complete`).then((r) => r.data.data);
export const cancelScheduledWork = (id) =>
  api.post(`/scheduled-work/${id}/cancel`).then((r) => r.data.data);
