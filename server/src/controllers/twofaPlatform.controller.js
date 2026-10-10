import * as service from "../services/twofaPlatform.service.js";
import { twofaRequestContext } from "../utils/twofaRequest.js";

export async function add(req, res) {
  const [platform] = await service.addPlatforms(
    req.params.profileId,
    [req.body],
    req.user,
    twofaRequestContext(req),
  );
  res.status(201).json({
    success: true,
    message: "2FA platform added successfully",
    data: platform,
  });
}

export async function addBulk(req, res) {
  const platforms = await service.addPlatforms(
    req.params.profileId,
    req.body.platforms,
    req.user,
    twofaRequestContext(req),
  );
  res.status(201).json({
    success: true,
    message: `${platforms.length} 2FA platforms added successfully`,
    data: platforms,
  });
}

export async function list(req, res) {
  res.json({
    success: true,
    data: await service.listPlatforms(
      req.params.profileId,
      req.user,
      twofaRequestContext(req),
    ),
  });
}

export async function update(req, res) {
  const platform = await service.updatePlatform(
    req.params.platformId,
    req.body,
    req.user,
    twofaRequestContext(req),
  );
  res.json({
    success: true,
    message: platform.changed
      ? "2FA platform updated successfully"
      : "2FA platform was already up to date",
    data: platform,
  });
}

export async function remove(req, res) {
  res.json({
    success: true,
    message: "2FA platform removed successfully",
    data: await service.removePlatform(
      req.params.platformId,
      req.user,
      twofaRequestContext(req),
    ),
  });
}

export const setTwofaNoStore = (res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

export async function revealTwofa(req, res) {
  setTwofaNoStore(res);
  res.json({
    success: true,
    data: await service.revealCredential(
      req.params.platformId,
      "twofa_information",
      req.user,
      twofaRequestContext(req),
    ),
  });
}

export async function revealKey(req, res) {
  setTwofaNoStore(res);
  res.json({
    success: true,
    data: await service.revealCredential(
      req.params.platformId,
      "auth_key",
      req.user,
      twofaRequestContext(req),
      { currentPassword: req.body.currentPassword },
    ),
  });
}
