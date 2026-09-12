import test from "node:test";
import assert from "node:assert/strict";
process.env.JWT_SECRET="task-notification-policy-test-secret";
const pool=(await import("../src/config/database.js")).default;
const {notifyByPolicy}=await import("../src/services/notification.service.js");

test("contextual task assignee is not lost behind an empty SELECTED_EMPLOYEES policy",async t=>{
 const calls=[];let inserted=0;
 t.mock.method(pool,"execute",async(sql,params=[])=>{
  calls.push({sql,params});
  if(sql.startsWith("SELECT * FROM notification_policies"))return [[{id:9,audience_type:"SELECTED_EMPLOYEES",notify_actor:0,in_app_enabled:1,desktop_enabled:1,sound_enabled:1,push_enabled:0}]];
  if(sql.startsWith("SELECT DISTINCT u.id"))return [[{id:44}]];
  if(sql.includes("notificationsEnabled"))return [[{notificationsEnabled:1,globalInApp:1,globalDesktop:1,globalSound:1,doNotDisturb:0,categoryEnabled:1,eventInApp:null,eventDesktop:null,eventSound:null}]];
  if(sql.includes("INSERT IGNORE INTO notifications")){inserted++;return [{insertId:77}]}
  if(sql.includes("FROM notifications")&&sql.includes("WHERE id=?"))return [[{id:77,userId:44,type:"TASK_ASSIGNED"}]];
  throw new Error(`Unexpected SQL: ${sql}`);
 });
 const result=await notifyByPolicy("TASK_ASSIGNED",{id:1,employee_id:1},{recipientUserIds:[44],title:"Assigned",message:"Task",referenceType:"TASK",referenceId:8,eventKey:"TASK_ASSIGNED:8"});
 assert.equal(inserted,1);assert.equal(result.length,1);
 const recipientQuery=calls.find(call=>call.sql.startsWith("SELECT DISTINCT u.id"));
 assert.match(recipientQuery.sql,/u\.id IN\(\?\)/);assert.doesNotMatch(recipientQuery.sql,/notification_policy_employees/);
});
