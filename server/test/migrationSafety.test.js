import test from "node:test";
import assert from "node:assert/strict";
import {
  auditCoverage,
  isProtectedMigration,
  migrationVersion,
  PROTECTED_MIGRATION_MAX_VERSION,
  refusesProtectedReplay,
} from "../src/scripts/migrationSafety.js";

test("protected migration boundary is exactly 001 through 048", () => {
  assert.equal(PROTECTED_MIGRATION_MAX_VERSION, 48);
  assert.equal(migrationVersion("048_availability_notifications.sql"), 48);
  assert.equal(isProtectedMigration("001_initial_schema.sql"), true);
  assert.equal(isProtectedMigration("048_availability_notifications.sql"), true);
  assert.equal(isProtectedMigration("049_future_feature.sql"), false);
});

test("clean databases may bootstrap protected history while existing databases refuse replay", () => {
  assert.equal(refusesProtectedReplay(false, "001_initial_schema.sql"), false);
  assert.equal(refusesProtectedReplay(false, "048_availability_notifications.sql"), false);
  assert.equal(refusesProtectedReplay(true, "048_availability_notifications.sql"), true);
  assert.equal(refusesProtectedReplay(true, "049_future_feature.sql"), false);
});

test("audit coverage reports missing and orphan protected definitions", () => {
  const files = ["001_initial_schema.sql", "048_availability_notifications.sql", "049_future_feature.sql"];
  assert.deepEqual(auditCoverage(files, ["001_initial_schema.sql"]), {
    missingChecks: ["048_availability_notifications.sql"],
    orphanChecks: [],
  });
  assert.deepEqual(
    auditCoverage(["001_initial_schema.sql"], ["001_initial_schema.sql", "048_removed.sql"]),
    { missingChecks: [], orphanChecks: ["048_removed.sql"] },
  );
});
