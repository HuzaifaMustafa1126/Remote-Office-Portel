import { z } from "zod";
const optionalText = (max) => z.string().trim().max(max).optional().nullable();
const datetime = z.string().datetime({ offset: true });
const taskFields = {
  title: z.string().trim().min(2).max(200),
  description: optionalText(10000),
  instructions: optionalText(10000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignmentType: z.enum(["DIRECT", "OPEN"]),
  assigneeEmployeeId: z.number().int().positive().optional().nullable(),
  startAt: datetime.optional().nullable(),
  dueAt: datetime.optional().nullable(),
  publishMode: z.enum(["DRAFT", "NOW", "SCHEDULED"]),
  scheduledPublishAt: datetime.optional().nullable(),
  reviewRequired: z.boolean().default(false),
  completionImageRequired: z.boolean().default(false),
};
export const createSchema = z
  .object(taskFields)
  .strict()
  .superRefine((x, c) => {
    if (
      x.assignmentType === "DIRECT" &&
      x.publishMode !== "DRAFT" &&
      !x.assigneeEmployeeId
    )
      c.addIssue({
        code: "custom",
        path: ["assigneeEmployeeId"],
        message: "Direct tasks require one assignee",
      });
    if (x.assignmentType === "OPEN" && x.assigneeEmployeeId)
      c.addIssue({
        code: "custom",
        path: ["assigneeEmployeeId"],
        message: "Open tasks cannot have an assignee",
      });
    if (x.publishMode === "SCHEDULED" && !x.scheduledPublishAt)
      c.addIssue({
        code: "custom",
        path: ["scheduledPublishAt"],
        message: "Scheduled publication time is required",
      });
    if (
      x.publishMode === "SCHEDULED" &&
      x.scheduledPublishAt &&
      new Date(x.scheduledPublishAt) <= new Date()
    )
      c.addIssue({
        code: "custom",
        path: ["scheduledPublishAt"],
        message: "Scheduled publish time must be in the future",
      });
    if (x.dueAt && x.startAt && x.dueAt <= x.startAt)
      c.addIssue({
        code: "custom",
        path: ["dueAt"],
        message: "Due time must be after start time",
      });
    if (
      x.publishMode === "SCHEDULED" &&
      x.scheduledPublishAt &&
      x.dueAt &&
      new Date(x.scheduledPublishAt) >= new Date(x.dueAt)
    )
      c.addIssue({
        code: "custom",
        path: ["scheduledPublishAt"],
        message: "Scheduled publish time must be before the task due time",
      });
  });
export const updateSchema = z
  .object(taskFields)
  .omit({ publishMode: true })
  .partial()
  .strict();
export const scheduleSchema = z
  .object({
    scheduledPublishAt: datetime.refine(
      (value) => new Date(value) > new Date(),
      {
        message: "Scheduled publish time must be in the future",
      },
    ),
  })
  .strict();
export const listSchema = z.object({
  search: z.string().trim().max(200).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z
    .enum([
      "DRAFT",
      "SCHEDULED",
      "OPEN",
      "TO_DO",
      "IN_PROGRESS",
      "SUBMITTED_FOR_REVIEW",
      "CHANGES_REQUIRED",
      "COMPLETED",
      "ARCHIVED",
    ])
    .optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});
export const transitionSchema = z
  .object({
    status: z.enum([
      "DRAFT",
      "SCHEDULED",
      "OPEN",
      "TO_DO",
      "IN_PROGRESS",
      "SUBMITTED_FOR_REVIEW",
      "CHANGES_REQUIRED",
      "COMPLETED",
      "ARCHIVED",
    ]),
    reason: z.string().trim().max(1000).optional(),
    revisionDueAt: datetime.optional().nullable(),
  })
  .strict()
  .superRefine((x, c) => {
    if (x.revisionDueAt && new Date(x.revisionDueAt) <= new Date())
      c.addIssue({
        code: "custom",
        path: ["revisionDueAt"],
        message: "Revision deadline must be in the future",
      });
  });
export const commentSchema = z
  .object({ content: z.string().trim().min(1).max(1000) })
  .strict();
export const imageSchema = z
  .object({
    context: z.enum(["TASK_REFERENCE", "SUBMISSION", "CHANGES_REQUIRED"]),
    storageKey: z.string().trim().min(1).max(500),
    originalFilename: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(/\.(jpe?g|png|webp|gif)$/i),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    sizeBytes: z.number().int().positive().max(10485760),
  })
  .strict();
export const settingsSchema = z
  .object({
    offlineTimeoutMinutes: z.number().int().min(1).max(1440),
    maxOpenClaimsPerEmployee: z.number().int().min(0).max(100),
  })
  .strict();
export const assignmentSchema = z
  .object({
    employeeId: z.number().int().positive(),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict();
export const managementListSchema = z.object({
  search: z.string().trim().max(200).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z
    .enum([
      "DRAFT",
      "SCHEDULED",
      "OPEN",
      "TO_DO",
      "IN_PROGRESS",
      "SUBMITTED_FOR_REVIEW",
      "CHANGES_REQUIRED",
      "COMPLETED",
      "ARCHIVED",
    ])
    .optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  overdue: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export const deadlineSchema = z
  .object({ dueAt: datetime, reason: z.string().trim().max(1000).optional() })
  .strict();
export const bulkSchema = z
  .object({
    taskIds: z.array(z.number().int().positive()).min(1).max(100),
    action: z.enum(["PRIORITY", "REASSIGN", "ARCHIVE", "DELETE"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    employeeId: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((x, c) => {
    if (x.action === "PRIORITY" && !x.priority)
      c.addIssue({
        code: "custom",
        path: ["priority"],
        message: "Priority is required",
      });
    if (x.action === "REASSIGN" && !x.employeeId)
      c.addIssue({
        code: "custom",
        path: ["employeeId"],
        message: "Employee is required",
      });
  });
