import api from "./api";
export const list = () => api.get("/payroll").then((r) => r.data.data);
export const get = (id) => api.get(`/payroll/${id}`).then((r) => r.data.data);
export const generate = (label) =>
  api.post("/payroll/generate", { label }).then((r) => r.data.data);
export const recalculate = (label) =>
  api.post("/payroll/recalculate", { label }).then((r) => r.data.data);
export const approve = (id) =>
  api.patch(`/payroll/${id}/approve`).then((r) => r.data.data);
export const markPaid = (id, data) =>
  api.patch(`/payroll/${id}/paid`,data).then((r) => r.data.data);
export const reopen=(id,reason)=>api.patch(`/payroll/${id}/reopen`,{reason}).then(r=>r.data.data);
export const addAdjustment=(id,data)=>api.post(`/payroll/${id}/adjustments`,data).then(r=>r.data.data);
export const removeAdjustment=(id,adjustmentId)=>api.delete(`/payroll/${id}/adjustments/${adjustmentId}`).then(r=>r.data.data);
export const updateAdjustment=(id,adjustmentId,data)=>api.patch(`/payroll/${id}/adjustments/${adjustmentId}`,data).then(r=>r.data.data);
export const verify=(id)=>api.get(`/payroll/${id}/verify`).then(r=>r.data.data);
