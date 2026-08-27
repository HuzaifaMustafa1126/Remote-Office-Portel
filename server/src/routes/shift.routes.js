import { Router } from "express";
import * as c from "../controllers/shift.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as v from "../validators/shift.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", p("shift.view"), asyncHandler(c.list));
r.post("/", p("shift.manage"), validate(v.shiftSchema), asyncHandler(c.create));
r.put(
  "/:id",
  p("shift.manage"),
  validate(v.shiftSchema),
  asyncHandler(c.update),
);
r.patch("/:id/deactivate", p("shift.manage"), asyncHandler(c.deactivate));
r.put(
  "/assign/:employeeId",
  p("shift.assign"),
  validate(v.assignmentSchema),
  asyncHandler(c.assign),
);
export default r;
