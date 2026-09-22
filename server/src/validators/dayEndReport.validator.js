import { z } from "zod";

const item = z
  .object({
    sourceType: z.enum(["TASK", "ONGOING_WORK"]),
    sourceId: z.number().int().positive(),
    summary: z.string().trim().max(2000).optional().nullable(),
    whatsLeft: z.string().trim().max(2000).optional().nullable(),
    estimatedRemainingMinutes: z
      .number()
      .int()
      .min(1)
      .max(43200)
      .optional()
      .nullable(),
  })
  .strict();

export const submitSchema = z
  .object({
    items: z.array(item).max(100),
    otherWork: z.string().trim().max(2000).optional().nullable(),
    blockerType: z.enum([
      "NONE",
      "WAITING_ADMIN",
      "WAITING_CLIENT",
      "WAITING_TEAM",
      "TECHNICAL",
      "MISSING_ASSETS",
      "OTHER",
    ]),
    blockerDetails: z.string().trim().max(2000).optional().nullable(),
    tomorrowPriority: z
      .string()
      .trim()
      .min(1, "Tomorrow's priority is required")
      .max(1000),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.items.length && !value.otherWork)
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Select work or describe other work completed today",
      });
    if (value.blockerType !== "NONE" && !value.blockerDetails)
      context.addIssue({
        code: "custom",
        path: ["blockerDetails"],
        message: "Explain the blocker",
      });
  });
export const idSchema = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();
export const employeeIdSchema = z
  .object({ employeeId: z.coerce.number().int().positive() })
  .strict();
export const replySchema = z
  .object({ message: z.string().trim().min(1).max(2000) })
  .strict();
export const replyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
export const historyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .default(() =>
        new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 7),
      ),
    status: z.enum(["ALL", "SUBMITTED", "REVIEWED"]).default("ALL"),
    blocker: z.enum(["ALL", "HAS_BLOCKER", "NO_BLOCKER"]).default("ALL"),
  })
  .strict();
export const managementQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .default(() =>
        new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }),
      ),
    search: z.string().trim().max(100).default(""),
    status: z
      .enum(["ALL", "SUBMITTED", "REVIEWED", "NOT_SUBMITTED"])
      .default("ALL"),
    blocker: z.enum(["ALL", "HAS_BLOCKER", "NO_BLOCKER"]).default("ALL"),
  })
  .strict();
