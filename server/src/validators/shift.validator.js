import { z } from "zod";
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const shiftSchema = z.object({
  name: z.string().trim().min(2).max(100),
  startTime: time,
  endTime: time,
  requiredWorkMinutes: z.coerce.number().int().min(1).max(1440),
  breakAllowanceMinutes: z.coerce.number().int().min(0).max(480),
  graceMinutes: z.coerce.number().int().min(0).max(240),
});
export const assignmentSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
  effectiveFrom: z.string().date(),
});
