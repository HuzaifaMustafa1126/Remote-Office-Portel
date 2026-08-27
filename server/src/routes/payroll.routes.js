import { Router } from "express";
import * as c from "../controllers/payroll.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { generateSchema } from "../validators/payroll.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", p("payroll.view_all"), asyncHandler(c.list));
r.post(
  "/generate",
  p("payroll.generate"),
  validate(generateSchema),
  asyncHandler(c.generate),
);
r.post(
  "/recalculate",
  p("payroll.recalculate"),
  validate(generateSchema),
  asyncHandler(c.recalculate),
);
r.get("/:id", p("payroll.view_all"), asyncHandler(c.get));
r.get("/:id/my", p("payroll.view_own"), asyncHandler(c.mine));
r.patch("/:id/approve", p("payroll.approve"), asyncHandler(c.approve));
r.patch("/:id/paid", p("payroll.mark_paid"), asyncHandler(c.paid));
export default r;
