import { Router } from "express";
import { authenticate, requirePasswordChanged } from "../middleware/auth.middleware.js";
import auth from "./auth.routes.js";
import employees from "./employee.routes.js";
import roles from "./role.routes.js";
import permissions from "./permission.routes.js";
import audit from "./audit.routes.js";
import dashboard from "./dashboard.routes.js";
import attendance from "./attendance.routes.js";
import leaves from "./leave.routes.js";
import calendar from "./companyCalendar.routes.js";
import notifications from "./notification.routes.js";
import shifts from "./shift.routes.js";
import payroll from "./payroll.routes.js";
import salaries from "./salary.routes.js";
import reports from "./report.routes.js";
import pool from "../config/database.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validateSchema } from "../services/schema.service.js";
const r = Router();
r.get(
  "/health",
  asyncHandler(async (req, res) => {
    await pool.query("SELECT 1");
    const schema = await validateSchema();
    res
      .status(schema.valid ? 200 : 503)
      .json({
        success: schema.valid,
        database: "connected",
        status: schema.valid ? "healthy" : "schema_outdated",
        missingTables: schema.missing,
        missingColumns: schema.missingColumns,
        missingMigrations: schema.missingMigrations,
      });
  }),
);
r.use("/auth", auth);
r.use(authenticate);
r.use(requirePasswordChanged);
r.use("/dashboard", dashboard);
r.use("/attendance", attendance);
r.use("/leaves", leaves);
r.use("/company-calendar", calendar);
r.use("/notifications", notifications);
r.use("/shifts", shifts);
r.use("/payroll", payroll);
r.use("/salaries", salaries);
r.use("/reports",reports);
r.use("/employees", employees);
r.use("/roles", roles);
r.use("/permissions", permissions);
r.use("/audit-logs", audit);
export default r;
