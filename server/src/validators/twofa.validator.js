import { z } from "zod";

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
