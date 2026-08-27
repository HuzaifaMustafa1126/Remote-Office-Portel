import api from "./api";
export const list = () => api.get("/payroll").then((r) => r.data.data);
export const get = (id) => api.get(`/payroll/${id}`).then((r) => r.data.data);
export const generate = (label) =>
  api.post("/payroll/generate", { label }).then((r) => r.data.data);
export const recalculate = (label) =>
  api.post("/payroll/recalculate", { label }).then((r) => r.data.data);
export const approve = (id) =>
  api.patch(`/payroll/${id}/approve`).then((r) => r.data.data);
export const markPaid = (id) =>
  api.patch(`/payroll/${id}/paid`).then((r) => r.data.data);
