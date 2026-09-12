import test from "node:test";
import assert from "node:assert/strict";
import { closeStaleTaskSession } from "../src/services/taskPresence.service.js";

const executor = (responses) => ({
  calls: [],
  async execute(sql, params = []) {
    this.calls.push({ sql, params });
    if (!responses.length) throw new Error(`Unexpected query: ${sql}`);
    return responses.shift();
  },
});

test("stale presence closes at the timeout boundary and records one event", async () => {
  const db = executor([
    [[{ taskId: 4 }]],
    [[{ id: 4 }]],
    [[{ id: 12, taskId: 4, employeeId: 7, startedAt: "2026-09-10 20:00:00" }]],
    [[{ timeoutMinutes: 5 }]],
    [[{ lastSeenAt: "2026-09-10 21:10:00" }]],
    [[{ serverTime: "2026-09-10 21:17:00", effectiveEndAt: "2026-09-10 21:15:00" }]],
    [{ affectedRows: 1 }],
    [{ affectedRows: 1 }],
    [{ affectedRows: 1 }],
  ]);
  const result = await closeStaleTaskSession(db, 12);
  assert.equal(result.effectiveEndAt, "2026-09-10 21:15:00");
  assert.deepEqual(db.calls[6].params, [
    "2026-09-10 21:15:00",
    "2026-09-10 21:15:00",
    12,
  ]);
  assert.match(db.calls[6].sql, /end_reason='OFFLINE'/);
  assert.match(db.calls[7].params[0], /OFFLINE_TIMEOUT/);
});

test("fresh heartbeat wins revalidation and leaves session active", async () => {
  const db = executor([
    [[{ taskId: 4 }]],
    [[{ id: 4 }]],
    [[{ id: 12, taskId: 4, employeeId: 7, startedAt: "2026-09-10 20:00:00" }]],
    [[{ timeoutMinutes: 5 }]],
    [[{ lastSeenAt: "2026-09-10 21:14:59" }]],
    [[{ serverTime: "2026-09-10 21:15:01", effectiveEndAt: "2026-09-10 21:19:59" }]],
  ]);
  assert.equal(await closeStaleTaskSession(db, 12), null);
  assert.equal(db.calls.length, 6);
});

test("an already closed session is skipped without overwriting its reason", async () => {
  const db = executor([[[]]]);
  assert.equal(await closeStaleTaskSession(db, 12), null);
  assert.equal(db.calls.length, 1);
});
