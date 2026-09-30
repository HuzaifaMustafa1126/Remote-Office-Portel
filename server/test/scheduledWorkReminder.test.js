import test from "node:test";
import assert from "node:assert/strict";
import { calculateReminder } from "../src/services/scheduledWorkReminder.service.js";

test("20-minute reminder preserves the scheduled clock and offset", () => {
  const result = calculateReminder(
    "2026-10-02 19:00:00",
    { value: 20, unit: "MINUTES" },
    new Date("2026-09-30T19:00:00+05:00"),
  );
  assert.equal(result, "2026-10-02 18:40:00");
});

test("hour and day reminder calculations preserve wall-clock semantics", () => {
  const now = new Date("2026-09-20T12:00:00+05:00");
  assert.equal(
    calculateReminder("2026-10-02 19:00:00", { value: 1, unit: "HOURS" }, now),
    "2026-10-02 18:00:00",
  );
  assert.equal(
    calculateReminder("2026-10-02 19:00:00", { value: 1, unit: "DAYS" }, now),
    "2026-10-01 19:00:00",
  );
});

test("past reminders are rejected", () => {
  assert.throws(
    () =>
      calculateReminder(
        "2026-10-02 19:00:00",
        { value: 1, unit: "DAYS" },
        new Date("2026-10-02T18:00:00+05:00"),
      ),
    (error) => error.code === "REMINDER_IN_PAST",
  );
});
