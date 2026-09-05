import assert from "node:assert/strict";
import { test } from "node:test";
process.env.NODE_ENV = "test";
process.env.DB_USER = "test";
process.env.JWT_SECRET = "test-secret-for-salary-accrual-only";
const { getEmployeeSalaryAccrual } =
  await import("../src/services/salaryAccrual.service.js");

function executor(calendarType, cycleStartDay = 5) {
  return {
    async execute(sql) {
      if (sql.includes("FROM payroll_settings")) return [[{ cycleStartDay }]];
      if (sql.includes("FROM employees")) return [[{ id: 1 }]];
      if (sql.includes("FROM employee_salary_profiles"))
        return [[{ monthlySalary: 30000, salaryDivisor: 30 }]];
      if (sql.includes("FROM payroll_runs")) return [[]];
      if (sql.includes("FROM company_calendar_days"))
        return [
          calendarType ? [{ id: 1, dayType: calendarType, title: "Off" }] : [],
        ];
      if (
        sql.includes("FROM leave_days") ||
        sql.includes("FROM attendance_records")
      )
        return [[]];
      if (sql.includes("FROM employee_shift_assignments"))
        return [[{ inProgress: 1 }]];
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}
for (const type of [
  "PUBLIC_HOLIDAY",
  "COMPANY_HOLIDAY",
  "SPECIAL_OFF_DAY",
  "WEEKLY_OFF",
]) {
  test(`${type} earns the daily rate without a deduction`, async () => {
    const result = await getEmployeeSalaryAccrual(
      1,
      "2026-09-05",
      executor(type),
    );
    assert.equal(result.earnedSoFar, 1000);
    assert.equal(result.paidOffDays, 1);
    assert.equal(result.validPaidDays, 1);
    assert.equal(result.processedDays, 1);
    assert.equal(result.presentDays, 0);
    assert.equal(result.knownDeductions, 0);
    assert.equal(result.projectedNet, 30000);
    assert.equal(result.dailyBreakdown.length, 1);
    assert.equal(result.dailyBreakdown[0].earned, 1000);
  });
}
test("default Sunday is paid", async () => {
  const result = await getEmployeeSalaryAccrual(
    1,
    "2026-09-06",
    executor(null, 6),
  );
  assert.equal(result.earnedSoFar, 1000);
  assert.equal(result.paidOffDays, 1);
});
test("Sunday working override does not accrue holiday pay", async () => {
  const result = await getEmployeeSalaryAccrual(
    1,
    "2026-09-06",
    executor("WORKING_DAY", 6),
  );
  assert.equal(result.earnedSoFar, 0);
  assert.equal(result.paidOffDays, 0);
  assert.equal(result.dailyBreakdown[0].classification, "SHIFT_IN_PROGRESS");
});
