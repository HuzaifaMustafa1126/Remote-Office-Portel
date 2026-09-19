import { Router } from "express";
import * as controller from "../controllers/audit.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { requireCeo } from "../middleware/ceo.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { auditQuerySchema } from "../validators/audit.validator.js";
import {
  cleanupPreviewSchema,
  cleanupSchema,
} from "../validators/historyCleanup.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get(
  "/cleanup-preview",
  requireCeo,
  validate(cleanupPreviewSchema, "query"),
  asyncHandler(controller.cleanupPreview),
);
r.delete(
  "/cleanup",
  requireCeo,
  validate(cleanupSchema),
  asyncHandler(controller.cleanup),
);
r.get(
  "/",
  requirePermission("audit.view"),
  validate(auditQuerySchema, "query"),
  asyncHandler(controller.list),
);
export default r;
