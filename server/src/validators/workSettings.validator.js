import { z } from "zod";
export const saveSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
  monthlySalary: z.coerce.number().positive().max(9999999999),
  salaryDivisor: z.coerce.number().int().min(1).max(366),
  effectiveFrom: z.string().date(),
});
