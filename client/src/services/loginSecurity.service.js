import api from "./api";
export const getSummary = () =>
  api.get("/login-security/summary").then((r) => r.data.data);
export const list = (params) =>
  api.get("/login-security", { params }).then((r) => r.data.data);
export const revoke = (sessionId) =>
  api.post(`/login-security/sessions/${sessionId}/revoke`).then((r) => r.data);
export const previewCleanup = (params) =>
  api.get("/login-security/cleanup-preview", { params }).then((r) => r.data.data);
export const cleanup = (data) =>
  api.delete("/login-security/cleanup", { data }).then((r) => r.data.data);
