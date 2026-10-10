import * as service from "../services/twofa.service.js";
import { twofaRequestContext as context } from "../utils/twofaRequest.js";

export async function create(req, res) {
  res.status(201).json({
    success: true,
    message: "2FA profile created successfully",
    data: await service.createProfile(req.body, req.user, context(req)),
  });
}

export async function list(req, res) {
  res.json({
    success: true,
    data: await service.listProfiles(req.validatedQuery, req.user),
  });
}

export async function get(req, res) {
  res.json({
    success: true,
    data: await service.getProfile(req.params.id, req.user, context(req)),
  });
}

export async function update(req, res) {
  const profile = await service.updateProfile(
    req.params.id,
    req.body,
    req.user,
    context(req),
  );
  res.json({
    success: true,
    message: profile.changed
      ? "2FA profile updated successfully"
      : "2FA profile was already up to date",
    data: profile,
  });
}

export async function remove(req, res) {
  res.json({
    success: true,
    message: "2FA profile deleted successfully",
    data: await service.deleteProfile(
      req.params.id,
      req.user,
      context(req),
    ),
  });
}
