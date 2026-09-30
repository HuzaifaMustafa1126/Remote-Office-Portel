import { z } from "zod";

const scheduleType = z.enum(["EXACT", "RELATIVE"]);
const relativeUnit = z.enum(["MINUTES", "HOURS", "DAYS", "WEEKS"]);
const priority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const reminder = z
  .object({
    value: z.coerce.number().int().min(1).max(525600),
    unit: z.enum(["MINUTES", "HOURS", "DAYS"]),
  })
  .strict();
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
    reminders: z.array(reminder).max(10).default([]),
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
export const reminderSchema = reminder;
export const reminderIdSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    reminderId: z.coerce.number().int().positive(),
  })
  .strict();
export const snoozeSchema = z
  .object({
    value: z.coerce.number().int().min(1).max(525600).optional(),
    unit: z.enum(["MINUTES", "HOURS", "DAYS", "TOMORROW"]),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    reminderId: z.coerce.number().int().positive().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.unit === "TOMORROW" && !value.time)
      context.addIssue({ code: "custom", path: ["time"], message: "Choose a time for tomorrow" });
    if (value.unit !== "TOMORROW" && !value.value)
      context.addIssue({ code: "custom", path: ["value"], message: "Enter a reminder duration" });
  });
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
