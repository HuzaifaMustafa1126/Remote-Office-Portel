import { Router } from "express";
import * as controller from "../controllers/availability.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { setAvailabilitySchema } from "../validators/availability.validator.js";

const router = Router();
router.get("/team", asyncHandler(controller.team));
router.get("/me", asyncHandler(controller.mine));
router.patch(
  "/me",
  validate(setAvailabilitySchema),
  asyncHandler(controller.update),
);
router.delete("/me/manual", asyncHandler(controller.clear));
export default router;
