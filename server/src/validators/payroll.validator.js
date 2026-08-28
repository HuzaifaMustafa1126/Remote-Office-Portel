import { z } from "zod";
export const generateSchema = z.object({
  label: z.string().regex(/^\d{4}-\d{2}$/),
});
export const adjustmentSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  title: z.string().trim().min(2).max(150),
  type: z.enum(["ALLOWANCE", "DEDUCTION", "POSITIVE_ADJUSTMENT", "NEGATIVE_ADJUSTMENT"]),
  amount: z.coerce.number().positive().max(100000000),
  reason: z.string().trim().min(3).max(500),
});
export const adjustmentUpdateSchema = adjustmentSchema.omit({ employeeId: true }).partial().refine((x) => Object.keys(x).length > 0);
export const reopenSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const paymentSchema = z.object({
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "OTHER"]),
  paymentDate: z.string().date(),
  paymentReference: z.string().trim().min(1).max(190),
  note: z.string().trim().max(500).optional(),
});
