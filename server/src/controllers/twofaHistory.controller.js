import * as service from "../services/twofaHistory.service.js";

export async function profile(req, res) {
  const result = await service.profileHistory(req.params.profileId, req.validatedQuery, req.user);
  res.json({ success: true, data: result.rows, pagination: result.meta });
}
export async function global(req, res) {
  const result = await service.globalHistory(req.validatedQuery, req.user);
  res.json({ success: true, data: result.rows, pagination: result.meta });
}
