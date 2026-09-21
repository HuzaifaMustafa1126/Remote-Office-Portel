import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  completeOngoingWork,
  pauseActiveOngoingWork,
  startOngoingWork,
} from "../src/services/ongoingWork.service.js";
import {
  completionSchema,
  teamActiveSchema,
  teamCompletedSchema,
} from "../src/validators/ongoingWork.validator.js";

test("completion note validation trims content and rejects whitespace", () => {
  assert.equal(completionSchema.safeParse({ completionNote: " \n  " }).success, false);
  const parsed = completionSchema.parse({ completionNote: "  Finished work  " });
  assert.equal(parsed.completionNote, "Finished work");
  assert.equal(
    completionSchema.safeParse({ completionNote: "x".repeat(1001) }).success,
    false,
  );
});

test("management filters allow only bounded, parameterizable values", () => {
  assert.equal(teamActiveSchema.parse({ status: "WORKING" }).status, "WORKING");
  assert.equal(teamActiveSchema.safeParse({ status: "IN_PROGRESS" }).success, false);
  assert.equal(teamCompletedSchema.parse({ page: "2", limit: "20" }).page, 2);
  assert.equal(
    teamCompletedSchema.safeParse({ date: "CUSTOM", from: "2026-09-22", to: "2026-09-21" }).success,
    false,
  );
  assert.equal(teamCompletedSchema.safeParse({ limit: "500" }).success, false);
});

test("management migration grants read-only permission and adds the completed index", () => {
  const sql = fs.readFileSync(
    new URL("../database/migrations/051_team_ongoing_work_monitoring.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /ongoing_work\.view_team/);
  assert.match(sql, /IN\('CEO','ADMIN','SUPER_ADMIN'\)/);
  assert.match(sql, /ON ongoing_work\(status,completed_at,employee_id\)/);
});

test("timer migration enforces one active ongoing-work timer per employee", () => {
  const sql = fs.readFileSync(
    new URL("../database/migrations/050_ongoing_work_time_tracking.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /active_employee_id[\s\S]*IF\(ended_at IS NULL,employee_id,NULL\)/);
  assert.match(sql, /UNIQUE KEY uq_one_active_ongoing_work_per_employee\(active_employee_id\)/);
  assert.match(sql, /duration_seconds BIGINT UNSIGNED/);
  assert.match(sql, /UPDATE ongoing_work SET status='PAUSED' WHERE status='WORKING'/);
});

test("pause finalizes a session once using database timestamps", async () => {
  const calls = [];
  const executor = {
    async execute(sql, params) {
      calls.push({ sql, params });
      if (sql.includes("FROM ongoing_work_sessions s"))
        return [[{ id: 9, ongoingWorkId: 12 }]];
      if (sql.includes("UPDATE ongoing_work_sessions"))
        return [{ affectedRows: 1 }];
      return [{ affectedRows: 1 }];
    },
  };
  assert.equal(await pauseActiveOngoingWork(executor, 7, 12), 12);
  assert.match(calls[1].sql, /ended_at=CURRENT_TIMESTAMP/);
  assert.match(calls[1].sql, /TIMESTAMPDIFF\(SECOND,started_at,CURRENT_TIMESTAMP\)/);
  assert.deepEqual(calls[1].params, [9]);
  assert.match(calls[2].sql, /status='PAUSED'/);
});

test("pause is data-safe when no active session exists", async () => {
  const executor = { execute: async () => [[]] };
  assert.equal(await pauseActiveOngoingWork(executor, 7, 12), null);
});

function timerExecutor(activeWorkId, { attendance = true, breakActive = false } = {}) {
  const calls = [];
  const statuses = new Map([
    [11, "WORKING"],
    [12, "PAUSED"],
  ]);
  return {
    calls,
    async execute(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("SELECT EXISTS(SELECT 1 FROM user_roles"))
        return [[{ yes: 0 }]];
      if (sql.includes("SELECT id FROM employees")) return [[]];
      if (sql.includes("FROM attendance_records") && sql.includes("status IN"))
        return attendance ? [[{ id: 81, status: breakActive ? "ON_BREAK" : "WORKING" }]] : [[]];
      if (sql.includes("FROM attendance_breaks"))
        return breakActive ? [[{ id: 91, breakStartedAt: "2026-09-21 21:00:00" }]] : [[]];
      if (sql.includes("SELECT id,ongoing_work_id ongoingWorkId,started_at startedAt"))
        return [[]];
      if (sql.includes("SELECT id,ongoing_work_id ongoingWorkId FROM ongoing_work_sessions"))
        return [[]];
      if (sql.startsWith("SELECT ow.id")) {
        const id = Number(params[0]);
        return [[{
          id,
          employeeId: 7,
          title: id === 11 ? "Work A" : "Work B",
          status: statuses.get(id),
          totalTimeSpent: id === 11 ? 120 : 0,
          serverTime: "2026-09-21 20:45:30",
        }]];
      }
      if (sql.includes("JOIN ongoing_work ow ON ow.id=s.ongoing_work_id"))
        return [[{ id: 31, ongoingWorkId: activeWorkId, title: "Work A" }]];
      if (sql === "SELECT CURRENT_TIMESTAMP switchTime")
        return [[{ switchTime: "2026-09-21 20:45:30" }]];
      if (sql.includes("FROM ongoing_work_sessions s") && !sql.includes("JOIN"))
        return [[{ id: 31, ongoingWorkId: activeWorkId }]];
      if (sql.includes("UPDATE ongoing_work_sessions"))
        return [{ affectedRows: 1 }];
      if (sql.includes("SET status='PAUSED'")) {
        statuses.set(Number(params[0]), "PAUSED");
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("INSERT INTO ongoing_work_sessions"))
        return [{ insertId: 32, affectedRows: 1 }];
      if (sql.includes("SET status='WORKING'")) {
        statuses.set(Number(params[0]), "WORKING");
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test("starting the already-active item is idempotent", async () => {
  const executor = timerExecutor(12);
  const result = await startOngoingWork(executor, 12, { id: 7, employee_id: 7 });
  assert.equal(result.activeWork.id, 12);
  assert.equal(result.pausedWork, null);
  assert.equal(
    executor.calls.some((call) => call.sql.includes("INSERT INTO ongoing_work_sessions")),
    false,
  );
});

test("switch closes the old session and starts the new one at one timestamp", async () => {
  const executor = timerExecutor(11);
  const result = await startOngoingWork(executor, 12, { id: 7, employee_id: 7 });
  assert.equal(result.pausedWork.id, 11);
  assert.equal(result.pausedWork.status, "PAUSED");
  assert.equal(result.activeWork.id, 12);
  assert.equal(result.activeWork.status, "WORKING");
  const close = executor.calls.find((call) => call.sql.includes("UPDATE ongoing_work_sessions"));
  const insert = executor.calls.find((call) => call.sql.includes("INSERT INTO ongoing_work_sessions"));
  assert.equal(close.params[0], "2026-09-21 20:45:30");
  assert.equal(close.params[1], "2026-09-21 20:45:30");
  assert.equal(insert.params[3], 81);
  assert.equal(insert.params[4], "2026-09-21 20:45:30");
  assert.equal(result.serverTime, "2026-09-21 20:45:30");
});

test("start and resume require an authoritative active attendance record", async () => {
  const executor = timerExecutor(null, { attendance: false });
  await assert.rejects(
    () => startOngoingWork(executor, 12, { id: 7, employee_id: 7 }),
    (error) => error.statusCode === 409 && error.code === "ATTENDANCE_REQUIRED",
  );
  assert.equal(
    executor.calls.some((call) => call.sql.includes("INSERT INTO ongoing_work_sessions")),
    false,
  );
});

test("attendance-link migration keeps legacy sessions nullable", () => {
  const sql = fs.readFileSync(
    new URL("../database/migrations/052_ongoing_work_attendance_link.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /attendance_record_id BIGINT UNSIGNED NULL/);
  assert.match(sql, /REFERENCES attendance_records\(id\) ON DELETE RESTRICT/);
  assert.match(sql, /idx_ongoing_work_sessions_attendance/);
});

test("active break blocks start, resume, and switch", async () => {
  const executor = timerExecutor(null, { breakActive: true });
  await assert.rejects(
    () => startOngoingWork(executor, 12, { id: 7, employee_id: 7 }),
    (error) => error.statusCode === 409 && error.code === "BREAK_ACTIVE",
  );
  assert.equal(
    executor.calls.some((call) => call.sql.includes("INSERT INTO ongoing_work_sessions")),
    false,
  );
});

test("break-context migration stores only a nullable previous-work reference", () => {
  const sql = fs.readFileSync(
    new URL("../database/migrations/053_break_ongoing_work_context.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /auto_paused_ongoing_work_id BIGINT UNSIGNED NULL/);
  assert.match(sql, /REFERENCES ongoing_work\(id\) ON DELETE SET NULL/);
});

test("break start uses one timestamp and break end does not resume ongoing work", () => {
  const source = fs.readFileSync(
    new URL("../src/services/attendance.service.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /SELECT CURRENT_TIMESTAMP breakStartTime/);
  assert.match(source, /pauseActiveOngoingWork\([\s\S]*?clock\.breakStartTime/);
  assert.doesNotMatch(source, /resumeOngoingWorkAfterBreak/);
  assert.match(source, /previousOngoingWork/);
});

test("clock out shares its authoritative timestamp with ongoing-work pause", () => {
  const source = fs.readFileSync(
    new URL("../src/services/attendance.service.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /SELECT CURRENT_TIMESTAMP clockOutTime/);
  assert.match(
    source,
    /pauseActiveOngoingWork\([\s\S]*?clock\.clockOutTime,[\s\S]*?SET clock_out_at = \?/,
  );
  assert.match(source, /ONGOING_WORK_AUTO_PAUSED_CLOCK_OUT/);
});

function completionExecutor({ status = "WORKING", active = true, total = 3671 } = {}) {
  const calls = [];
  let currentStatus = status;
  return {
    calls,
    async execute(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("SELECT EXISTS(SELECT 1 FROM user_roles")) return [[{ yes: 0 }]];
      if (sql.includes("SELECT id FROM employees")) return [[]];
      if (sql.includes("SELECT id FROM attendance_records")) return [[{ id: 81 }]];
      if (sql.startsWith("SELECT ow.id"))
        return [[{
          id: 12,
          employeeId: 7,
          title: "Work B",
          status: currentStatus,
          completionNote: currentStatus === "COMPLETED" ? "Finished safely" : null,
          totalTimeSpent: currentStatus === "COMPLETED" ? total : 0,
        }]];
      if (sql === "SELECT CURRENT_TIMESTAMP completionTime")
        return [[{ completionTime: "2026-09-21 22:14:30" }]];
      if (sql.includes("FROM ongoing_work_sessions s"))
        return active ? [[{ id: 44, ongoingWorkId: 12 }]] : [[]];
      if (sql.includes("UPDATE ongoing_work_sessions")) return [{ affectedRows: 1 }];
      if (sql.includes("SET status='PAUSED'")) {
        currentStatus = "PAUSED";
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("SUM(COALESCE(duration_seconds")) return [[{ totalSeconds: total }]];
      if (sql.includes("SET status='COMPLETED'")) {
        currentStatus = "COMPLETED";
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test("completion atomically closes a running timer at the completion timestamp", async () => {
  const executor = completionExecutor();
  const result = await completeOngoingWork(
    executor,
    12,
    { completionNote: "Finished safely" },
    { id: 7, employee_id: 7 },
  );
  const close = executor.calls.find((call) => call.sql.includes("UPDATE ongoing_work_sessions"));
  const finish = executor.calls.find((call) => call.sql.includes("SET status='COMPLETED'"));
  assert.deepEqual(close.params.slice(0, 2), ["2026-09-21 22:14:30", "2026-09-21 22:14:30"]);
  assert.equal(finish.params[0], "Finished safely");
  assert.equal(finish.params[1], "2026-09-21 22:14:30");
  assert.equal(finish.params[2], 3671);
  assert.equal(result.work.status, "COMPLETED");
});

test("completion allows paused work with zero tracked time", async () => {
  const executor = completionExecutor({ status: "PAUSED", active: false, total: 0 });
  const result = await completeOngoingWork(
    executor,
    12,
    { completionNote: "Sent the update" },
    { id: 7, employee_id: 7 },
  );
  assert.equal(result.work.status, "COMPLETED");
  assert.equal(result.work.totalTimeSpent, 0);
  assert.equal(executor.calls.some((call) => call.sql.includes("UPDATE ongoing_work_sessions")), false);
});

test("duplicate completion preserves the original completed state", async () => {
  const executor = completionExecutor({ status: "COMPLETED", active: false });
  await assert.rejects(
    () => completeOngoingWork(
      executor,
      12,
      { completionNote: "Changed note" },
      { id: 7, employee_id: 7 },
    ),
    (error) => error.statusCode === 409 && error.code === "ONGOING_WORK_COMPLETED",
  );
  assert.equal(executor.calls.some((call) => call.sql.includes("SET status='COMPLETED'")), false);
});
