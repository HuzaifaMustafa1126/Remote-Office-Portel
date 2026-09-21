import { z } from "zod";
export const writeSchema = z
  .object({
    title: z.string().trim().min(1, "Work title is required").max(200),
    description: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();
export const statusSchema = z
  .object({ status: z.enum(["WORKING", "PAUSED", "COMPLETED"]) })
  .strict();
export const idSchema = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();
export const completionSchema = z
  .object({
    completionNote: z
      .string()
      .trim()
      .min(1, "Please add a completion note")
      .max(1000),
  })
  .strict();
export const completedListSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export const teamActiveSchema = z
  .object({
    search: z.string().trim().max(100).default(""),
    status: z.enum(["ALL", "WORKING", "PAUSED"]).default("ALL"),
    employeeId: z.coerce.number().int().positive().optional(),
  })
  .strict();
export const teamCompletedSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(100).default(""),
    employeeId: z.coerce.number().int().positive().optional(),
    date: z.enum(["ALL", "TODAY", "YESTERDAY", "LAST_7_DAYS", "CUSTOM"]).default("ALL"),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.date === "CUSTOM" && (!value.from || !value.to || value.from > value.to))
      context.addIssue({ code: "custom", message: "A valid custom date range is required" });
  });
