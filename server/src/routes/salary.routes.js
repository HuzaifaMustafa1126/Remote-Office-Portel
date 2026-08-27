import { Router } from "express";
import * as c from "../controllers/salary.controller.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/", p("salary.view_all"), asyncHandler(c.list));
r.get("/my", p("salary.view_own"), asyncHandler(c.mine));
export default r;
