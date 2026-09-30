import test from "node:test";
import assert from "node:assert/strict";
import { calculateSnooze } from "../src/services/scheduledWorkSnooze.service.js";

test("20-minute snooze uses authoritative current time", () => {
  const now = new Date("2026-10-02T19:00:00+05:00");
  assert.equal(
    calculateSnooze({ value: 20, unit: "MINUTES" }, now).toISOString(),
    "2026-10-02T14:20:00.000Z",
  );
});

test("tomorrow uses the selected Pakistan clock time", () => {
  const now = new Date("2026-10-02T21:00:00+05:00");
  assert.equal(
    calculateSnooze({ unit: "TOMORROW", time: "19:00" }, now).toISOString(),
    "2026-10-03T14:00:00.000Z",
  );
});

test("invalid and excessive snoozes are rejected", () => {
  const now = new Date("2026-10-02T19:00:00+05:00");
  assert.throws(() => calculateSnooze({ value: 0, unit: "MINUTES" }, now));
  assert.throws(() => calculateSnooze({ value: 366, unit: "DAYS" }, now));
});
