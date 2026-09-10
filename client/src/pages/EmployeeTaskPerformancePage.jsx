import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmployeeTaskPerformance } from "../services/task.service";
import TaskDrawerShell from "../components/tasks/TaskDrawerShell";
import TaskStatusBadge from "../components/tasks/TaskStatusBadge";
import PriorityBadge from "../components/tasks/PriorityBadge";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS as P } from "../utils/permissions";
const ranges = [
  ["THIS_WEEK", "This Week"],
  ["THIS_MONTH", "This Month"],
  ["LAST_MONTH", "Last Month"],
  ["3_MONTHS", "3 Months"],
  ["6_MONTHS", "6 Months"],
  ["THIS_YEAR", "This Year"],
  ["CUSTOM", "Custom"],
];
const fmt = (v) =>
    v
      ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(
          new Date(v),
        )
      : "—",
  days = (v) => Math.max(1, Math.floor((Date.now() - new Date(v)) / 86400000)),
  progress = (t) => t.progress || 0;
export default function EmployeeTaskPerformancePage() {
  const { employeeId } = useParams(),
    navigate = useNavigate(),
    management = usePermission(P.TASK_VIEW_ALL),
    [range, setRange] = useState({
      range: "THIS_MONTH",
      startDate: "",
      endDate: "",
    }),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [sort, setSort] = useState("due");
  const valid =
    range.range !== "CUSTOM" ||
    (range.startDate && range.endDate && range.startDate <= range.endDate);
  const load = async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      setData(await getEmployeeTaskPerformance(employeeId, range));
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to load employee task performance.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [employeeId, range.range, range.startDate, range.endDate]);
  const active = useMemo(
    () =>
      data
        ? [...data.activeTasks].sort((a, b) =>
            sort === "priority"
              ? { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.priority] -
                { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.priority]
              : sort === "status"
                ? a.status.localeCompare(b.status)
                : new Date(a.due_at || "9999") - new Date(b.due_at || "9999"),
          )
        : [],
    [data, sort],
  );
  if (loading) return <Skeleton />;
  if (error)
    return (
      <main>
        <button
          onClick={() => navigate("/tasks")}
          className="mb-4 text-sm font-bold"
        >
          ← Task Management
        </button>
        <Error text={error} retry={load} />
      </main>
    );
  const e = data.employee,
    s = data.summary,
    w = data.workload;
  return (
    <main className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/tasks")} className="text-xl">
            ←
          </button>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-foreground font-black text-background">
            {e.name
              .split(/\s+/)
              .slice(0, 2)
              .map((x) => x[0])
              .join("")}
          </div>
          <div>
            <h1 className="text-2xl font-black">{e.name}</h1>
            <p className="text-sm text-muted-foreground">
              {e.jobTitle || e.roles.join(", ") || "Employee"}
              {e.department ? ` · ${e.department}` : ""}
            </p>
            <p className="mt-1 text-xs">
              {w.active} Active · {s.completed} Completed · {w.overdue} Overdue
            </p>
          </div>
        </div>
        <Range value={range} set={setRange} valid={valid} />
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Total Assigned", s.assigned],
          ["Completed", s.completed],
          ["In Progress", s.inProgress],
          ["Pending Approval", s.pendingApproval],
          ["Overdue", s.overdue],
          ["On-Time Rate", `${s.onTimeRate}%`],
        ].map((x) => (
          <Card key={x[0]} label={x[0]} value={x[1]} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Section title="Current Workload" className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Active Tasks", w.active],
              ["Urgent", w.urgent],
              ["High Priority", w.high],
              ["Due Today", w.dueToday],
              ["Due This Week", w.dueThisWeek],
              ["Overdue", w.overdue],
            ].map((x) => (
              <div className="rounded-lg bg-surface-secondary p-3" key={x[0]}>
                <p className="text-xs text-muted-foreground">{x[0]}</p>
                <b className="text-xl">{x[1]}</b>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Workload Capacity">
          <div className="py-6 text-center">
            <p className="text-3xl font-black">{w.level}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {w.active} active tasks
            </p>
            <div className="mx-auto mt-4 h-2 max-w-48 rounded bg-surface-secondary">
              <div
                className="h-full rounded bg-foreground"
                style={{ width: `${Math.min(100, (w.active / 13) * 100)}%` }}
              />
            </div>
          </div>
        </Section>
      </div>
      <Section
        title="Active Tasks"
        action={
          <select
            aria-label="Sort active tasks"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input !mt-0 w-auto"
          >
            <option value="due">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        }
      >
        <TaskTable
          tasks={active}
          type="active"
          open={setSelected}
          empty="No active tasks."
        />
      </Section>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Overdue Tasks">
          <TaskTable
            tasks={data.overdueTasks}
            type="overdue"
            open={setSelected}
            empty="No overdue tasks."
          />
        </Section>
        <Section title="On-Time Completion">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid place-items-center">
              <div className="grid h-36 w-36 place-items-center rounded-full border-[14px] border-success-soft">
                <div className="text-center">
                  <b className="text-3xl">{s.onTimeRate}%</b>
                  <p className="text-[10px]">On Time</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 self-center text-sm">
              <Row a="On-Time" b={s.onTime} />
              <Row a="Late" b={s.late} />
              <Row a="Completed" b={s.completed} />
            </div>
          </div>
        </Section>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Task Completion Trend">
          <Trend points={data.analytics.activity} />
        </Section>
        <Section title="Task Timeliness">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Early", data.timeliness.early],
              ["On Due Date", data.timeliness.onDueDate],
              ["Late", data.timeliness.late],
            ].map((x) => (
              <Card key={x[0]} label={x[0]} value={x[1]} />
            ))}
          </div>
        </Section>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Task Status Breakdown">
          <Bars
            rows={[
              ["Completed", s.completed],
              ["In Progress", s.inProgress],
              ["Pending Approval", s.pendingApproval],
              ["Needs Revision", s.needsRevision],
              ["Overdue", s.overdue],
            ]}
          />
        </Section>
        <Section title="Task Priority Breakdown">
          <Bars
            rows={Object.entries(data.analytics.priorities).map(([k, v]) => [
              k,
              v,
            ])}
          />
        </Section>
      </div>
      <Section title="Project Contribution">
        <div className="grid gap-3 md:grid-cols-2">
          {data.analytics.projects.length ? (
            data.analytics.projects.map((p) => (
              <button
                key={p.name}
                onClick={() => navigate(`/tasks?employeeId=${e.id}`)}
                className="rounded-lg border border-border p-4 text-left"
              >
                <div className="flex justify-between">
                  <b>{p.name}</b>
                  <b>{p.progress}%</b>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.total} assigned · {p.completed} completed · {p.inProgress}{" "}
                  active · {p.overdue} overdue
                </p>
                <div className="mt-3 h-1.5 rounded bg-surface-secondary">
                  <div
                    className="h-full rounded bg-foreground"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </button>
            ))
          ) : (
            <Empty text="No project contribution data available." />
          )}
        </div>
      </Section>
      <Section title="Tasks At Risk">
        <div className="grid gap-2 md:grid-cols-2">
          {data.atRisk.length ? (
            data.atRisk.map((t) => (
              <button
                onClick={() => setSelected(t)}
                key={t.id}
                className="rounded-lg border border-danger-border p-3 text-left"
              >
                <div className="flex justify-between gap-2">
                  <b>{t.title}</b>
                  <span className="text-xs font-bold text-danger">AT RISK</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.overdue
                    ? `${days(t.due_at)} days overdue`
                    : `Due ${fmt(t.due_at)}`}{" "}
                  · {t.priority}
                </p>
              </button>
            ))
          ) : (
            <Empty text="No tasks currently at risk." />
          )}
        </div>
      </Section>
      <Section title="Completion History">
        <TaskTable
          tasks={data.completionHistory}
          type="completed"
          open={setSelected}
          empty="No completed tasks during this period."
        />
      </Section>
      <TaskDrawerShell
        task={selected}
        onClose={() => setSelected(null)}
        management={management}
        onAction={() => navigate("/tasks")}
      />
    </main>
  );
}
function Range({ value, set, valid }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <select
        aria-label="Performance range"
        className="input !mt-0 w-auto"
        value={value.range}
        onChange={(e) => set((x) => ({ ...x, range: e.target.value }))}
      >
        {ranges.map((x) => (
          <option value={x[0]} key={x[0]}>
            {x[1]}
          </option>
        ))}
      </select>
      {value.range === "CUSTOM" && (
        <>
          <input
            aria-label="Start date"
            type="date"
            className="input !mt-0 w-auto"
            value={value.startDate}
            onChange={(e) => set((x) => ({ ...x, startDate: e.target.value }))}
          />
          <input
            aria-label="End date"
            type="date"
            className="input !mt-0 w-auto"
            value={value.endDate}
            onChange={(e) => set((x) => ({ ...x, endDate: e.target.value }))}
          />
          {!valid && <span className="text-xs text-danger">Invalid range</span>}
        </>
      )}
    </div>
  );
}
function Section({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm ${className}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
function Row({ a, b }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{a}</span>
      <b>{b}</b>
    </div>
  );
}
function TaskTable({ tasks, type, open, empty }) {
  if (!tasks.length) return <Empty text={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Status</th>
            <th>
              {type === "active"
                ? "Assigned"
                : type === "completed"
                  ? "Due Date"
                  : "Original Due"}
            </th>
            <th>
              {type === "completed"
                ? "Completed"
                : type === "overdue"
                  ? "Delay"
                  : "Progress"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((t) => (
            <tr
              key={t.id}
              onClick={() => open(t)}
              className="cursor-pointer hover:bg-surface-secondary"
            >
              <td className="py-3 font-bold">{t.title}</td>
              <td>General</td>
              <td>
                <PriorityBadge priority={t.priority} />
              </td>
              <td>
                <TaskStatusBadge
                  status={t.status}
                  overdue={type === "overdue"}
                />
              </td>
              <td>{fmt(type === "active" ? t.assignedAt : t.due_at)}</td>
              <td>
                {type === "completed"
                  ? new Date(t.submitted_at || t.completed_at) <=
                    new Date(t.due_at)
                    ? "On Time"
                    : "Late"
                  : type === "overdue"
                    ? `${days(t.due_at)} days`
                    : `${progress(t)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((x) => Number(x[1])));
  return (
    <div className="space-y-3">
      {rows.map((x) => (
        <div key={x[0]}>
          <div className="mb-1 flex justify-between text-xs capitalize">
            <span>{x[0]}</span>
            <b>{x[1]}</b>
          </div>
          <div className="h-2 rounded bg-surface-secondary">
            <div
              className="h-full rounded bg-foreground"
              style={{ width: `${(Number(x[1]) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function Trend({ points }) {
  if (!points.length)
    return <Empty text="No completion activity during this period." />;
  const max = Math.max(1, ...points.flatMap((x) => [x.completed, x.overdue])),
    line = (k) =>
      points
        .map(
          (x, i) =>
            `${points.length === 1 ? 50 : (i * 100) / (points.length - 1)},${92 - (x[k] * 78) / max}`,
        )
        .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-52 w-full"
      role="img"
      aria-label="Employee completion and overdue trend"
    >
      <polyline
        points={line("completed")}
        fill="none"
        stroke="var(--success)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={line("overdue")}
        fill="none"
        stroke="var(--danger)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function Empty({ text }) {
  return (
    <div className="grid min-h-24 place-items-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
function Error({ text, retry }) {
  return (
    <div className="rounded-xl border border-danger-border p-8 text-center text-danger">
      {text}
      <br />
      <button onClick={retry} className="mt-3 font-bold text-foreground">
        Retry
      </button>
    </div>
  );
}
function Skeleton() {
  return (
    <main className="space-y-5">
      <div className="h-20 animate-pulse rounded-xl bg-surface-secondary" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((x) => (
          <div
            key={x}
            className="h-28 animate-pulse rounded-xl bg-surface-secondary"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-surface-secondary" />
    </main>
  );
}
