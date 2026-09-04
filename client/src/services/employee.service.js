import api from "./api";
export const listEmployees = (params) =>
  api.get("/employees", { params }).then((r) => r.data);
export const getEmployee = (id) =>
  api.get(`/employees/${id}`).then((r) => r.data.data);
export const createEmployee = (data) =>
  api.post("/employees", data).then((r) => r.data);
export const updateEmployee = (id, data) =>
  api.put(`/employees/${id}`, data).then((r) => r.data);
export const setEmployeeStatus = (id, status) =>
  api.patch(`/employees/${id}/status`, { status }).then((r) => r.data);
export const assignRole = (id, roleId) =>
  api.put(`/employees/${id}/role`, { roleId }).then((r) => r.data);
export const getWorkSettings = (id) =>
  api.get(`/employees/${id}/work-settings`).then((r) => r.data.data);
export const saveWorkSettings = (id, data) =>
  api.put(`/employees/${id}/work-settings`, data).then((r) => r.data.data);
export const resetPassword = (id, data) => api.patch(`/employees/${id}/reset-password`, data).then((r) => r.data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`).then((r) => r.data);
