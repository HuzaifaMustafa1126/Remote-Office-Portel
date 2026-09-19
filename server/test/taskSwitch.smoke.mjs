import assert from "node:assert/strict";
import pool from "../src/config/database.js";
import { startTaskSession } from "../src/services/taskTime.service.js";

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const unique = `task-switch-${Date.now()}`;
  const [employeeResult] = await connection.execute(
    `INSERT INTO employees
      (employee_code,first_name,last_name,email,job_title,department,joining_date,status)
     VALUES(?,'Task','Switch',?,'Test','Test',CURRENT_DATE,'ACTIVE')`,
    [unique, `${unique}@example.invalid`],
  );
  const employeeId = Number(employeeResult.insertId);
  const [userResult] = await connection.execute(
    "INSERT INTO users(employee_id,email,password_hash,status)VALUES(?,?,?,'ACTIVE')",
    [employeeId, `${unique}@example.invalid`, "not-a-login-account"],
  );
  const userId = Number(userResult.insertId);
  const createTask = async (title) => {
    const [result] = await connection.execute(
      `INSERT INTO tasks
        (title,priority,assignment_type,assignee_employee_id,status,publish_mode,created_by)
       VALUES(?,'MEDIUM','DIRECT',?,'IN_PROGRESS','NOW',?)`,
      [title, employeeId, userId],
    );
    return Number(result.insertId);
  };
  const taskA = await createTask("Switch smoke A");
  const taskB = await createTask("Switch smoke B");

  await startTaskSession(connection, { taskId: taskA, employeeId });
  await assert.rejects(
    () => startTaskSession(connection, { taskId: taskB, employeeId }),
    (error) => error.code === "TASK_SWITCH_REQUIRED",
  );
  const switched = await startTaskSession(connection, {
    taskId: taskB,
    employeeId,
    switchExisting: true,
    expectedActiveTaskId: taskA,
  });
  assert.equal(switched.switchedFromTaskId, taskA);

  const [sessions] = await connection.execute(
    `SELECT task_id taskId,state,end_reason endReason
     FROM task_work_sessions WHERE employee_id=? ORDER BY id`,
    [employeeId],
  );
  assert.deepEqual(
    sessions.map((row) => [Number(row.taskId), row.state, row.endReason]),
    [
      [taskA, "ENDED", "PAUSED"],
      [taskB, "ACTIVE", null],
    ],
  );
  const [[active]] = await connection.execute(
    "SELECT COUNT(*) total FROM task_work_sessions WHERE employee_id=? AND state='ACTIVE'",
    [employeeId],
  );
  assert.equal(Number(active.total), 1);
  const [tasks] = await connection.execute(
    "SELECT status FROM tasks WHERE id IN(?,?) ORDER BY id",
    [taskA, taskB],
  );
  assert.deepEqual(
    tasks.map((task) => task.status),
    ["IN_PROGRESS", "IN_PROGRESS"],
  );
  await assert.rejects(
    () =>
      startTaskSession(connection, {
        taskId: taskA,
        employeeId,
        switchExisting: true,
        expectedActiveTaskId: taskA,
      }),
    (error) => error.code === "TASK_SWITCH_CONFLICT",
  );
  console.log("Atomic task switching smoke test passed.");
} finally {
  await connection.rollback();
  connection.release();
  await pool.end();
}
