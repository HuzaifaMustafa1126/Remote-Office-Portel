import { z } from "zod";
export const holidaySchema = z.object({
  title: z.string().trim().min(2).max(150),
  dayType: z.enum([
    "PUBLIC_HOLIDAY",
    "COMPANY_HOLIDAY",
    "SPECIAL_OFF_DAY",
    "WORKING_DAY",
  ]),
  startDate: z.string().date(),
  endDate: z.string().date(),
  description: z.string().trim().max(500).optional().default(""),
});
export const updateSchema = z.object({
  title: z.string().trim().min(2).max(150),
  dayType: z.enum([
    "PUBLIC_HOLIDAY",
    "COMPANY_HOLIDAY",
    "SPECIAL_OFF_DAY",
    "WORKING_DAY",
  ]),
  calendarDate: z.string().date(),
  description: z.string().trim().max(500).optional().default(""),
});
export const listSchema = z.object({
  from: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().date().optional(),
  ),
  to: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().date().optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["ACTIVE", "CANCELLED"]).optional(),
  ),
});
