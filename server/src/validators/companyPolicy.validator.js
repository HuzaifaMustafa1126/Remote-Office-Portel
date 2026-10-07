import { z } from "zod";

export const idSchema = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();

const fields = {
  title: z.string().trim().min(1, "Policy title is required").max(200),
  content: z.string().trim().min(1, "Policy content is required").max(50000),
};

export const createSchema = z.object(fields).strict();
export const updateSchema = z.object(fields).strict();
