import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DB_USER = "test";
process.env.JWT_SECRET = "test-only-secret-for-login-notification-tests";
const { default: pool } = await import("../src/config/database.js");
const { default: bcrypt } = await import("bcrypt");
const { loginUser } = await import("../src/services/auth.service.js");

function setup(t, { valid = true, employeeId = 7, notificationFails = false, commitFails = false } = {}) {
  let committed = false;
  const notifications = [];
  const connection = {
    beginTransaction: async () => {},
    execute: async (sql) => sql.startsWith("SELECT expires_at")
      ? [[{ expiresAt: "2026-09-06 01:00:00" }]] : [{}],
    commit: async () => {
      if (commitFails) throw new Error("Commit failed");
      committed = true;
    },
    rollback: async () => {},
    release: () => {},
  };
  t.mock.method(bcrypt, "compare", async () => valid);
  t.mock.method(pool, "getConnection", async () => connection);
  t.mock.method(pool, "execute", async (sql, params) => {
    if (sql.includes("password_hash")) return [[{
      id: 2, employee_id: employeeId, email: "employee@example.com",
      password_hash: "mock", status: "ACTIVE",
    }]];
    if (sql.includes("must_change_password")) return [[{
      id: 2, employeeId, name: "Ali Khan", email: "employee@example.com",
    }]];
    if (sql.startsWith("SELECT r.name")) return [[{ name: "EMPLOYEE" }]];
    if (sql.startsWith("SELECT DISTINCT p.name")) return [[]];
    if (sql.startsWith("SELECT DISTINCT u.id")) {
      assert.equal(committed, true, "Notify only after the login commits");
      assert.deepEqual(params, ["CEO", "ADMIN"]);
      assert.match(sql, /u.status='ACTIVE'/);
      if (notificationFails) throw new Error("Notifications unavailable");
      return [[{ id: 10 }, { id: 11 }]];
    }
    if (sql.includes("INSERT INTO notifications")) {
      notifications.push(params);
      return [{ insertId: params[0] }];
    }
    if (sql.includes("FROM notifications")) return [[{ id: params[0], userId: params[0] }]];
    if (sql.startsWith("INSERT INTO audit_logs")) return [{}];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  return notifications;
}

test("successful employee login persists a named notification for each administrator", async (t) => {
  const notifications = setup(t);
  const result = await loginUser("employee@example.com", "password");
  assert.ok(result.token);
  assert.equal(notifications.length, 2);
  for (const [index, values] of notifications.entries()) {
    assert.deepEqual(values, [
      10 + index, "ATTENDANCE_PORTAL_LOGIN", "Employee logged in",
      "Ali Khan logged in to the portal.", "EMPLOYEE", 7, "/employees/7",
    ]);
  }
});

test("failed credentials do not notify administrators", async (t) => {
  const notifications = setup(t, { valid: false });
  await assert.rejects(loginUser("employee@example.com", "wrong"), /Invalid email or password/);
  assert.equal(notifications.length, 0);
});

test("failed session commit does not notify administrators", async (t) => {
  const notifications = setup(t, { commitFails: true });
  await assert.rejects(loginUser("employee@example.com", "password"), /Commit failed/);
  assert.equal(notifications.length, 0);
});

test("accounts without an employee do not send employee login notifications", async (t) => {
  const notifications = setup(t, { employeeId: null });
  assert.ok((await loginUser("employee@example.com", "password")).token);
  assert.equal(notifications.length, 0);
});

test("notification failures do not reject a successful login", async (t) => {
  setup(t, { notificationFails: true });
  const logged = t.mock.method(console, "error", () => {});
  assert.ok((await loginUser("employee@example.com", "password")).token);
  assert.equal(logged.mock.callCount(), 1);
});
