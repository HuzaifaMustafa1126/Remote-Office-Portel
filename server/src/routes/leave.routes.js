import { Router } from "express";
import * as c from "../controllers/leave.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as v from "../validators/leave.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.post(
  "/",
  p("leave.create"),
  validate(v.createLeaveSchema),
  asyncHandler(c.create),
);
r.get("/my", p("leave.view_own"), asyncHandler(c.my));
r.get("/summary", p("leave.view_own"), asyncHandler(c.summary));
r.get(
  "/reports/monthly",
  p("leave.reports"),
  validate(v.monthlyQuerySchema, "query"),
  asyncHandler(c.monthly),
);
r.post(
  "/finalize",
  p("leave.reports"),
  validate(v.finalizeSchema),
  asyncHandler(c.finalize),
);
r.get(
  "/",
  p("leave.view_all"),
  validate(v.listQuerySchema, "query"),
  asyncHandler(c.list),
);
r.get("/:id", p("leave.view_all"), asyncHandler(c.get));
r.patch("/:id/cancel", p("leave.cancel_own"), asyncHandler(c.cancel));
r.patch(
  "/:id/approve",
  p("leave.approve"),
  validate(v.reviewSchema),
  asyncHandler(c.approve),
);
r.patch(
  "/:id/reject",
  p("leave.reject"),
  validate(v.rejectSchema),
  asyncHandler(c.reject),
);
export default r;
