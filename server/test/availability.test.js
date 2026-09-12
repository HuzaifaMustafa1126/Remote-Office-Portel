import test from "node:test";
import assert from "node:assert/strict";
import { resolveEmployeeAvailability } from "../src/services/availability.service.js";
import { setAvailabilitySchema } from "../src/validators/availability.validator.js";

const now = new Date("2026-09-10T18:00:00.000Z");
const base = { lastSeenAt: "2026-09-10T17:59:00.000Z", timeoutMinutes: 5 };

test("offline presence overrides break and manual availability", () => {
  assert.equal(resolveEmployeeAvailability({ ...base, lastSeenAt: "2026-09-10T17:50:00.000Z", activeBreak: 1, manualStatus: "DO_NOT_DISTURB" }, now), "OFFLINE");
});

test("an active real break overrides a valid manual status", () => {
  assert.equal(resolveEmployeeAvailability({ ...base, activeBreak: 1, manualStatus: "DO_NOT_DISTURB" }, now), "ON_BREAK");
});

test("manual status resolves while present and unexpired", () => {
  assert.equal(resolveEmployeeAvailability({ ...base, manualStatus: "IN_MEETING", manualStatusUntil: "2026-09-10T18:30:00.000Z" }, now), "IN_MEETING");
});

test("expired manual status resolves to online when presence remains fresh", () => {
  assert.equal(resolveEmployeeAvailability({ ...base, manualStatus: "AWAY", manualStatusUntil: "2026-09-10T17:30:00.000Z" }, now), "ONLINE");
});

test("indefinite away remains active until cleared", () => {
  assert.equal(resolveEmployeeAvailability({ ...base, manualStatus: "AWAY" }, now), "AWAY");
});

test("manual availability validation rejects system-managed statuses and long notes", () => {
  assert.equal(setAvailabilitySchema.safeParse({ status: "OFFLINE" }).success, false);
  assert.equal(setAvailabilitySchema.safeParse({ status: "ON_BREAK" }).success, false);
  assert.equal(setAvailabilitySchema.safeParse({ status: "AWAY", note: "x".repeat(81) }).success, false);
  assert.equal(setAvailabilitySchema.safeParse({ status: "DO_NOT_DISTURB", until: "2026-09-10T18:30:00.000Z" }).success, true);
});
