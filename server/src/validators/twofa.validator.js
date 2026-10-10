import { z } from "zod";
import env from "../config/env.js";
import { TWOFA_ACTIVITY_ACTION_VALUES } from "../services/twofaActivity.service.js";

const profileName = z
  .string({ required_error: "Profile name is required" })
  .trim()
  .min(1, "Profile name is required")
  .max(150, "Profile name must be 150 characters or fewer");

export const profileIdSchema = z
  .object({ id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER) })
  .strict();

export const createProfileSchema = z.object({ profileName }).strict();

export const updateProfileSchema = z.object({ profileName }).strict();

const optionalSearch = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().max(150).optional(),
);

export const listProfilesSchema = z
  .object({
    search: optionalSearch,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["createdAt", "updatedAt", "profileName"]).default("updatedAt"),
    sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
  })
  .strict();

const platformNames = new Map([
  ["instagram", "INSTAGRAM"],
  ["facebook", "FACEBOOK"],
  ["google", "GOOGLE"],
  ["tiktok", "TIKTOK"],
  ["youtube", "YOUTUBE"],
  ["linkedin", "LINKEDIN"],
  ["x / twitter", "X_TWITTER"],
  ["x/twitter", "X_TWITTER"],
  ["x_twitter", "X_TWITTER"],
  ["twitter", "X_TWITTER"],
  ["snapchat", "SNAPCHAT"],
  ["microsoft", "MICROSOFT"],
  ["other", "OTHER"],
]);

const platformName = z
  .string({ required_error: "Platform name is required" })
  .trim()
  .min(1, "Platform name is required")
  .max(50)
  .transform((value, context) => {
    const normalized = platformNames.get(value.toLowerCase());
    if (!normalized) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported platform name",
      });
      return z.NEVER;
    }
    return normalized;
  });

const optionalLabel = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).max(100).optional(),
);

const optionalCredential = (maximum) =>
  z
    .string()
    .max(maximum)
    .refine((value) => value.trim().length > 0, "Credential cannot be blank")
    .optional();

const platformFields = {
  platformName,
  customPlatformName: optionalLabel,
  accountLabel: optionalLabel,
  twofaInformation: optionalCredential(10_000),
  authKey: optionalCredential(2_000),
};

const validatePlatform = (data, context) => {
  if (data.platformName === "OTHER" && !data.customPlatformName)
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customPlatformName"],
      message: "Custom platform name is required for Other",
    });
  if (data.platformName !== "OTHER" && data.customPlatformName)
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customPlatformName"],
      message: "Custom platform name is only allowed for Other",
    });
  if (!data.twofaInformation && !data.authKey)
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one credential value is required",
    });
};

export const createPlatformSchema = z
  .object(platformFields)
  .strict()
  .superRefine(validatePlatform);

export const bulkCreatePlatformsSchema = z
  .object({
    platforms: z
      .array(createPlatformSchema)
      .min(1)
      .max(env.TWOFA_PLATFORM_BATCH_MAX),
  })
  .strict();

export const profilePlatformParamsSchema = z
  .object({
    profileId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export const platformIdSchema = z
  .object({
    platformId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export const updatePlatformSchema = z
  .object({
    platformName: platformName.optional(),
    customPlatformName: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
    accountLabel: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
    twofaInformation: optionalCredential(10_000),
    authKey: optionalCredential(2_000),
    clearTwofaInformation: z.boolean().optional(),
    clearAuthKey: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (!Object.keys(data).length)
      context.addIssue({ code: z.ZodIssueCode.custom, message: "At least one field is required" });
    if (data.twofaInformation !== undefined && data.clearTwofaInformation)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clearTwofaInformation"],
        message: "Cannot update and clear 2FA information together",
      });
    if (data.authKey !== undefined && data.clearAuthKey)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clearAuthKey"],
        message: "Cannot update and clear the authentication key together",
      });
  });

export const revealSchema = z.object({}).strict();

export const revealKeySchema = z
  .object({ currentPassword: z.string().min(1).max(72) })
  .strict();

const employeeId = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const accessPermissionsSchema = z
  .object({
    canView: z.boolean(),
    canEdit: z.boolean(),
    canRevealTwofa: z.boolean(),
    canRevealAuthKey: z.boolean(),
  })
  .strict()
  .superRefine((permissions, context) => {
    if (!permissions.canView && (permissions.canEdit || permissions.canRevealTwofa || permissions.canRevealAuthKey))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canView"],
        message: "View access is required for edit and reveal capabilities",
      });
  });

export const profileAccessParamsSchema = z
  .object({ profileId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER) })
  .strict();

export const employeeAccessParamsSchema = z
  .object({
    profileId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    employeeId,
  })
  .strict();

export const grantProfileAccessSchema = z
  .object({ employeeId })
  .strict();

export const updateProfileAccessSchema = z
  .object({ permissions: accessPermissionsSchema })
  .strict();

const historyDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD").optional();
export const twofaHistoryQuerySchema = z
  .object({
    profileId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    platformId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    employeeId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    action: z.enum(TWOFA_ACTIVITY_ACTION_VALUES).optional(),
    status: z.enum(["SUCCESS", "FAILURE"]).optional(),
    dateFrom: historyDate,
    dateTo: historyDate,
    search: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().min(1).max(150).optional()),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo)
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["dateTo"], message: "Date to must be on or after date from" });
  });
