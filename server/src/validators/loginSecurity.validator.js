import { z } from "zod";
const empty = (value) => (value === "" ? undefined : value);
export const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  from: z.preprocess(empty, z.string().date().optional()),
  to: z.preprocess(empty, z.string().date().optional()),
  status: z.preprocess(
    empty,
    z.enum(["ACTIVE", "LOGGED_OUT", "EXPIRED", "REVOKED", "FAILED"]).optional(),
  ),
  signal: z.preprocess(
    empty,
    z.enum(["NEW_IP", "NEW_DEVICE", "SUSPICIOUS"]).optional(),
  ),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
