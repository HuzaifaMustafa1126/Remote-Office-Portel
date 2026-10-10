import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { sanitizeTwofaActivityMetadata, TWOFA_ACTIVITY_ACTION_VALUES } from "../src/services/twofaActivity.service.js";
import { twofaHistoryQuerySchema } from "../src/validators/twofa.validator.js";

test("history filters are bounded and reject invalid date ranges and actions", () => {
  assert.equal(twofaHistoryQuerySchema.parse({}).limit, 20);
  assert.equal(twofaHistoryQuerySchema.safeParse({ limit: 101 }).success, false);
  assert.equal(twofaHistoryQuerySchema.safeParse({ action: "SECRET_VIEWED" }).success, false);
  assert.equal(twofaHistoryQuerySchema.safeParse({ dateFrom: "2026-10-11", dateTo: "2026-10-10" }).success, false);
  assert.ok(TWOFA_ACTIVITY_ACTION_VALUES.includes("ACCESS_UPDATED"));
});

test("activity metadata uses an allowlist and strips credential-shaped fields", () => {
  assert.deepEqual(sanitizeTwofaActivityMetadata({
    operation: "REVEAL_AUTH_KEY",
    password: "never-log-me",
    ciphertext: "never-log-me",
    value: "never-log-me",
    permissions: { canView: true, injectedSecret: "never-log-me" },
  }), { operation: "REVEAL_AUTH_KEY", permissions: { canView: true } });
});

test("profile and global history routes require the history permission", () => {
  const source = fs.readFileSync(new URL("../src/routes/twofa.routes.js", import.meta.url), "utf8");
  assert.equal((source.match(/permit\("2fa\.history\.view"\)/g) || []).length, 2);
  assert.match(source, /"\/profiles\/:profileId\/history"/);
  assert.match(source, /"\/history"/);
});

test("dedicated 2FA history is outside general audit cleanup scope", () => {
  const source = fs.readFileSync(new URL("../src/services/audit.service.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /DELETE FROM twofa_activity_logs/);
});
