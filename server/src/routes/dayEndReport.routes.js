import { Router } from "express";
import * as controller from "../controllers/dayEndReport.controller.js";
import {
  submitSchema,
  idSchema,
  managementQuerySchema,
} from "../validators/dayEndReport.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const router = Router();
router.get(
  "/today",
  requirePermission("day_end_report.submit"),
  asyncHandler(controller.today),
);
router.get(
  "/today/work-items",
  requirePermission("day_end_report.submit"),
  asyncHandler(controller.workItems),
);
router.post(
  "/",
  requirePermission("day_end_report.submit"),
  validate(submitSchema),
  asyncHandler(controller.submit),
);
router.patch(
  "/:id",
  requirePermission("day_end_report.submit"),
  validate(idSchema, "params"),
  validate(submitSchema),
  asyncHandler(controller.update),
);
router.get(
  "/",
  requirePermission("day_end_report.view_all"),
  validate(managementQuerySchema, "query"),
  asyncHandler(controller.managementList),
);
router.get(
  "/:id",
  requirePermission("day_end_report.view_all"),
  validate(idSchema, "params"),
  asyncHandler(controller.managementDetails),
);
router.patch(
  "/:id/review",
  requirePermission("day_end_report.review"),
  validate(idSchema, "params"),
  asyncHandler(controller.review),
);
export default router;
