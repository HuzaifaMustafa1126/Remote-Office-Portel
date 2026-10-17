import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("employee deletion is retention-safe and revokes access without deleting records", () => {
  const source = fs.readFileSync(new URL("../src/services/employee.service.js", import.meta.url), "utf8");
  const deletion = source.slice(source.indexOf("export async function deleteEmployee"), source.indexOf("export async function assignRole"));
  assert.match(deletion, /auth_sessions SET status='REVOKED'/);
  assert.match(deletion, /UPDATE users SET status='INACTIVE'/);
  assert.match(deletion, /deleted_at=CURRENT_TIMESTAMP/);
  assert.doesNotMatch(deletion, /DELETE FROM (users|employees|work_notes|twofa_|audit_logs|leave_requests|payroll_items)/);
});

test("retained note and 2FA attribution identifies former employees", () => {
  const note = fs.readFileSync(new URL("../src/services/note.service.js", import.meta.url), "utf8");
  const replies = fs.readFileSync(new URL("../src/services/noteReply.service.js", import.meta.url), "utf8");
  const profile = fs.readFileSync(new URL("../src/services/twofa.service.js", import.meta.url), "utf8");
  const platform = fs.readFileSync(new URL("../src/services/twofaPlatform.service.js", import.meta.url), "utf8");
  for (const source of [note, replies, profile, platform]) assert.match(source, /Former Employee/);
});

