import api from "./api";
export const listAuditLogs = (params) =>
  api.get("/audit-logs", { params }).then((r) => r.data);
export const previewAuditCleanup = (params) =>
  api.get("/audit-logs/cleanup-preview", { params }).then((r) => r.data.data);
export const cleanupAuditHistory = (data) =>
  api.delete("/audit-logs/cleanup", { data }).then((r) => r.data.data);
