import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createSchema, reassignSchema, teamCalendarSchema, teamListSchema } from "../src/validators/scheduledWork.validator.js";

test("management creation requires a valid explicit assignee at the team boundary", () => {
  const base={title:"Team follow-up",scheduleType:"RELATIVE",relativeValue:2,relativeUnit:"HOURS",priority:"HIGH",reminders:[]};
  assert.equal(createSchema.safeParse({...base,assignedTo:7}).success,true);
  assert.equal(createSchema.safeParse({...base,assignedTo:0}).success,false);
});
test("reassignment scopes require an occurrence when recurrence semantics need one", () => {
  assert.equal(reassignSchema.safeParse({assignedTo:2,scope:"ONE_TIME"}).success,true);
  assert.equal(reassignSchema.safeParse({assignedTo:2,scope:"THIS_OCCURRENCE"}).success,false);
  assert.equal(reassignSchema.safeParse({assignedTo:2,scope:"FUTURE_OCCURRENCES",occurrenceId:9}).success,true);
});
test("team list and calendar enforce bounded server-side filter shapes", () => {
  assert.equal(teamListSchema.safeParse({type:"ALL",page:1,limit:20,search:"follow up"}).success,true);
  assert.equal(teamCalendarSchema.safeParse({from:"2026-01-01",to:"2027-02-01",type:"ALL"}).success,false);
});
test("team migration provisions granular permissions, assignment history, and assignee policies", () => {
  const sql=fs.readFileSync(new URL("../database/migrations/070_scheduled_work_team_scheduler.sql",import.meta.url),"utf8");
  for(const permission of ["scheduled_work.assign","scheduled_work.view_team","scheduled_work.manage_team","scheduled_work.reassign"])assert.match(sql,new RegExp(permission.replace(".","\\.")));
  assert.match(sql,/CREATE TABLE scheduled_work_assignment_history/);
  assert.match(sql,/SCHEDULED_WORK_ASSIGNED/);
  assert.match(sql,/SELECTED_EMPLOYEES/);
  assert.match(sql,/notify_actor,in_app_enabled/);
});
