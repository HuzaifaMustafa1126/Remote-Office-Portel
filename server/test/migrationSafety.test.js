import test from "node:test";
import assert from "node:assert/strict";
import {
  auditCoverage,
  isProtectedMigration,
  migrationVersion,
  PROTECTED_MIGRATION_MAX_VERSION,
  refusesProtectedReplay,
} from "../src/scripts/migrationSafety.js";

test("protected migration boundary is exactly 001 through 062", () => {
  assert.equal(PROTECTED_MIGRATION_MAX_VERSION, 62);
  assert.equal(migrationVersion("060_day_end_report_followups.sql"), 60);
  assert.equal(isProtectedMigration("001_initial_schema.sql"), true);
  assert.equal(isProtectedMigration("048_availability_notifications.sql"), true);
  assert.equal(isProtectedMigration("060_day_end_report_followups.sql"), true);
  assert.equal(isProtectedMigration("061_flexible_estimates_multiple_ongoing_timers.sql"), true);
  assert.equal(isProtectedMigration("062_note_category_management.sql"), true);
  assert.equal(isProtectedMigration("063_future_feature.sql"), false);
});

test("clean databases may bootstrap protected history while existing databases refuse replay", () => {
  assert.equal(refusesProtectedReplay(false, "001_initial_schema.sql"), false);
  assert.equal(refusesProtectedReplay(false, "048_availability_notifications.sql"), false);
  assert.equal(refusesProtectedReplay(true, "060_day_end_report_followups.sql"), true);
  assert.equal(refusesProtectedReplay(true, "061_flexible_estimates_multiple_ongoing_timers.sql"), true);
  assert.equal(refusesProtectedReplay(true, "062_note_category_management.sql"), true);
  assert.equal(refusesProtectedReplay(true, "063_future_feature.sql"), false);
});

test("audit coverage reports missing and orphan protected definitions", () => {
  const files = ["001_initial_schema.sql", "060_day_end_report_followups.sql", "061_flexible_estimates_multiple_ongoing_timers.sql", "062_note_category_management.sql", "063_future_feature.sql"];
  assert.deepEqual(auditCoverage(files, ["001_initial_schema.sql"]), {
    missingChecks: ["060_day_end_report_followups.sql", "061_flexible_estimates_multiple_ongoing_timers.sql", "062_note_category_management.sql"],
    orphanChecks: [],
  });
  assert.deepEqual(
    auditCoverage(["001_initial_schema.sql"], ["001_initial_schema.sql", "048_removed.sql"]),
    { missingChecks: [], orphanChecks: ["048_removed.sql"] },
  );
});
