import assert from "node:assert/strict";
import pool from "../src/config/database.js";
import {employeePerformance} from "../src/services/task.service.js";
try{
 const [[manager]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN') LIMIT 1");
 const [[employee]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE e.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) LIMIT 1");
 assert(manager&&employee);
 for(const range of ["THIS_WEEK","THIS_MONTH","LAST_MONTH","3_MONTHS","6_MONTHS","THIS_YEAR"]){const result=await employeePerformance(employee.employee_id,{range},manager);assert.equal(Number(result.employee.id),Number(employee.employee_id));assert(["Low","Normal","High","Heavy"].includes(result.workload.level));assert(result.summary.onTimeRate>=0&&result.summary.onTimeRate<=100);assert(result.activeTasks.every(x=>Number(x.progress)>=0));}
 const self=await employeePerformance(employee.employee_id,{range:"THIS_MONTH"},employee);
 const [[assigned]]=await pool.execute("SELECT COUNT(*) total FROM tasks WHERE assignee_employee_id=? AND created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) AND status NOT IN('DRAFT','SCHEDULED','ARCHIVED')",[employee.employee_id,self.period.start,self.period.end]);
 const [[active]]=await pool.execute("SELECT COUNT(*) total FROM tasks WHERE assignee_employee_id=? AND status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED')",[employee.employee_id]);
 assert.equal(self.summary.assigned,Number(assigned.total));assert.equal(self.workload.active,Number(active.total));
 await assert.rejects(employeePerformance(Number(employee.employee_id)+1000,{range:"THIS_MONTH"},employee),/only view your own/);
 console.log(JSON.stringify({ok:true,employee:self.employee.name,assigned:self.summary.assigned,active:self.workload.active,onTimeRate:self.summary.onTimeRate,level:self.workload.level}));
}finally{await pool.end()}
