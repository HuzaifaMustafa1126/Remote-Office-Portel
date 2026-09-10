import assert from "node:assert/strict";
import pool from "../src/config/database.js";
import {analytics} from "../src/services/task.service.js";
try{
 const [[manager]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN') LIMIT 1");
 const [[employee]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE e.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) LIMIT 1");
 assert(manager&&employee);
 for(const range of ["7_DAYS","30_DAYS","3_MONTHS","6_MONTHS","12_MONTHS","CUSTOM"]){
  const args=range==="CUSTOM"?{range,startDate:"2026-01-01",endDate:"2026-12-31"}:{range};
  const result=await analytics(args,manager);
  assert(result.period.start<=result.period.end);
  assert.equal(result.scope,"TEAM");
  assert(Number.isFinite(result.summary.completionRate));
  assert(["created","completed","overdue"].every(key=>key in result.trends));
  assert(result.activity.every(x=>["date","created","completed","overdue"].every(k=>k in x)));
 }
 const team=await analytics({range:"30_DAYS"},manager);
 const [[actual]]=await pool.execute("SELECT COUNT(*) total FROM tasks WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY)",[team.period.start,team.period.end]);
 assert.equal(team.summary.total,Number(actual.total));
 const mine=await analytics({range:"30_DAYS"},employee);
 const [[own]]=await pool.execute("SELECT COUNT(*) total FROM tasks WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) AND assignee_employee_id=?",[mine.period.start,mine.period.end,employee.employee_id]);
 assert.equal(mine.summary.total,Number(own.total));
 assert.equal(mine.scope,"PERSONAL");
 assert.deepEqual(mine.employees,[]);
 await assert.rejects(analytics({range:"30_DAYS",employeeId:Number(employee.employee_id)+1000},employee),/another employee/);
 console.log(JSON.stringify({ok:true,teamTotal:team.summary.total,employeeTotal:mine.summary.total,activityPoints:team.activity.length,priorities:team.priorities}));
}finally{await pool.end()}
