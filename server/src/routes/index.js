import { requireDeviceAccess } from "../middleware/deviceAccess.middleware.js";
import { Router } from "express";
import {
  authenticate,
  requirePasswordChanged,
} from "../middleware/auth.middleware.js";
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
import attendancePolicies from "./attendancePolicy.routes.js";
import notificationPolicies from "./notificationPolicy.routes.js";
import tasks from "./task.routes.js";
import availability from "./availability.routes.js";
import loginSecurity from "./loginSecurity.routes.js";
import pool from "../config/database.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/health", (req, res) => res.json({
  success: true,
  status: "ok",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));
r.get("/health/database", asyncHandler(async (req, res) => {
  await pool.query({ sql: "SELECT 1", timeout: 5000 });
  res.json({ success: true, status: "ok", database: "connected" });
}));
r.use("/auth", auth);
r.use(authenticate);
r.use(requireDeviceAccess);
r.use(requirePasswordChanged);
r.use("/dashboard", dashboard);
r.use("/attendance", attendance);
r.use("/attendance-policies", attendancePolicies);
r.use("/notification-policies", notificationPolicies);
r.use("/tasks", tasks);
r.use("/availability", availability);
r.use("/login-security", loginSecurity);
r.use("/leaves", leaves);
r.use("/company-calendar", calendar);
r.use("/notifications", notifications);
r.use("/shifts", shifts);
r.use("/payroll", payroll);
r.use("/salaries", salaries);
r.use("/reports", reports);
r.use("/employees", employees);
r.use("/roles", roles);
r.use("/permissions", permissions);
r.use("/audit-logs", audit);
export default r;
