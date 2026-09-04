import { Router } from "express";
import * as c from "../controllers/employee.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as v from "../validators/employee.validator.js";
import asyncHandler from "../utils/asyncHandler.js";
import { saveSchema as workSettingsSchema } from "../validators/workSettings.validator.js";
import { employeeAccrual } from "../controllers/salary.controller.js";
const r = Router();
r.get("/archived", p("employees.restore"), asyncHandler(c.archived));
r.get("/", p("employees.view_all"), asyncHandler(c.list));
r.get("/:id", p("employees.view_all"), asyncHandler(c.get));
r.get("/:id/work-settings", p("shift.view"), asyncHandler(c.workSettings));
r.get(
  "/:id/salary-accrual",
  p("salary.view_all"),
  asyncHandler(employeeAccrual),
);
r.put(
  "/:id/work-settings",
  p("shift.assign"),
  p("salary.manage"),
  validate(workSettingsSchema),
  asyncHandler(c.saveWorkSettings),
);
r.post(
  "/",
  p("employees.create"),
  validate(v.createEmployeeSchema),
  asyncHandler(c.create),
);
r.put(
  "/:id",
  p("employees.update"),
  validate(v.updateEmployeeSchema),
  asyncHandler(c.update),
);
r.patch(
  "/:id/status",
  p("employees.deactivate"),
  validate(v.statusSchema),
  asyncHandler(c.status),
);
r.put(
  "/:id/role",
  p("roles.manage"),
  validate(v.assignRoleSchema),
  asyncHandler(c.role),
);
r.patch("/:id/reset-password", p("employees.reset_password"), validate(v.resetPasswordSchema), asyncHandler(c.resetPassword));
r.delete("/:id", p("employees.delete"), asyncHandler(c.remove));
r.patch("/:id/restore", p("employees.restore"), asyncHandler(c.restore));
export default r;
