import { useEffect, useState } from "react";
import { listPolicies, savePolicy } from "../services/attendancePolicy.service";
const initial = {
  name: "Company Default",
  late_rule_enabled: true,
  grace_minutes: 15,
  late_accumulation_enabled: true,
  late_instances_required: 3,
  late_penalty_type: "FULL_DAY_LEAVE",
  late_penalty_quantity: 1,
  half_day_rule_enabled: true,
  half_day_after_minutes: 120,
  half_day_salary_deduction_percent: 50,
  count_half_day_as_late: false,
  late_counter_period: "PAYROLL_CYCLE",
  effective_from: new Date().toISOString().slice(0, 10),
};
export default function AttendancePolicyPage() {
  const [p, setP] = useState(initial),
    [rows, setRows] = useState([]);
  useEffect(() => {
    listPolicies().then(setRows);
  }, []);
  const f = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const num = (k) => (
    <input
      type="number"
      value={p[k]}
      onChange={(e) => f(k, Number(e.target.value))}
      className="rounded-lg border p-2"
    />
  );
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-2xl font-black">Attendance Policy</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Versioned settings apply to future attendance from the effective date.
      </p>
      <div className="space-y-4 rounded-2xl border bg-surface p-5">
        {[
          ["late_rule_enabled", "Late attendance"],
          ["late_accumulation_enabled", "Late accumulation"],
          ["half_day_rule_enabled", "Half-day rule"],
          ["count_half_day_as_late", "Count half-day as late"],
        ].map(([k, l]) => (
          <label className="flex justify-between" key={k}>
            {l}
            <input
              type="checkbox"
              checked={p[k]}
              onChange={(e) => f(k, e.target.checked)}
            />
          </label>
        ))}
        <label className="flex justify-between">
          Grace minutes {num("grace_minutes")}
        </label>
        <label className="flex justify-between">
          Late instances required {num("late_instances_required")}
        </label>
        <label className="flex justify-between">
          Penalty quantity {num("late_penalty_quantity")}
        </label>
        <label className="flex justify-between">
          Half-day after minutes {num("half_day_after_minutes")}
        </label>
        <label className="flex justify-between">
          Half-day deduction % {num("half_day_salary_deduction_percent")}
        </label>
        <label className="flex justify-between">
          Counter period{" "}
          <select
            value={p.late_counter_period}
            onChange={(e) => f("late_counter_period", e.target.value)}
            className="border p-2"
          >
            <option>PAYROLL_CYCLE</option>
            <option>MONTHLY</option>
            <option>CALENDAR_MONTH</option>
            <option>NEVER</option>
          </select>
        </label>
        <label className="flex justify-between">
          Effective from{" "}
          <input
            type="date"
            value={p.effective_from}
            onChange={(e) => f("effective_from", e.target.value)}
            className="border p-2"
          />
        </label>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-white"
          onClick={() => savePolicy(p).then(() => listPolicies().then(setRows))}
        >
          Save policy
        </button>
      </div>
      <h2 className="mt-8 font-bold">Policy history</h2>
      {rows.map((x) => (
        <p key={x.id} className="text-sm">
          {x.effective_from}: grace {x.grace_minutes}m · late threshold{" "}
          {x.late_instances_required}
        </p>
      ))}
    </main>
  );
}
