import * as service from "../services/twofaAccess.service.js";
import { twofaRequestContext } from "../utils/twofaRequest.js";

export async function list(req, res) {
  res.json({ success: true, data: await service.listProfileAccess(req.params.profileId, req.user, twofaRequestContext(req)) });
}
export async function grant(req, res) {
  res.status(201).json({ success: true, message: "2FA profile access granted successfully", data: await service.grantProfileAccess(req.params.profileId, req.body, req.user, twofaRequestContext(req)) });
}
export async function update(req, res) {
  const data = await service.updateProfileAccess(req.params.profileId, req.params.employeeId, req.body.permissions, req.user, twofaRequestContext(req));
  res.json({ success: true, message: data.changed ? "2FA profile access updated successfully" : "2FA profile access was already up to date", data });
}
export async function remove(req, res) {
  res.json({ success: true, message: "2FA profile access revoked successfully", data: await service.revokeProfileAccess(req.params.profileId, req.params.employeeId, req.user, twofaRequestContext(req)) });
}
