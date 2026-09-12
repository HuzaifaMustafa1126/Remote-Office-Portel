import test from "node:test";
import assert from "node:assert/strict";
import {
  endTaskSession,
  getTaskTimeTracking,
  pauseActiveTask,
  resumeTaskAfterBreak,
  startTaskSession,
} from "../src/services/taskTime.service.js";
import { assertTransition } from "../src/utils/taskStatus.js";

const executor = (responses) => ({
  calls: [],
  async execute(sql, params = []) {
    this.calls.push({ sql, params });
    if (!responses.length) throw new Error(`Unexpected query: ${sql}`);
    return responses.shift();
  },
});

test("startTaskSession locks employee and creates one server-timestamped session", async () => {
  const db = executor([
    [[{ id: 7 }]],
    [[]],
    [{ insertId: 12 }],
    [[{ id: 12, taskId: 4, employeeId: 7, startedAt: "2026-09-10T09:00:00Z" }]],
  ]);
  const session = await startTaskSession(db, { taskId: 4, employeeId: 7 });
  assert.equal(session.id, 12);
  assert.match(db.calls[0].sql, /employees.+FOR UPDATE/);
  assert.match(db.calls[2].sql, /CURRENT_TIMESTAMP/);
  assert.deepEqual(db.calls[2].params, [4, 7]);
});

test("startTaskSession rejects an existing employee session", async () => {
  const db = executor([[[{ id: 7 }]], [[{ id: 2, taskId: 3 }]]]);
  await assert.rejects(
    startTaskSession(db, { taskId: 4, employeeId: 7 }),
    (error) => error.statusCode === 409 && error.code === "TASK_SESSION_ACTIVE",
  );
  assert.equal(db.calls.length, 2);
});

test("endTaskSession requires an active session and uses a server timestamp", async () => {
  const missing = executor([[[]]]);
  await assert.rejects(
    endTaskSession(missing, { taskId: 4, employeeId: 7, reason: "COMPLETED" }),
    (error) => error.statusCode === 409 && error.code === "TASK_SESSION_MISSING",
  );
  const db = executor([[[{ id: 9, employeeId: 7 }]], [{ affectedRows: 1 }]]);
  await endTaskSession(db, { taskId: 4, employeeId: 7, reason: "SUBMITTED" });
  assert.match(db.calls[1].sql, /ended_at=CURRENT_TIMESTAMP/);
  assert.deepEqual(db.calls[1].params, ["SUBMITTED", 9]);
});

test("getTaskTimeTracking returns totals and preserves contributor ownership", async () => {
  const db = executor([
    [[{ serverTime: "2026-09-10T10:00:00Z" }]],
    [[{ completedSeconds: 3600, activeSeconds: 600, activeSessionStartedAt: "2026-09-10T09:50:00Z", activeEmployeeId: 8 }]],
    [[
      { employeeId: 7, name: "Ali Ahmed", totalSeconds: 3600, sessionCount: 2 },
      { employeeId: 8, name: "Sara Khan", totalSeconds: 600, sessionCount: 1 },
    ]],
  ]);
  const result = await getTaskTimeTracking(db, 4);
  assert.equal(result.totalSeconds, 4200);
  assert.equal(result.isRunning, true);
  assert.equal(result.activeEmployeeId, 8);
  assert.deepEqual(result.contributors.map((row) => row.employeeId), [7, 8]);
});

test("clock-out pause closes the authoritative session and records task activity", async () => {
  const db = executor([
    [[{ id: 21, taskId: 4 }]],
    [[{ id: 21, employeeId: 7, startedAt: "2026-09-10T09:00:00Z" }]],
    [{ affectedRows: 1 }],
    [{ affectedRows: 1 }],
  ]);
  const taskId = await pauseActiveTask(db, 7, "CLOCK_OUT");
  assert.equal(taskId, 4);
  assert.match(db.calls[2].sql, /ended_at=CURRENT_TIMESTAMP/);
  assert.equal(db.calls[2].params[0], "CLOCK_OUT");
  assert.match(db.calls[3].sql, /WORK_SESSION_PAUSED/);
  assert.match(db.calls[3].params[0], /CLOCK_OUT/);
});

test("clock-out pause is a no-op when no task session is active", async () => {
  const db = executor([[[]]]);
  assert.equal(await pauseActiveTask(db, 7, "CLOCK_OUT"), null);
  assert.equal(db.calls.length, 1);
});

test("break end resumes only the exact recorded task with a new session", async () => {
  const db = executor([
    [[{ id: 7 }]],
    [[{ id: 31 }]],
    [[{ id: 4 }]],
    [[]],
    [[{ id: 7 }]],
    [[]],
    [{ insertId: 22 }],
    [[{ id: 22, taskId: 4, employeeId: 7, startedAt: "2026-09-10T10:00:00Z" }]],
    [{ affectedRows: 1 }],
  ]);
  const taskId = await resumeTaskAfterBreak(db, {
    employeeId: 7,
    taskId: 4,
    breakId: 9,
  });
  assert.equal(taskId, 4);
  assert.match(db.calls[2].sql, /assignee_employee_id=\?.+status='IN_PROGRESS'/);
  assert.match(db.calls[6].sql, /CURRENT_TIMESTAMP/);
  assert.match(db.calls[8].params[0], /"breakId":9/);
});

test("break end never infers a task when this break paused none", async () => {
  const db = executor([]);
  assert.equal(
    await resumeTaskAfterBreak(db, {
      employeeId: 7,
      taskId: null,
      breakId: 9,
    }),
    null,
  );
  assert.equal(db.calls.length, 0);
});

test("break end skips auto-resume when attendance or task eligibility changed", async () => {
  const noAttendance = executor([[[{ id: 7 }]], [[]]]);
  assert.equal(
    await resumeTaskAfterBreak(noAttendance, {
      employeeId: 7,
      taskId: 4,
      breakId: 9,
    }),
    null,
  );
  const reassigned = executor([[[{ id: 7 }]], [[{ id: 31 }]], [[]]]);
  assert.equal(
    await resumeTaskAfterBreak(reassigned, {
      employeeId: 7,
      taskId: 4,
      breakId: 9,
    }),
    null,
  );
});

test("break end skips auto-resume when another session already exists", async () => {
  const db = executor([
    [[{ id: 7 }]],
    [[{ id: 31 }]],
    [[{ id: 4 }]],
    [[{ id: 23 }]],
  ]);
  assert.equal(
    await resumeTaskAfterBreak(db, {
      employeeId: 7,
      taskId: 4,
      breakId: 9,
    }),
    null,
  );
  assert.equal(db.calls.length, 4);
});

test("an employee may manually resume an in-progress task without changing its status", () => {
  assert.doesNotThrow(() =>
    assertTransition("IN_PROGRESS", "IN_PROGRESS", { management: false }),
  );
  assert.doesNotThrow(() =>
    assertTransition("IN_PROGRESS", "IN_PROGRESS", {
      management: false,
      reviewRequired: true,
    }),
  );
});
