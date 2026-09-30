import test from "node:test";
import assert from "node:assert/strict";
import {
  displayStatus,
  relativeDate,
  sqlToIso,
  toSqlDateTime,
} from "../src/utils/scheduledWorkTime.js";

test("48 hours is an exact duration that preserves Pakistan local time", () => {
  const created = new Date("2026-09-30T19:00:00+05:00");
  const scheduled = relativeDate(48, "HOURS", created);
  assert.equal(scheduled.toISOString(), "2026-10-02T14:00:00.000Z");
  assert.equal(toSqlDateTime(scheduled), "2026-10-02 19:00:00");
});

test("display states are derived without changing persisted status", () => {
  const now = new Date("2026-10-02T12:00:00+05:00");
  assert.equal(
    displayStatus(
      { status: "UPCOMING", scheduledAt: "2026-10-02 13:00:00" },
      now,
    ),
    "DUE_TODAY",
  );
  assert.equal(
    displayStatus(
      { status: "UPCOMING", scheduledAt: "2026-10-02 11:00:00" },
      now,
    ),
    "OVERDUE",
  );
  assert.equal(
    displayStatus(
      { status: "COMPLETED", scheduledAt: "2026-10-01 11:00:00" },
      now,
    ),
    "COMPLETED",
  );
});

test("database datetimes are exposed with the configured offset", () => {
  assert.equal(sqlToIso("2026-10-02 19:00:00"), "2026-10-02T19:00:00+05:00");
});
