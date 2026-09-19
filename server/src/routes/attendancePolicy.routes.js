import { Router } from "express";
import * as c from "../controllers/attendancePolicy.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as v from "../validators/attendancePolicy.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", p("attendance_policy.view"), asyncHandler(c.list));
r.get("/current", p("attendance_policy.view"), asyncHandler(c.current));
r.post(
  "/",
  p("attendance_policy.manage"),
  validate(v.policySchema),
  asyncHandler(c.save),
);
export default r;
