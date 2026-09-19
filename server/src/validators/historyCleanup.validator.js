import { z } from "zod";

const fields = {
  mode: z.enum(["30_DAYS", "90_DAYS", "6_MONTHS", "1_YEAR", "CUSTOM", "ALL"]),
  beforeDate: z.string().date().optional(),
};
const refineDate = (value, context) => {
  if (value.mode === "CUSTOM" && !value.beforeDate)
    context.addIssue({
      code: "custom",
      path: ["beforeDate"],
      message: "A cutoff date is required.",
    });
};

export const cleanupPreviewSchema = z
  .object(fields)
  .strict()
  .superRefine(refineDate);
export const cleanupSchema = z
  .object({ ...fields, confirmation: z.enum(["DELETE", "DELETE ALL"]) })
  .strict()
  .superRefine((value, context) => {
    refineDate(value, context);
    const expected = value.mode === "ALL" ? "DELETE ALL" : "DELETE";
    if (value.confirmation !== expected)
      context.addIssue({
        code: "custom",
        path: ["confirmation"],
        message: `Type ${expected} to confirm permanent deletion.`,
      });
  });
