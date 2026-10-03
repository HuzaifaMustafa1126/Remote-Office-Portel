import test from "node:test";
import assert from "node:assert/strict";
import { nextOccurrence } from "../src/services/scheduledWorkRecurrence.service.js";

const iso = (value) => value.toISOString();

test("custom day intervals retain Pakistan wall-clock time", () => {
  const rule = { recurrenceType: "CUSTOM_INTERVAL", recurrenceInterval: 2, recurrenceUnit: "DAYS" };
  assert.equal(iso(nextOccurrence("2026-10-02T14:00:00.000Z", rule)), "2026-10-04T14:00:00.000Z");
});

test("custom hour intervals use elapsed hours", () => {
  const rule = { recurrenceType: "CUSTOM_INTERVAL", recurrenceInterval: 48, recurrenceUnit: "HOURS" };
  assert.equal(iso(nextOccurrence("2026-10-02T14:00:00.000Z", rule)), "2026-10-04T14:00:00.000Z");
});

test("weekly recurrence advances through selected weekdays", () => {
  const rule = { recurrenceType: "WEEKLY", recurrenceInterval: 1, recurrenceConfig: { weekdays: [1, 3, 5] } };
  const monday = new Date("2026-10-05T14:00:00.000Z");
  const wednesday = nextOccurrence(monday, rule);
  const friday = nextOccurrence(wednesday, rule);
  const nextMonday = nextOccurrence(friday, rule);
  assert.deepEqual([iso(wednesday), iso(friday), iso(nextMonday)], [
    "2026-10-07T14:00:00.000Z",
    "2026-10-09T14:00:00.000Z",
    "2026-10-12T14:00:00.000Z",
  ]);
});

test("multi-week recurrence skips the configured number of weeks after the final selected day", () => {
  const rule = { recurrenceType: "WEEKLY", recurrenceInterval: 2, recurrenceConfig: { weekdays: [1, 5] } };
  const friday = new Date("2026-10-09T14:00:00.000Z");
  assert.equal(iso(nextOccurrence(friday, rule)), "2026-10-19T14:00:00.000Z");
});

test("monthly recurrence clamps to the last valid day", () => {
  const rule = { recurrenceType: "MONTHLY", recurrenceInterval: 1, recurrenceConfig: { monthDay: 31 } };
  assert.equal(iso(nextOccurrence("2027-01-31T14:00:00.000Z", rule)), "2027-02-28T14:00:00.000Z");
  assert.equal(iso(nextOccurrence("2027-12-31T14:00:00.000Z", rule)), "2028-01-31T14:00:00.000Z");
});
