import test from "node:test";
import assert from "node:assert/strict";
import { calendarSchema } from "../src/validators/scheduledWork.validator.js";

test("calendar accepts a bounded authorized-range query shape", () => {
  const result = calendarSchema.parse({
    from: "2026-10-01",
    to: "2026-10-31",
    type: "RECURRING",
    priority: "HIGH",
  });
  assert.equal(result.type, "RECURRING");
});

test("calendar rejects reversed and excessively broad ranges", () => {
  assert.equal(
    calendarSchema.safeParse({ from: "2026-11-01", to: "2026-10-01" }).success,
    false,
  );
  assert.equal(
    calendarSchema.safeParse({ from: "2026-01-01", to: "2027-01-03" }).success,
    false,
  );
});
