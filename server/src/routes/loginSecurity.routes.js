import { Router } from "express";
import * as controller from "../controllers/loginSecurity.controller.js";
import { requirePermission as permit } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { listSchema } from "../validators/loginSecurity.validator.js";
import {
  cleanupPreviewSchema,
  cleanupSchema,
} from "../validators/historyCleanup.validator.js";
import { requireCeo } from "../middleware/ceo.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const router = Router();
router.get(
  "/cleanup-preview",
  requireCeo,
  validate(cleanupPreviewSchema, "query"),
  asyncHandler(controller.cleanupPreview),
);
router.delete(
  "/cleanup",
  requireCeo,
  validate(cleanupSchema),
  asyncHandler(controller.cleanup),
);
router.get(
  "/summary",
  permit("security.login_activity.view"),
  asyncHandler(controller.summary),
);
router.get(
  "/",
  permit("security.login_activity.view"),
  validate(listSchema, "query"),
  asyncHandler(controller.list),
);
router.post(
  "/sessions/:sessionId/revoke",
  permit("security.sessions.revoke"),
  asyncHandler(controller.revoke),
);
export default router;
