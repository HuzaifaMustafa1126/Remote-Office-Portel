import { z } from "zod";
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  category: z.enum(["TASK", "LEAVE", "BREAK", "ATTENDANCE"]).optional(),
});
export const preferencesSchema = z.object({
  desktopEnabled: z.boolean(), soundEnabled: z.boolean(), taskEnabled: z.boolean(),
  leaveEnabled: z.boolean(), breakEnabled: z.boolean(), attendanceEnabled: z.boolean(),
  announcementEnabled: z.boolean(),
}).strict("Unexpected notification preference field");
