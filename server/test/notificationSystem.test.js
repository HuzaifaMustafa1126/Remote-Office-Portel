import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV="test";
process.env.DB_USER="test";
process.env.JWT_SECRET="test-only-secret-for-notification-tests";
const { categoryFor }=await import("../src/services/notification.service.js");
const { preferencesSchema,listSchema }=await import("../src/validators/notification.validator.js");

test("notification event categories do not leak into attendance defaults",()=>{
  assert.equal(categoryFor("TASK_ASSIGNED"),"TASK");
  assert.equal(categoryFor("PAYSLIP_AVAILABLE"),"PAYROLL");
  assert.equal(categoryFor("SECURITY_NEW_IP"),"SECURITY");
  assert.equal(categoryFor("CALENDAR_HOLIDAY_CREATED"),"CALENDAR");
  assert.equal(categoryFor("SHIFT_ASSIGNED"),"SHIFT");
});

test("persistent preferences require booleans and bounded volume",()=>{
  const base={notificationsEnabled:true,inAppEnabled:true,doNotDisturb:false,volume:70,desktopEnabled:false,soundEnabled:true,taskEnabled:true,leaveEnabled:true,breakEnabled:false,attendanceEnabled:true,announcementEnabled:true,calendarEnabled:true,payrollEnabled:true,securityEnabled:true,employeeEnabled:true,shiftEnabled:true,eventPreferences:[]};
  assert.equal(preferencesSchema.safeParse(base).success,true);
  assert.equal(preferencesSchema.safeParse({...base,volume:101}).success,false);
  assert.equal(preferencesSchema.safeParse({...base,desktopEnabled:1}).success,false);
});

test("notification history filters validate category and date input",()=>{
  assert.equal(listSchema.safeParse({category:"SECURITY",from:"2026-09-01",to:"2026-09-12"}).success,true);
  assert.equal(listSchema.safeParse({category:"SALARY_SECRET"}).success,false);
  assert.equal(listSchema.safeParse({from:"09/12/2026"}).success,false);
});
