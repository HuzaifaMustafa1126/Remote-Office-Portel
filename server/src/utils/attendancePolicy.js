// Policy numbers come exclusively from a persisted version, never runtime defaults.
export function classifyArrival(policy, actualMinutes, exempt = false) {
  const actual = Math.max(0, actualMinutes);
  const chargeable = Math.max(0, actual - Number(policy.grace_minutes));
  let status = "PRESENT";
  if (!exempt && chargeable > 0) {
    if (
      policy.half_day_rule_enabled &&
      actual > Number(policy.half_day_after_minutes)
    )
      status = "HALF_DAY";
    else if (policy.late_rule_enabled) status = "LATE";
  }
  return {
    status,
    actualMinutes: actual,
    chargeableMinutes: chargeable,
    countsAsLate:
      !exempt &&
      Boolean(policy.late_accumulation_enabled) &&
      (status === "LATE" ||
        (status === "HALF_DAY" && Boolean(policy.count_half_day_as_late))),
  };
}
export function convertLateCount(count, policy) {
  const threshold = Number(policy.late_instances_required);
  const conversions = Math.floor(count / threshold);
  return {
    remaining: count % threshold,
    converted: conversions * threshold,
    quantity: conversions * Number(policy.late_penalty_quantity),
  };
}
export function penaltySalaryDays(type, quantity, policy) {
  if (type === "NO_PENALTY") return 0;
  if (type === "HALF_DAY")
    return (quantity * Number(policy.half_day_salary_deduction_percent)) / 100;
  // Salary deduction quantity is explicitly expressed in daily salary units.
  return quantity;
}
export function counterPeriod(policy, date, payrollPeriod) {
  if (policy.late_counter_period === "NEVER")
    return { start: "1000-01-01", endExclusive: "9999-12-31" };
  if (policy.late_counter_period === "PAYROLL_CYCLE") return payrollPeriod;
  // Monthly and Calendar Month are aliases for a calendar month.
  const d = new Date(`${date}T00:00:00Z`);
  return {
    start: `${date.slice(0, 7)}-01`,
    endExclusive: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
      .toISOString()
      .slice(0, 10),
  };
}
