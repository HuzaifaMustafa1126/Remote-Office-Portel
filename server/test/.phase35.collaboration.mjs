import assert from "node:assert/strict";
import pool from "../src/config/database.js";
import {get,mentionableUsers} from "../src/services/task.service.js";
try{
  const [[manager]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN') LIMIT 1");
  const [[owned]]=await pool.execute("SELECT t.id,u.id userId,u.employee_id FROM tasks t JOIN users u ON u.employee_id=t.assignee_employee_id WHERE t.status NOT IN('DRAFT','SCHEDULED') LIMIT 1");
  assert(manager&&owned);
  const detail=await get(owned.id,{id:owned.userId,employee_id:owned.employee_id});
  assert(Array.isArray(detail.comments)&&Array.isArray(detail.attachments)&&Array.isArray(detail.activities));
  const mentions=await mentionableUsers(owned.id,"",manager);
  assert(mentions.every(x=>x.id&&x.name));
  const [tables]=await pool.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN('task_attachments','task_read_states')");
  assert.equal(tables.length,2);
  const [columns]=await pool.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='task_comments' AND COLUMN_NAME IN('parent_comment_id','updated_at','deleted_at')");
  assert.equal(columns.length,3);
  const [[other]]=await pool.execute("SELECT u.id,u.employee_id FROM users u WHERE u.employee_id IS NOT NULL AND u.employee_id<>? AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) LIMIT 1",[owned.employee_id]);
  if(other)await assert.rejects(get(owned.id,other),/cannot view this task/);
  console.log(JSON.stringify({ok:true,taskId:owned.id,comments:detail.comments.length,attachments:detail.attachments.length,activities:detail.activities.length,mentionable:mentions.length,unauthorizedChecked:Boolean(other)}));
}finally{await pool.end()}
