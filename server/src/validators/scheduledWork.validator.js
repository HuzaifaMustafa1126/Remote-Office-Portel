import { z } from "zod";

const scheduleType = z.enum(["EXACT", "RELATIVE"]);
const relativeUnit = z.enum(["MINUTES", "HOURS", "DAYS", "WEEKS"]);
const priority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const scheduleFields = {
  scheduleType,
  scheduledAt: z.string().max(50).optional(),
  relativeValue: z.coerce.number().int().min(1).max(525600).optional(),
  relativeUnit: relativeUnit.optional(),
};
const validateSchedule = (value, context) => {
  if (value.scheduleType === "EXACT" && !value.scheduledAt)
    context.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "A scheduled date and time is required",
    });
  if (
    value.scheduleType === "RELATIVE" &&
    (!value.relativeValue || !value.relativeUnit)
  )
    context.addIssue({
      code: "custom",
      path: ["relativeValue"],
      message: "A positive relative value and unit are required",
    });
};
export const createSchema = z
  .object({
    title: z.string().trim().min(2).max(255),
    description: z.string().trim().max(10000).optional().nullable(),
    ...scheduleFields,
    priority: priority.default("NORMAL"),
  })
  .strict()
  .superRefine(validateSchedule);
export const updateSchema = z
  .object({
    title: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().max(10000).optional().nullable(),
    priority: priority.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "No changes supplied");
export const rescheduleSchema = z
  .object(scheduleFields)
  .strict()
  .superRefine(validateSchedule);
export const idSchema = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();
export const listSchema = z
  .object({
    status: z
      .enum(["UPCOMING", "DUE_TODAY", "OVERDUE", "COMPLETED", "CANCELLED"])
      .optional(),
    priority: priority.optional(),
    search: z.string().trim().max(200).optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "From date must be before to date",
  );
