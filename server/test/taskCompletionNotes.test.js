import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createSchema as noteCreateSchema } from "../src/validators/note.validator.js";
import { finalizeWithNoteSchema } from "../src/validators/task.validator.js";

const note={title:"Homepage redesign",summary:"Responsive homepage work completed.",content:"Implemented the homepage, verified mobile navigation, and tested the final result.",visibility:"TEAM",isImportant:false};

test("standalone and task-context notes validate without categories",()=>{
  assert.equal(noteCreateSchema.safeParse(note).success,true);
  assert.equal(finalizeWithNoteSchema.safeParse({action:"COMPLETE",note}).success,true);
  assert.equal(finalizeWithNoteSchema.safeParse({action:"SUBMIT_FOR_REVIEW",note}).success,true);
});

test("finalization is transactionally locked and closes existing task sessions",async()=>{
  const source=await readFile(new URL("../src/services/task.service.js",import.meta.url),"utf8");
  assert.match(source,/export async function finalizeWithNote/);
  assert.match(source,/SELECT \* FROM tasks WHERE id=\? FOR UPDATE/);
  assert.match(source,/createTaskNoteWithinTransaction\(c, task/);
  assert.match(source,/reason:target === "COMPLETED" \? "COMPLETED" : "SUBMITTED"/);
  assert.match(source,/task\.status !== "IN_PROGRESS"/);
  assert.match(source,/TASK_NOTE_REQUIRED/);
});

test("task note creation preserves multiple-note history and uses no category",async()=>{
  const source=await readFile(new URL("../src/services/note.service.js",import.meta.url),"utf8");
  const migration=await readFile(new URL("../database/migrations/071_task_completion_notes.sql",import.meta.url),"utf8");
  assert.match(source,/INSERT INTO work_notes[\s\S]*related_task_id[\s\S]*related_task_title/);
  assert.doesNotMatch(migration,/UNIQUE[\s\S]*related_task_id/i);
  assert.match(migration,/MODIFY category_id BIGINT UNSIGNED NULL/);
});

test("active task comment routes are retired while historical storage remains untouched",async()=>{
  const routes=await readFile(new URL("../src/routes/task.routes.js",import.meta.url),"utf8");
  const migration=await readFile(new URL("../database/migrations/026_task_collaboration.sql",import.meta.url),"utf8");
  assert.doesNotMatch(routes,/\/:id\/comments/);
  assert.match(migration,/CREATE TABLE task_attachments/);
  assert.doesNotMatch(await readFile(new URL("../database/migrations/071_task_completion_notes.sql",import.meta.url),"utf8"),/DROP TABLE task_comments/i);
});
