import { Router } from "express";
import { show } from "../controllers/dashboard.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", requirePermission("dashboard.view"), asyncHandler(show));
export default r;
