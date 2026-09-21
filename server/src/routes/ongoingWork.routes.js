import { Router } from "express";
import * as c from "../controllers/ongoingWork.controller.js";
import * as v from "../validators/ongoingWork.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { requirePermission } from "../middleware/permission.middleware.js";
const r = Router();
r.get("/me", asyncHandler(c.mine));
r.get(
  "/team/active",
  requirePermission("ongoing_work.view_team"),
  validate(v.teamActiveSchema, "query"),
  asyncHandler(c.teamActive),
);
r.get(
  "/team/completed",
  requirePermission("ongoing_work.view_team"),
  validate(v.teamCompletedSchema, "query"),
  asyncHandler(c.teamCompleted),
);
r.get(
  "/team/retention-settings",
  requirePermission("ongoing_work.retention_manage"),
  asyncHandler(c.retentionSettings),
);
r.put(
  "/team/retention-settings",
  requirePermission("ongoing_work.retention_manage"),
  validate(v.retentionSettingsSchema),
  asyncHandler(c.updateRetentionSettings),
);
r.delete(
  "/team/completed/:id",
  requirePermission("ongoing_work.retention_manage"),
  validate(v.idSchema, "params"),
  asyncHandler(c.removeCompletedByAdmin),
);
r.get(
  "/team/:id",
  requirePermission("ongoing_work.view_team"),
  validate(v.idSchema, "params"),
  asyncHandler(c.teamDetails),
);
r.get(
  "/team",
  requirePermission("ongoing_work.view_team"),
  asyncHandler(c.team),
);
r.get(
  "/completed",
  validate(v.completedListSchema, "query"),
  asyncHandler(c.completed),
);
r.post("/", validate(v.writeSchema), asyncHandler(c.create));
r.post(
  "/:id/start",
  validate(v.idSchema, "params"),
  asyncHandler(c.start),
);
r.post(
  "/:id/pause",
  validate(v.idSchema, "params"),
  asyncHandler(c.pause),
);
r.post(
  "/:id/complete",
  validate(v.idSchema, "params"),
  validate(v.completionSchema),
  asyncHandler(c.complete),
);
r.put(
  "/:id",
  validate(v.idSchema, "params"),
  validate(v.writeSchema),
  asyncHandler(c.update),
);
r.patch(
  "/:id/status",
  validate(v.idSchema, "params"),
  validate(v.statusSchema),
  asyncHandler(c.status),
);
r.delete("/:id", validate(v.idSchema, "params"), asyncHandler(c.remove));
export default r;
