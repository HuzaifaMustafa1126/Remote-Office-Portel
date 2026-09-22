import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { submitSchema } from "../src/validators/dayEndReport.validator.js";

const base = { items: [], otherWork: "Helped resolve deployment issue", blockerType: "NONE", tomorrowPriority: "Finish QA" };

test("submission validation requires tomorrow priority and conditional blocker details", () => {
  assert.equal(submitSchema.safeParse(base).success, true);
  assert.equal(submitSchema.safeParse({ ...base, tomorrowPriority: "" }).success, false);
  assert.equal(submitSchema.safeParse({ ...base, blockerType: "TECHNICAL", blockerDetails: "" }).success, false);
});

test("submission rejects an empty report and client-controlled snapshot fields", () => {
  assert.equal(submitSchema.safeParse({ ...base, otherWork: "" }).success, false);
  assert.equal(submitSchema.safeParse({ ...base, employeeId: 99 }).success, false);
  assert.equal(submitSchema.safeParse({ ...base, items: [{ sourceType: "TASK", sourceId: 1, trackedMinutes: 999 }] }).success, false);
});

test("migration links one report to one attendance workday and stores relational snapshots", () => {
  const sql = fs.readFileSync(new URL("../database/migrations/057_day_end_report_phase1.sql", import.meta.url), "utf8");
  assert.match(sql, /UNIQUE KEY uq_day_end_report_attendance\(attendance_id\)/);
  assert.match(sql, /title_snapshot/);
  assert.match(sql, /tracked_minutes_snapshot/);
  assert.match(sql, /ON DELETE SET NULL/);
});

test("clock out is backend-protected by submitted report enforcement", () => {
  const attendance = fs.readFileSync(new URL("../src/services/attendance.service.js", import.meta.url), "utf8");
  const reports = fs.readFileSync(new URL("../src/services/dayEndReport.service.js", import.meta.url), "utf8");
  assert.match(attendance, /assertSubmittedForAttendance\(conn, record\.id, user\.employee_id\)/);
  assert.match(reports, /DAY_END_REPORT_REQUIRED/);
  assert.match(reports, /attendance_id=\? AND employee_id=\?/);
});
