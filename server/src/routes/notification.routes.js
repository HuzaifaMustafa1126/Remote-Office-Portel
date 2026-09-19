import { Router } from "express";
import * as c from "../controllers/notification.controller.js";
import * as v from "../validators/notification.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import express from "express";
import ApiError from "../utils/ApiError.js";
import * as sound from "../controllers/notificationSound.controller.js";
import * as soundValidation from "../validators/notificationSound.validator.js";
import { requirePermission } from "../middleware/permission.middleware.js";
const r = Router();
const audioTypes = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
};
const rawAudio = express.raw({
  type: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg"],
  limit: "5mb",
});
const validAudio = (mime, b) =>
  mime === "audio/mpeg"
    ? b.subarray(0, 3).toString() === "ID3" ||
      (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)
    : mime === "audio/ogg"
      ? b.subarray(0, 4).toString() === "OggS"
      : b.subarray(0, 4).toString() === "RIFF" &&
        b.subarray(8, 12).toString() === "WAVE";
const audioUpload = (req, res, next) => {
  const mime = String(req.headers["content-type"] || "")
    .split(";")[0]
    .toLowerCase();
  if (!audioTypes[mime])
    return next(
      new ApiError(400, "Only MP3, WAV and OGG sounds are supported"),
    );
  rawAudio(req, res, (error) => {
    if (error) return next(error);
    if (!Buffer.isBuffer(req.body) || !req.body.length)
      return next(new ApiError(400, "Audio file is required"));
    if (!validAudio(mime, req.body))
      return next(
        new ApiError(400, "File content does not match its audio type"),
      );
    let original;
    try {
      original = decodeURIComponent(
        String(req.headers["x-file-name"] || `sound.${audioTypes[mime]}`),
      );
    } catch {
      return next(new ApiError(400, "Invalid file name"));
    }
    req.fileInfo = {
      mimeType: mime,
      extension: audioTypes[mime],
      originalFilename: original.replace(/[\\/\0]/g, "_").slice(0, 255),
      sizeBytes: req.body.length,
    };
    next();
  });
};
r.get("/sounds", asyncHandler(sound.configuration));
r.get("/sounds/:id/content", asyncHandler(sound.content));
r.post(
  "/sounds",
  requirePermission("notification_policy.manage"),
  audioUpload,
  asyncHandler(sound.upload),
);
r.patch(
  "/sounds/:id",
  requirePermission("notification_policy.manage"),
  validate(soundValidation.nameSchema),
  asyncHandler(sound.rename),
);
r.put(
  "/sounds/settings",
  requirePermission("notification_policy.manage"),
  validate(soundValidation.settingsSchema),
  asyncHandler(sound.settings),
);
r.delete(
  "/sounds/:id",
  requirePermission("notification_policy.manage"),
  asyncHandler(sound.remove),
);
r.get("/", validate(v.listSchema, "query"), asyncHandler(c.list));
r.get("/unread-count", asyncHandler(c.unread));
r.patch("/read-all", asyncHandler(c.readAll));
r.patch("/:id/read", asyncHandler(c.read));
r.get("/preferences", asyncHandler(c.preferences));
r.patch(
  "/preferences",
  validate(v.preferencesSchema),
  asyncHandler(c.updatePreferences),
);
r.post("/test", asyncHandler(c.test));
export default r;
