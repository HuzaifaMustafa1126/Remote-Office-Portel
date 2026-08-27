import { z } from "zod";
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  category: z.enum(["TASK", "LEAVE", "BREAK", "ATTENDANCE"]).optional(),
});
export const preferencesSchema = z.object({
  soundEnabled: z.boolean(), taskNotifications: z.boolean(), leaveNotifications: z.boolean(),
  breakNotifications: z.boolean(), attendanceNotifications: z.boolean(), browserNotifications: z.boolean(),
});
