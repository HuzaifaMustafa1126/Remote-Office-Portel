import { z } from "zod";

const item = z.object({
  sourceType: z.enum(["TASK", "ONGOING_WORK"]),
  sourceId: z.number().int().positive(),
  summary: z.string().trim().max(2000).optional().nullable(),
  whatsLeft: z.string().trim().max(2000).optional().nullable(),
  estimatedRemainingMinutes: z.number().int().min(1).max(43200).optional().nullable(),
}).strict();

export const submitSchema = z.object({
  items: z.array(item).max(100),
  otherWork: z.string().trim().max(2000).optional().nullable(),
  blockerType: z.enum(["NONE", "WAITING_ADMIN", "WAITING_CLIENT", "WAITING_TEAM", "TECHNICAL", "MISSING_ASSETS", "OTHER"]),
  blockerDetails: z.string().trim().max(2000).optional().nullable(),
  tomorrowPriority: z.string().trim().min(1, "Tomorrow's priority is required").max(1000),
}).strict().superRefine((value, context) => {
  if (!value.items.length && !value.otherWork)
    context.addIssue({ code: "custom", path: ["items"], message: "Select work or describe other work completed today" });
  if (value.blockerType !== "NONE" && !value.blockerDetails)
    context.addIssue({ code: "custom", path: ["blockerDetails"], message: "Explain the blocker" });
});
