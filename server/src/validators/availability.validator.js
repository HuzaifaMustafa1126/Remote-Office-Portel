import { z } from "zod";

export const setAvailabilitySchema = z.object({
  status: z.enum(["AWAY", "DO_NOT_DISTURB", "IN_MEETING", "NAMAZ"]),
  until: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().datetime({ offset: true }).optional(),
  ),
  note: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(80, "Status note must be 80 characters or fewer").optional(),
  ),
});
