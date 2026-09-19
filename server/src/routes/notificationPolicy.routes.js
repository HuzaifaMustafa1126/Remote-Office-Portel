import { Router } from "express";
import * as c from "../controllers/notificationPolicy.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { policiesSchema } from "../validators/notificationPolicy.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", p("notification_policy.view"), asyncHandler(c.list));
r.put(
  "/",
  p("notification_policy.manage"),
  validate(policiesSchema),
  asyncHandler(c.update),
);
export default r;
