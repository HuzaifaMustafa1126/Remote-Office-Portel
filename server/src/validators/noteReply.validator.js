import { z } from "zod";
export const replySchema = z.object({
  content: z.string().trim().min(1).max(3000),
  mentionUserIds: z.array(z.number().int().positive()).max(20).default([]),
}).strict();
export const mentionSearchSchema = z.object({
  search: z.string().trim().max(80).default(""),
  archived: z.enum(["true", "false"]).optional(),
}).strict();
