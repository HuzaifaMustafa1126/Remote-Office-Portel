import { Router } from "express";
import * as c from "../controllers/payroll.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { generateSchema,adjustmentSchema,adjustmentUpdateSchema,reopenSchema,paymentSchema } from "../validators/payroll.validator.js";
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
r.patch("/:id/reopen",p("payroll.reopen"),validate(reopenSchema),asyncHandler(c.reopen));
r.patch("/:id/paid", p("payroll.mark_paid"),validate(paymentSchema), asyncHandler(c.paid));
r.post("/:id/adjustments",p("payroll.adjust"),validate(adjustmentSchema),asyncHandler(c.addAdjustment));
r.patch("/:id/adjustments/:adjustmentId",p("payroll.adjust"),validate(adjustmentUpdateSchema),asyncHandler(c.updateAdjustment));
r.delete("/:id/adjustments/:adjustmentId",p("payroll.adjust"),asyncHandler(c.removeAdjustment));
r.get("/:id/verify",p("payroll.view_all"),asyncHandler(c.verify));
export default r;
