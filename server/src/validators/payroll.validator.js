import { z } from "zod";
export const generateSchema = z.object({
  label: z.string().regex(/^\d{4}-\d{2}$/),
});
