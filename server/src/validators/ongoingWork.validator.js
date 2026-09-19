import { z } from "zod";
export const writeSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();
export const statusSchema = z
  .object({ status: z.enum(["ONGOING", "PAUSED", "COMPLETED"]) })
  .strict();
