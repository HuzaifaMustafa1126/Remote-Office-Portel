import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import pool from "../src/config/database.js";
import * as tasks from "../src/services/task.service.js";

const ids = [];
let deletedId;
const cleanup = async () => {
  if (ids.length) await pool.query("DELETE FROM tasks WHERE id IN (?)", [ids]);
  if (deletedId) await pool.execute("DELETE FROM audit_logs WHERE entity_type='TASK' AND entity_id=? AND action='TASK_DELETED'", [deletedId]);
  await pool.end();
};
try {
  const [[actor]] = await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN') LIMIT 1");
  const [people] = await pool.execute("SELECT e.id FROM employees e JOIN users u ON u.employee_id=e.id WHERE e.status='ACTIVE' AND u.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) LIMIT 2");
  assert(actor && people.length >= 2, "Requires one manager and two active employees");
  const base = (title, employeeId, publishMode="NOW") => ({ title, description:"Phase 2.5 integration", priority:"MEDIUM", assignmentType:"DIRECT", assigneeEmployeeId:employeeId, publishMode, dueAt:"2026-09-20T12:00:00+05:00", reviewRequired:false, completionImageRequired:false });
  const a = await tasks.create(base("P25 Alpha", people[0].id), actor); ids.push(a.id);
  const b = await tasks.create(base("P25 Beta", people[0].id), actor); ids.push(b.id);
  const draft = await tasks.create(base("P25 Delete", people[0].id, "DRAFT"), actor); ids.push(draft.id);

  const list = await tasks.listManagement({ search:"P25", priority:"MEDIUM", employeeId:people[0].id, page:1, limit:25 });
  assert(list.items.length >= 3 && list.pagination.total >= 3);
  await tasks.update(a.id, { title:"P25 Alpha edited", priority:"HIGH" }, actor);
  await tasks.changeDeadline(a.id, { dueAt:"2026-09-21T14:00:00+05:00", reason:"Customer timing" }, actor);
  const [[deadlineActivity]] = await pool.execute("SELECT metadata FROM task_activities WHERE task_id=? AND event_type='TASK_DEADLINE_CHANGED' ORDER BY id DESC LIMIT 1", [a.id]);
  const deadlineMeta = JSON.parse(deadlineActivity.metadata);
  assert(deadlineMeta.previousDueAt && deadlineMeta.newDueAt);

  await tasks.assign(a.id, { employeeId:people[1].id }, actor);
  const [[unstarted]] = await pool.execute("SELECT status,assignee_employee_id FROM tasks WHERE id=?", [a.id]);
  assert.equal(unstarted.status, "TO_DO"); assert.equal(Number(unstarted.assignee_employee_id), Number(people[1].id));

  await pool.execute("UPDATE tasks SET status='IN_PROGRESS' WHERE id=?", [b.id]);
  await pool.execute("INSERT INTO task_work_sessions(task_id,employee_id,started_at) VALUES(?,?,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 2 MINUTE))", [b.id, people[0].id]);
  await assert.rejects(tasks.assign(b.id, { employeeId:people[1].id }, actor), /reason is required/);
  await tasks.assign(b.id, { employeeId:people[1].id, reason:"Coverage handoff" }, actor);
  const [[session]] = await pool.execute("SELECT state,end_reason,duration_seconds FROM task_work_sessions WHERE task_id=? AND employee_id=?", [b.id, people[0].id]);
  const [[started]] = await pool.execute("SELECT status,assignee_employee_id FROM tasks WHERE id=?", [b.id]);
  assert.equal(session.state, "ENDED"); assert.equal(session.end_reason, "REASSIGNED"); assert(Number(session.duration_seconds) >= 0);
  assert.equal(started.status, "TO_DO"); assert.equal(Number(started.assignee_employee_id), Number(people[1].id));

  await pool.execute("UPDATE tasks SET status='COMPLETED',completed_at=CURRENT_TIMESTAMP WHERE id=?", [a.id]);
  const bulk = await tasks.bulk({ taskIds:[a.id,b.id], action:"ARCHIVE" }, actor);
  assert.equal(bulk.updated, 1); assert.equal(bulk.skipped, 1);
  await tasks.transition(a.id, { status:"COMPLETED" }, actor);
  const [[restored]] = await pool.execute("SELECT status FROM tasks WHERE id=?", [a.id]);
  assert.equal(restored.status, "COMPLETED");

  await tasks.uploadReferenceImage(draft.id, {extension:"png",originalFilename:"proof.png",mimeType:"image/png",sizeBytes:8}, Buffer.from("89504e47","hex"), actor);
  deletedId = draft.id;
  await tasks.permanentlyDelete(draft.id, actor);
  ids.splice(ids.indexOf(draft.id),1);
  const [[missing]] = await pool.execute("SELECT COUNT(*) total FROM tasks WHERE id=?", [draft.id]);
  const [[deletionAudit]] = await pool.execute("SELECT old_values FROM audit_logs WHERE entity_type='TASK' AND entity_id=? AND action='TASK_DELETED'", [draft.id]);
  assert.equal(Number(missing.total), 0); assert(deletionAudit);
  await assert.rejects(access(new URL(`../uploads/tasks/${draft.id}`, import.meta.url)));
  console.log(JSON.stringify({ok:true, managementRows:list.items.length, bulk, reassignment:{session,task:started}, deletionAudit:true}));
} finally {
  await cleanup();
}
