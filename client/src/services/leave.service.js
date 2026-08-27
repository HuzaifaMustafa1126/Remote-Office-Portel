import api from "./api";
export const createLeave = (data) =>
  api.post("/leaves", data).then((r) => r.data);
export const getMyLeaves = () => api.get("/leaves/my").then((r) => r.data.data);
export const getSummary = () =>
  api.get("/leaves/summary").then((r) => r.data.data);
export const cancelLeave = (id) =>
  api.patch(`/leaves/${id}/cancel`).then((r) => r.data);
export const getLeaves = (params) =>
  api.get("/leaves", { params }).then((r) => r.data.data);
export const getLeave = (id) =>
  api.get(`/leaves/${id}`).then((r) => r.data.data);
export const approveLeave = (id, comment) =>
  api.patch(`/leaves/${id}/approve`, { comment }).then((r) => r.data);
export const rejectLeave = (id, comment) =>
  api.patch(`/leaves/${id}/reject`, { comment }).then((r) => r.data);
export const getMonthlyReport = (params) =>
  api.get("/leaves/reports/monthly", { params }).then((r) => r.data.data);
