import {
  cleanupAuditHistory,
  previewAuditCleanup,
  searchAuditLogs,
} from "../services/audit.service.js";
export async function list(req, res) {
  res.json({ success: true, data: await searchAuditLogs(req.validatedQuery) });
}
export async function cleanupPreview(req, res) {
  res.json({
    success: true,
    data: await previewAuditCleanup(req.validatedQuery),
  });
}
export async function cleanup(req, res) {
  const data = await cleanupAuditHistory(req.body, req.user);
  res.json({
    success: true,
    message: `${data.recordsDeleted} audit event(s) were permanently deleted.`,
    data,
  });
}
