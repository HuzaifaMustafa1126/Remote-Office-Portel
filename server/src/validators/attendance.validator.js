import { z } from "zod";

const optionalDate = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().date().optional(),
);
const optionalId = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

export const historyQuerySchema = z.object({
  from: optionalDate,
  to: optionalDate,
  employeeId: optionalId,
});

export const listQuerySchema = historyQuerySchema.extend({
  department: z.string().trim().max(100).optional(),
  status: z
    .enum(["WORKING", "ON_BREAK", "CLOCKED_OUT", "NOT_CLOCKED_IN"])
    .optional(),
});

export const dailyReportQuerySchema = z.object({ date: optionalDate });
export const monthlyReportQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});
export const correctionSchema = z.object({
  clockOutAt: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/,
      "Use YYYY-MM-DD HH:mm:ss",
    ),
  comment: z.string().trim().min(3).max(500),
});
