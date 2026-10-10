import { Router } from "express";
import * as controller from "../controllers/twofa.controller.js";
import { requirePermission as permit } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as validation from "../validators/twofa.validator.js";

const router = Router();

router.get(
  "/profiles",
  permit("2fa.profile.view"),
  validate(validation.listProfilesSchema, "query"),
  asyncHandler(controller.list),
);
router.post(
  "/profiles",
  permit("2fa.profile.create"),
  validate(validation.createProfileSchema),
  asyncHandler(controller.create),
);
router.get(
  "/profiles/:id",
  permit("2fa.profile.view"),
  validate(validation.profileIdSchema, "params"),
  asyncHandler(controller.get),
);
router.patch(
  "/profiles/:id",
  permit("2fa.profile.edit"),
  validate(validation.profileIdSchema, "params"),
  validate(validation.updateProfileSchema),
  asyncHandler(controller.update),
);
router.delete(
  "/profiles/:id",
  permit("2fa.profile.delete"),
  validate(validation.profileIdSchema, "params"),
  asyncHandler(controller.remove),
);

export default router;
