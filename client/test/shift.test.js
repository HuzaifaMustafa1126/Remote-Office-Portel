import { test } from "node:test";
import assert from "node:assert/strict";
import { requiredWorkMinutes } from "../src/utils/shift.js";

test("required work subtracts breaks for daytime and overnight shifts", () => {
  assert.equal(requiredWorkMinutes("09:00", "17:00", 60), 420);
  assert.equal(requiredWorkMinutes("18:00", "03:00", 60), 480);
  assert.equal(requiredWorkMinutes("18:30", "03:15", 30), 495);
  assert.equal(requiredWorkMinutes("18:00", "03:00", 0), 540);
});

test("equal times match the server's full-day shift convention", () => {
  assert.equal(requiredWorkMinutes("09:00", "09:00", 60), 1380);
});

test("incomplete times remain blank and excessive breaks never show negative work", () => {
  assert.equal(requiredWorkMinutes("", "03:00", 60), "");
  assert.equal(requiredWorkMinutes("18:00", "", 60), "");
  assert.equal(requiredWorkMinutes("09:00", "09:30", 60), 0);
});
