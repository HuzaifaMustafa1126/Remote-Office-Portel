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
export const repeatSchema = z
  .object({
    type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM_INTERVAL"]),
    interval: z.coerce.number().int().min(1).max(365).default(1),
    unit: z.enum(["HOURS", "DAYS", "WEEKS", "MONTHS"]).optional(),
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).max(7).optional(),
    monthDay: z.coerce.number().int().min(1).max(31).optional(),
    endType: z.enum(["NEVER", "ON_DATE", "AFTER_OCCURRENCES"]).default("NEVER"),
    endAt: z.string().date().optional(),
    maxOccurrences: z.coerce.number().int().min(1).max(10000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.type === "CUSTOM_INTERVAL" && !value.unit)
      context.addIssue({ code: "custom", path: ["unit"], message: "Choose a repeat unit" });
    if (value.type === "WEEKLY" && !value.weekdays?.length)
      context.addIssue({ code: "custom", path: ["weekdays"], message: "Choose at least one weekday" });
    if (value.type === "MONTHLY" && !value.monthDay)
      context.addIssue({ code: "custom", path: ["monthDay"], message: "Choose a day of the month" });
    if (value.endType === "ON_DATE" && !value.endAt)
      context.addIssue({ code: "custom", path: ["endAt"], message: "Choose an end date" });
    if (value.endType === "AFTER_OCCURRENCES" && !value.maxOccurrences)
      context.addIssue({ code: "custom", path: ["maxOccurrences"], message: "Enter the number of occurrences" });
  });
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
    repeat: repeatSchema.optional().nullable(),
    linkedTaskId: z.coerce.number().int().positive().optional().nullable(),
    assignedTo: z.coerce.number().int().positive().optional(),
  })
  .strict()
  .superRefine(validateSchedule);
export const updateSchema = z
  .object({
    title: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().max(10000).optional().nullable(),
    priority: priority.optional(),
    linkedTaskId: z.coerce.number().int().positive().optional().nullable(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "No changes supplied");
export const rescheduleSchema = z
  .object({ ...scheduleFields, confirmActiveExecution: z.boolean().optional() })
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
    type: z.enum(["ALL", "ONE_TIME", "RECURRING"]).default("ALL"),
    search: z.string().trim().max(200).optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine((v, context) => {
    if (!v.from || !v.to) return;
    const days = (new Date(`${v.to}T00:00:00Z`) - new Date(`${v.from}T00:00:00Z`)) / 86400000;
    if (days < 0) context.addIssue({ code: "custom", path: ["to"], message: "From date must be before to date" });
    if (days > 366) context.addIssue({ code: "custom", path: ["to"], message: "Date range cannot exceed 366 days" });
  });
export const occurrenceListSchema = z
  .object({
    status: z.enum(["UPCOMING", "COMPLETED", "CANCELLED"]).optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine((v, context) => {
    if (!v.from || !v.to) return;
    const days = (new Date(`${v.to}T00:00:00Z`) - new Date(`${v.from}T00:00:00Z`)) / 86400000;
    if (days < 0 || days > 366) context.addIssue({ code: "custom", path: ["to"], message: "Date range must be between 0 and 366 days" });
  });
export const occurrenceIdSchema = z
  .object({ id: z.coerce.number().int().positive(), occurrenceId: z.coerce.number().int().positive() })
  .strict();
export const recurrenceUpdateSchema = z.object({ repeat: repeatSchema }).strict();
export const calendarSchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
    priority: priority.optional(),
    type: z.enum(["ALL", "ONE_TIME", "RECURRING"]).default("ALL"),
  })
  .strict()
  .superRefine((value, context) => {
    const days = (new Date(`${value.to}T00:00:00Z`) - new Date(`${value.from}T00:00:00Z`)) / 86400000;
    if (days < 0) context.addIssue({ code: "custom", path: ["to"], message: "To date must not precede from date" });
    if (days > 366) context.addIssue({ code: "custom", path: ["to"], message: "Calendar range cannot exceed 366 days" });
  });
export const executionCompletionSchema = z.object({ executionHandling: z.enum(["SCHEDULE_ONLY", "COMPLETE_BOTH"]).optional() }).strict();
export const executionCancelSchema = z.object({ executionHandling: z.literal("SCHEDULE_ONLY").optional() }).strict();
export const reassignSchema = z.object({
  assignedTo: z.coerce.number().int().positive(),
  scope: z.enum(["ONE_TIME", "THIS_OCCURRENCE", "FUTURE_OCCURRENCES"]),
  occurrenceId: z.coerce.number().int().positive().optional(),
}).strict().superRefine((value, context) => {
  if (["THIS_OCCURRENCE", "FUTURE_OCCURRENCES"].includes(value.scope) && !value.occurrenceId)
    context.addIssue({ code: "custom", path: ["occurrenceId"], message: "Choose the effective occurrence" });
});
export const teamListSchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  status: z.enum(["UPCOMING", "DUE_TODAY", "OVERDUE", "COMPLETED", "CANCELLED"]).optional(),
  priority: priority.optional(), type: z.enum(["ALL", "ONE_TIME", "RECURRING"]).default("ALL"),
  search: z.string().trim().max(200).optional(), from: z.string().date().optional(), to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().superRefine((value, context) => {
  if (!value.from || !value.to) return;
  const days=(new Date(`${value.to}T00:00:00Z`)-new Date(`${value.from}T00:00:00Z`))/86400000;
  if(days<0||days>366)context.addIssue({code:"custom",path:["to"],message:"Date range must be between 0 and 366 days"});
});
export const teamCalendarSchema = z.object({
  from: z.string().date(), to: z.string().date(), employeeId: z.coerce.number().int().positive().optional(),
  priority: priority.optional(), type: z.enum(["ALL", "ONE_TIME", "RECURRING"]).default("ALL"),
}).strict().superRefine((value, context) => {
  const days=(new Date(`${value.to}T00:00:00Z`)-new Date(`${value.from}T00:00:00Z`))/86400000;
  if(days<0||days>366)context.addIssue({code:"custom",path:["to"],message:"Calendar range must be between 0 and 366 days"});
});
