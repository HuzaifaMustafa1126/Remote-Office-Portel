import { Router } from "express";
import * as controller from "../controllers/dayEndReport.controller.js";
import {
  submitSchema,
  idSchema,
  managementQuerySchema,
  employeeIdSchema,
  replySchema,
  replyQuerySchema,
  historyQuerySchema,
  attendanceIdSchema,
  followupSettingsSchema,
} from "../validators/dayEndReport.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const router = Router();
router.get(
  "/settings/followups",
  requirePermission("day_end_report.view_all"),
  asyncHandler(controller.settings),
);
router.patch(
  "/settings/followups",
  requirePermission("day_end_report.review"),
  validate(followupSettingsSchema),
  asyncHandler(controller.updateSettings),
);
router.post(
  "/attendance/:attendanceId/reminder",
  requirePermission("day_end_report.review"),
  validate(attendanceIdSchema, "params"),
  asyncHandler(controller.sendReminder),
);
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
router.get(
  "/my-history",
  requirePermission("day_end_report.submit"),
  validate(historyQuerySchema, "query"),
  asyncHandler(controller.myHistory),
);
router.get(
  "/mine/:id",
  requirePermission("day_end_report.submit"),
  validate(idSchema, "params"),
  asyncHandler(controller.ownDetails),
);
router.get(
  "/employees/:employeeId/history",
  requirePermission("day_end_report.view_all"),
  validate(employeeIdSchema, "params"),
  validate(historyQuerySchema, "query"),
  asyncHandler(controller.employeeHistory),
);
router.get(
  "/:id/replies",
  validate(idSchema, "params"),
  validate(replyQuerySchema, "query"),
  asyncHandler(controller.replies),
);
router.post(
  "/:id/replies",
  validate(idSchema, "params"),
  validate(replySchema),
  asyncHandler(controller.reply),
);
router.get(
  "/:id/activity",
  validate(idSchema, "params"),
  asyncHandler(controller.activity),
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
