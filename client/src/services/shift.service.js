import api from "./api";
export const listShifts = () => api.get("/shifts").then((r) => r.data.data);
export const createShift = (d) =>
  api.post("/shifts", d).then((r) => r.data.data);
export const updateShift = (id, d) =>
  api.put(`/shifts/${id}`, d).then((r) => r.data.data);
export const deactivateShift = (id) =>
  api.patch(`/shifts/${id}/deactivate`).then((r) => r.data.data);
export const assignShift = (employeeId, d) =>
  api.put(`/shifts/assign/${employeeId}`, d).then((r) => r.data.data);
