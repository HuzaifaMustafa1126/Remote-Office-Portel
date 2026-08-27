import { Router } from "express";
import * as c from "../controllers/permission.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { permissionsSchema } from "../validators/role.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", p("permissions.view"), asyncHandler(c.list));
r.put(
  "/roles/:roleId",
  p("permissions.manage"),
  validate(permissionsSchema),
  asyncHandler(c.updateRole),
);
export default r;
