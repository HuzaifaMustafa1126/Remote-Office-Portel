import { z } from "zod";
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  category: z
    .enum([
      "TASK",
      "NOTE",
      "LEAVE",
      "BREAK",
      "ATTENDANCE",
      "CALENDAR",
      "PAYROLL",
      "SECURITY",
      "EMPLOYEE",
      "SHIFT",
      "ANNOUNCEMENT",
      "SYSTEM",
    ])
    .optional(),
  type: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export const preferencesSchema = z
  .object({
    notificationsEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    doNotDisturb: z.boolean(),
    volume: z.number().int().min(0).max(100),
    desktopEnabled: z.boolean(),
    soundEnabled: z.boolean(),
    taskEnabled: z.boolean(),
    noteEnabled: z.boolean(),
    leaveEnabled: z.boolean(),
    breakEnabled: z.boolean(),
    attendanceEnabled: z.boolean(),
    announcementEnabled: z.boolean(),
    calendarEnabled: z.boolean(),
    payrollEnabled: z.boolean(),
    securityEnabled: z.boolean(),
    employeeEnabled: z.boolean(),
    shiftEnabled: z.boolean(),
    eventPreferences: z
      .array(
        z
          .object({
            eventType: z.string().trim().min(1).max(50),
            inAppEnabled: z.boolean().nullable(),
            desktopEnabled: z.boolean().nullable(),
            soundEnabled: z.boolean().nullable(),
          })
          .strict(),
      )
      .max(100)
      .default([]),
  })
  .strict("Unexpected notification preference field");
