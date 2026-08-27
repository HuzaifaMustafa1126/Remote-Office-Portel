import { z } from "zod";
const optional = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);
const optionalDate = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().date().optional(),
);
export const createLeaveSchema = z.object({
  leaveType: z.enum(["CASUAL", "SICK", "EMERGENCY", "PERSONAL", "OTHER"]),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().trim().min(5).max(1000),
});
export const reviewSchema = z.object({
  comment: z.string().trim().max(1000).optional().default(""),
});
export const rejectSchema = z.object({
  comment: z.string().trim().min(3).max(1000),
});
export const listQuerySchema = z.object({
  search: optional,
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  ),
  leaveType: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["CASUAL", "SICK", "EMERGENCY", "PERSONAL", "OTHER"]).optional(),
  ),
  employeeId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  department: optional,
  from: optionalDate,
  to: optionalDate,
});
export const monthlyQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  employeeId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
});
export const finalizeSchema = z.object({ date: z.string().date() });
