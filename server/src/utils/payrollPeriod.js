import pool from "../config/database.js";

export async function getPayrollSettings(executor = pool) {
  const [[row]] = await executor.execute(
    "SELECT cycle_start_day AS cycleStartDay,currency,default_salary_divisor AS defaultSalaryDivisor FROM payroll_settings WHERE id=1",
  );
  return row || { cycleStartDay: 5, currency: "PKR", defaultSalaryDivisor: 30 };
}
const iso = (date) => date.toISOString().slice(0, 10);
export function periodForDate(value, cycleStartDay = 5) {
  const date = new Date(`${value}T00:00:00Z`),
    year = date.getUTCFullYear(),
    month = date.getUTCMonth(),
    day = date.getUTCDate();
  const start = new Date(
    Date.UTC(year, day >= cycleStartDay ? month : month - 1, cycleStartDay),
  );
  const endExclusive = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, cycleStartDay),
  );
  const endInclusive = new Date(endExclusive);
  endInclusive.setUTCDate(endInclusive.getUTCDate() - 1);
  return {
    start: iso(start),
    endExclusive: iso(endExclusive),
    endInclusive: iso(endInclusive),
  };
}
export async function payrollPeriodForDate(value, executor = pool) {
  const settings = await getPayrollSettings(executor);
  return { ...periodForDate(value, Number(settings.cycleStartDay)), settings };
}
