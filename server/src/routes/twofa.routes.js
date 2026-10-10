import { Router } from "express";
import * as controller from "../controllers/twofa.controller.js";
import * as platformController from "../controllers/twofaPlatform.controller.js";
import * as accessController from "../controllers/twofaAccess.controller.js";
import * as historyController from "../controllers/twofaHistory.controller.js";
import { requireTwofaPermission as permit } from "../middleware/twofaPermission.middleware.js";
import { createTwofaRevealRateLimit } from "../middleware/twofaRateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as validation from "../validators/twofa.validator.js";

const router = Router();
const revealRateLimit = createTwofaRevealRateLimit();

router.get(
  "/history",
  permit("2fa.history.view"),
  validate(validation.twofaHistoryQuerySchema, "query"),
  asyncHandler(historyController.global),
);

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
  "/profiles/:profileId/history",
  permit("2fa.history.view"),
  validate(validation.profileAccessParamsSchema, "params"),
  validate(validation.twofaHistoryQuerySchema, "query"),
  asyncHandler(historyController.profile),
);
router.get(
  "/profiles/:profileId/access",
  permit("2fa.access.manage"),
  validate(validation.profileAccessParamsSchema, "params"),
  asyncHandler(accessController.list),
);
router.post(
  "/profiles/:profileId/access",
  permit("2fa.access.manage"),
  validate(validation.profileAccessParamsSchema, "params"),
  validate(validation.grantProfileAccessSchema),
  asyncHandler(accessController.grant),
);
router.delete(
  "/profiles/:profileId/access/:employeeId",
  permit("2fa.access.manage"),
  validate(validation.employeeAccessParamsSchema, "params"),
  asyncHandler(accessController.remove),
);
router.get(
  "/profiles/:profileId/platforms",
  permit("2fa.profile.view"),
  validate(validation.profilePlatformParamsSchema, "params"),
  asyncHandler(platformController.list),
);
router.post(
  "/profiles/:profileId/platforms/bulk",
  permit("2fa.platform.add"),
  validate(validation.profilePlatformParamsSchema, "params"),
  validate(validation.bulkCreatePlatformsSchema),
  asyncHandler(platformController.addBulk),
);
router.post(
  "/profiles/:profileId/platforms",
  permit("2fa.platform.add"),
  validate(validation.profilePlatformParamsSchema, "params"),
  validate(validation.createPlatformSchema),
  asyncHandler(platformController.add),
);
router.patch(
  "/platforms/:platformId",
  permit("2fa.platform.edit"),
  validate(validation.platformIdSchema, "params"),
  validate(validation.updatePlatformSchema),
  asyncHandler(platformController.update),
);
router.delete(
  "/platforms/:platformId",
  permit("2fa.platform.delete"),
  validate(validation.platformIdSchema, "params"),
  asyncHandler(platformController.remove),
);
router.post(
  "/platforms/:platformId/reveal-2fa",
  permit("2fa.information.reveal"),
  revealRateLimit,
  validate(validation.platformIdSchema, "params"),
  validate(validation.revealSchema),
  asyncHandler(platformController.revealTwofa),
);
router.post(
  "/platforms/:platformId/reveal-key",
  permit("2fa.key.reveal"),
  revealRateLimit,
  validate(validation.platformIdSchema, "params"),
  validate(validation.revealKeySchema),
  asyncHandler(platformController.revealKey),
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
