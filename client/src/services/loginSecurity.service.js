import api from "./api";
export const getSummary = () =>
  api.get("/login-security/summary").then((r) => r.data.data);
export const list = (params) =>
  api.get("/login-security", { params }).then((r) => r.data.data);
export const revoke = (sessionId) =>
  api.post(`/login-security/sessions/${sessionId}/revoke`).then((r) => r.data);
