import { Router } from "express";
import * as controller from "../controllers/companyPolicy.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as validation from "../validators/companyPolicy.validator.js";

const router = Router();

router.get(
  "/",
  requirePermission("company_policy.view"),
  asyncHandler(controller.list),
);
router.get(
  "/:id",
  requirePermission("company_policy.view"),
  validate(validation.idSchema, "params"),
  asyncHandler(controller.get),
);
router.post(
  "/",
  requirePermission("company_policy.manage"),
  validate(validation.createSchema),
  asyncHandler(controller.create),
);
router.patch(
  "/:id",
  requirePermission("company_policy.manage"),
  validate(validation.idSchema, "params"),
  validate(validation.updateSchema),
  asyncHandler(controller.update),
);
router.delete(
  "/:id",
  requirePermission("company_policy.manage"),
  validate(validation.idSchema, "params"),
  asyncHandler(controller.remove),
);

export default router;
