import test from "node:test";
import assert from "node:assert/strict";
import { formatNotificationTime } from "../src/utils/notificationTime.js";

process.env.TZ = "UTC";

// These UTC instants are 8:30 PM in the test machine's Asia/Karachi timezone.
const now = Date.parse("2026-10-06T15:30:00.000Z");

test("formats notification ages from their creation instant", () => {
  assert.equal(formatNotificationTime(now - 30_000, now), "Just now");
  assert.equal(formatNotificationTime(now - 60_000, now), "1 min ago");
  assert.equal(formatNotificationTime(now - 15 * 60_000, now), "15 mins ago");
  assert.equal(formatNotificationTime(now - 60 * 60_000, now), "1 hr ago");
  assert.equal(formatNotificationTime(now - 5 * 60 * 60_000, now), "5 hrs ago");
});

test("formats yesterday, older dates, and prior years", () => {
  assert.equal(
    formatNotificationTime("2026-10-05T15:30:00.000Z", now),
    "Yesterday, 8:30 PM",
  );
  assert.equal(
    formatNotificationTime("2026-10-04T15:30:00.000Z", now),
    "Oct 4, 8:30 PM",
  );
  assert.equal(
    formatNotificationTime("2025-10-04T15:30:00.000Z", now),
    "Oct 4, 2025, 8:30 PM",
  );
});

test("handles invalid and future timestamps safely", () => {
  assert.equal(formatNotificationTime(null, now), "Time unavailable");
  assert.equal(formatNotificationTime("not-a-date", now), "Time unavailable");
  assert.equal(formatNotificationTime(now + 30_000, now), "Just now");
});
