import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
} from "lucide-react";
import { getTaskAnalytics } from "../../services/task.service";
import DashboardSection from "./dashboard/DashboardSection";
import TaskSummaryCard from "./dashboard/TaskSummaryCard";
import useTaskDashboardMotion from "../../hooks/useTaskDashboardMotion";
const C = {
  created: "var(--info)",
  completed: "var(--success)",
  progress: "var(--warning)",
  overdue: "var(--danger)",
  grid: "var(--border)",
};
const ranges = [
  ["THIS_MONTH", "Monthly"],
  ["THIS_WEEK", "This Week"],
  ["LAST_MONTH", "Last Month"],
  ["30_DAYS", "30 Days"],
  ["3_MONTHS", "3 Months"],
  ["6_MONTHS", "6 Months"],
  ["12_MONTHS", "12 Months"],
  ["THIS_YEAR", "This Year"],
  ["CUSTOM", "Custom"],
];
export default function TaskAnalyticsPanel({
  management,
  onNavigate,
  refreshKey = 0,
}) {
  const scope=useRef(null);
  const [state, setState] = useState({
      range: readStoredRange(),
      startDate: "",
      endDate: "",
    }),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useTaskDashboardMotion(scope,`${loading}-${state.range}-${refreshKey}`);
  const valid =
    state.range !== "CUSTOM" ||
    (state.startDate && state.endDate && state.startDate <= state.endDate);
  const load = async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const response = await getTaskAnalytics(state, refreshKey);
      if (!response || typeof response !== "object" || !response.summary) {
        throw new Error("The analytics service returned an invalid response.");
      }
      setData(response);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Unable to load task analytics.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    try { sessionStorage.setItem("task-analytics-range", state.range); } catch {}
    load();
  }, [state.range, state.startDate, state.endDate, refreshKey]);
  if (loading) return <Skeleton />;
  if (error)
    return (
      <DashboardSection title="Task Analytics">
        <State text={error} retry={load} />
      </DashboardSection>
    );
  const s = data.summary,
    activity = Array.isArray(data.activity) ? data.activity : [],
    employees = Array.isArray(data.employees) ? data.employees : [],
    projects = Array.isArray(data.projects) ? data.projects : [],
    trends = data.trends || {},
    period = data.period || { start: "Current period", end: "" },
    summary = [
      [
        "Completed Tasks",
        `${s.completed} / ${s.total}`,
        CheckCircle2,
        "green",
        trends.completed,
        { status: "COMPLETED" },
      ],
      [
        "In Progress Tasks",
        `${s.inProgress} / ${s.total}`,
        Clock3,
        "blue",
        null,
        { status: "IN_PROGRESS" },
      ],
      [
        "Tasks Pending Approval",
        `${s.pendingApproval} / ${s.total}`,
        ClipboardCheck,
        "orange",
        null,
        { status: "SUBMITTED_FOR_REVIEW" },
      ],
      [
        "Overdue Tasks",
        `${s.overdue} / ${s.total}`,
        AlertTriangle,
        "red",
        trends.overdue,
        { overdue: true },
      ],
    ];
  return (
    <div ref={scope} className="relative space-y-5 before:pointer-events-none before:absolute before:-inset-8 before:-z-10 before:bg-[radial-gradient(circle_at_18%_12%,color-mix(in_srgb,var(--info)_7%,transparent),transparent_35%),radial-gradient(circle_at_80%_45%,color-mix(in_srgb,var(--primary)_5%,transparent),transparent_32%)]">
      <div className="grid gap-[18px] sm:grid-cols-2 min-[1380px]:grid-cols-4">
        {summary.map((x) => (
          <TaskSummaryCard
            key={x[0]}
            title={x[0]}
            count={x[1]}
            icon={x[2]}
            tone={x[3]}
            trend={x[4]}
            inverse={x[0].startsWith("Overdue")}
            spark={activity.map(p=>x[0].startsWith("Completed")?p.completed:x[0].startsWith("Overdue")?p.overdue:x[0].startsWith("In Progress")?s.inProgress:p.created)}
            onClick={() => onNavigate(x[5])}
          />
        ))}
      </div>
      <InsightStrip summary={s} employees={employees} projects={projects} />
      <div className="analytics-grid grid items-stretch gap-5 min-[1180px]:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
        <DashboardSection
          className="task-analytics-card"
          title="Task Activity"
          subtitle={`${period.start}${period.end ? ` – ${period.end}` : ""}`}
          action={<Period state={state} setState={setState} valid={valid} />}
        >
          <Activity points={activity} summary={s} />
        </DashboardSection>
        <DashboardSection
          className="task-analytics-card"
          title="Task Completion Rate"
          action={
            <span className="text-xs text-muted-foreground">All tasks</span>
          }
        >
          <Completion summary={s} />
        </DashboardSection>
      </div>
      <div className="analytics-grid grid items-stretch gap-5 min-[1180px]:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
        {management ? (
          <DashboardSection
            className="task-analytics-card"
            title="Employee Workload"
            action={
              <button
                className="text-xs font-bold"
                onClick={() => onNavigate({})}
              >
                View All
              </button>
            }
          >
            <Workload
              rows={employees}
              onClick={(id) => onNavigate({ employeePerformance: id })}
            />
          </DashboardSection>
        ) : (
          <DashboardSection title="My Task Activity" className="task-analytics-card">
            <Activity points={activity} summary={s} />
          </DashboardSection>
        )}
        <DashboardSection
          className="task-analytics-card"
          title="Project Progress"
          action={
            <span className="text-xs text-muted-foreground">
              {ranges.find((x) => x[0] === state.range)?.[1]}
            </span>
          }
        >
          <Projects rows={projects} onClick={onNavigate} />
        </DashboardSection>
      </div>
    </div>
  );
}
function Period({ state, setState, valid }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <select
        aria-label="Analytics period"
        className="dashboard-control h-10 rounded-[10px] border border-border bg-surface/90 px-3 text-[13px] font-semibold shadow-sm"
        value={state.range}
        onChange={(e) => setState((x) => ({ ...x, range: e.target.value }))}
      >
        {ranges.map((x) => (
          <option key={x[0]} value={x[0]}>
            {x[1]}
          </option>
        ))}
      </select>
      {state.range === "CUSTOM" && (
        <>
          <input
            aria-label="Start date"
            type="date"
            className="h-9 rounded-lg border border-border px-2 text-xs"
            value={state.startDate}
            onChange={(e) =>
              setState((x) => ({ ...x, startDate: e.target.value }))
            }
          />
          <input
            aria-label="End date"
            type="date"
            className="h-9 rounded-lg border border-border px-2 text-xs"
            value={state.endDate}
            onChange={(e) =>
              setState((x) => ({ ...x, endDate: e.target.value }))
            }
          />
          {!valid && <span className="text-xs text-danger">Invalid range</span>}
        </>
      )}
    </div>
  );
}
function Activity({ points, summary }) {
  const [hovered, setHovered] = useState(null);
  const [chartWidth, setChartWidth] = useState(760);
  const chartHost = useRef(null);
  const gradientId = useId().replace(/:/g, "");
  useEffect(() => {
    const host = chartHost.current;
    if (!host || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.max(280, Math.round(entry.contentRect.width));
      setChartWidth((current) => current === next ? current : next);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  if (!points.length) return <State text="No task activity for this period." />;
  const width = chartWidth,
    height = 250,
    pad = { l: 42, r: 16, t: 20, b: 36 },
    max = Math.max(
      1,
      ...points.flatMap((x) => [x.created, x.completed, x.overdue]),
    ),
    x = (i) =>
      points.length === 1
        ? (width - pad.l - pad.r) / 2 + pad.l
        : pad.l + (i * (width - pad.l - pad.r)) / (points.length - 1),
    y = (v) => pad.t + ((max - v) * (height - pad.t - pad.b)) / max,
    path = (key) => {
      if (points.length < 2) return `M${x(0)},${y(points[0][key])}`;
      return points.reduce((result, point, index) => {
        if (!index) return `M${x(0)},${y(point[key])}`;
        const previousX = x(index - 1), currentX = x(index), middle = (previousX + currentX) / 2;
        return `${result} C${middle},${y(points[index - 1][key])} ${middle},${y(point[key])} ${currentX},${y(point[key])}`;
      }, "");
    },
    area = (key) => `${path(key)} L${x(points.length - 1)},${height - pad.b} L${x(0)},${height - pad.b} Z`,
    ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div ref={chartHost} className="relative min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {[
          ["created", "Created", points.reduce((total, point) => total + point.created, 0)],
          ["completed", "Completed", summary?.completed ?? 0],
          ["overdue", "Overdue", summary?.overdue ?? 0],
        ].map((a) => (
          <span className="activity-mini-metric flex min-w-[92px] items-center gap-2 rounded-xl border border-border bg-surface-secondary/55 px-3 py-2" key={a[0]}>
            <i
              className="h-2 w-2 rounded-full"
              style={{ background: C[a[0]] }}
            />
            <span><small className="block text-[11px] text-muted-foreground">{a[1]}</small><b className="text-sm">{a[2]}</b></span>
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[250px] w-full overflow-visible"
        role="img"
        aria-label="Task activity chart"
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const px = ((event.clientX - box.left) / box.width) * width;
          const index = points.length === 1 ? 0 : Math.max(0, Math.min(points.length - 1, Math.round(((px - pad.l) * (points.length - 1)) / (width - pad.l - pad.r))));
          setHovered(index);
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {["created", "completed", "overdue"].map((key) => (
            <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C[key]} stopOpacity=".16" />
              <stop offset="1" stopColor={C[key]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t} className="chart-axis">
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={pad.t + t * (height - pad.t - pad.b)}
              y2={pad.t + t * (height - pad.t - pad.b)}
              stroke={C.grid}
            />
            <text
              x={pad.l - 8}
              y={pad.t + (1 - t) * (height - pad.t - pad.b) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--muted-foreground)"
            >
              {Math.round(max * t)}
            </text>
          </g>
        ))}
        {hovered != null && (
          <line className="chart-crosshair" x1={x(hovered)} x2={x(hovered)} y1={pad.t} y2={height-pad.b} stroke="var(--muted-foreground)" strokeDasharray="3 4" opacity=".45" />
        )}
        {["created", "completed", "overdue"].map((key) => (
          <g key={key}>
            <path className="activity-area" d={area(key)} fill={`url(#${gradientId}-${key})`} />
            <path
              className="activity-line"
              d={path(key)}
              fill="none"
              stroke={C[key]}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <circle
                className="activity-point"
                key={p.date}
                cx={x(i)}
                cy={y(p[key])}
                r={points.length < 3 ? 5 : 3}
                fill={C[key]}
              >
                <title>{`${p.date} — Created: ${p.created}, Completed: ${p.completed}, Overdue: ${p.overdue}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {points.map(
          (p, i) =>
            (i === 0 || i === points.length - 1 || points.length <= 6) && (
              <text
                key={p.date}
                x={x(i)}
                y={height - 10}
                textAnchor={
                  i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
                }
                fontSize="11"
                fill="var(--muted-foreground)"
              >
                {shortDate(p.date)}
              </text>
            ),
        )}
      </svg>
      {hovered != null && (
        <div className="pointer-events-none absolute top-14 z-10 min-w-40 -translate-x-1/2 rounded-xl border border-border bg-surface/95 p-3 text-xs shadow-xl backdrop-blur" style={{ left: `${Math.max(12, Math.min(88, (x(hovered) / width) * 100))}%` }}>
          <b className="mb-2 block">{shortDate(points[hovered].date)}</b>
          {[['created','Created'],['completed','Completed'],['overdue','Overdue']].map(([key,label]) => <span key={key} className="mt-1 flex justify-between gap-5"><span className="text-muted-foreground">{label}</span><b>{points[hovered][key]}</b></span>)}
        </div>
      )}
    </div>
  );
}
function Completion({ summary: s }) {
  const rate = Math.max(0, Math.min(100, Number(s.completionRate) || 0));
  return (
    <div className="flex min-h-[303px] flex-col justify-center">
      <div className="relative mx-auto h-[132px] w-[240px] overflow-hidden">
        <div
          className="completion-meter absolute left-0 top-0 h-[240px] w-[240px] rounded-full shadow-[0_18px_45px_-24px_var(--success)]"
          style={{ background: `conic-gradient(from 270deg,${C.completed} 0deg ${rate * 1.8}deg,var(--surface-secondary) ${rate * 1.8}deg 180deg,transparent 180deg)` }}
        >
          <div className="absolute inset-7 rounded-full bg-surface" />
        </div>
        <div className="absolute inset-x-0 bottom-0 text-center"><b className="task-count-number text-[36px] font-black tracking-tight" data-value={rate}>{rate}</b><b className="text-2xl">%</b><p className="text-xs font-semibold text-muted-foreground">Completed</p></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          ["Total Tasks", s.total],
          ["Completed", s.completed],
          ["In Progress", s.inProgress],
          ["Pending", s.pending],
          ["Overdue", s.overdue],
        ].map((x) => (
          <div className="completion-stat rounded-xl border border-border bg-surface-secondary/50 p-2.5" key={x[0]}>
            <b className="block text-base">{x[1]}</b>
            <span className="text-[11px] text-muted-foreground">{x[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function InsightStrip({ summary, employees, projects }) {
  const activeProjects = projects.filter((project) => project.progress < 100).length;
  const values = [
    ["Today", summary.dueToday, "Due today"],
    ["Overdue", summary.overdue, "Need attention"],
    ["Team", employees.filter((employee) => employee.active > 0).length, "Active employees"],
    ["Projects", activeProjects, "Currently active"],
  ];
  return (
    <div className="task-insight-strip flex gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-surface/75 p-2 shadow-[0_12px_32px_-28px_rgba(59,130,246,.7)] backdrop-blur">
      {values.map(([label, value, detail], index) => (
        <div key={label} className="insight-chip flex min-w-[150px] flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left">
          <i className={`h-2.5 w-2.5 rounded-full ${index === 1 && value ? "bg-danger" : index === 0 && value ? "bg-warning" : "bg-primary"}`} />
          <span><small className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</small><b className="text-sm">{value} <span className="font-medium text-muted-foreground">{detail}</span></b></span>
        </div>
      ))}
    </div>
  );
}
function Workload({ rows, onClick }) {
  const chartHost = useRef(null);
  const [chartWidth, setChartWidth] = useState(720);
  useEffect(() => {
    const host = chartHost.current;
    if (!host || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.max(480, Math.round(entry.contentRect.width));
      setChartWidth((current) => current === next ? current : next);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  if (!rows.length)
    return <State text="No employee workload data available." />;
  const shown = rows.slice(0, 8),
    max = Math.max(
      1,
      ...shown.flatMap((x) => [
        x.assigned,
        x.completed,
        x.inProgress,
        x.overdue,
      ]),
    ),
    chartW = chartWidth,
    plot = 200,
    bar = shown.length <= 3 ? 24 : shown.length <= 5 ? 20 : 16,
    group = (chartW - 60) / shown.length,
    assigned = shown.reduce((total, person) => total + person.assigned, 0),
    overdue = shown.reduce((total, person) => total + person.overdue, 0);
  return (
    <div ref={chartHost} className="task-workload-chart w-full min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4 text-[12px]">
        {[
          ["Assigned", "var(--foreground)"],
          ["Completed", C.completed],
          ["In Progress", C.progress],
          ["Overdue", C.overdue],
        ].map((x) => (
          <span className="flex items-center gap-1" key={x[0]}>
            <i className="h-2 w-2 rounded-sm" style={{ background: x[1] }} />
            {x[0]}
          </span>
        ))}
        </div>
        <span className="text-xs text-muted-foreground"><b className="text-foreground">{shown.length}</b> employees · <b className="text-foreground">{assigned}</b> assigned · <b className="text-danger">{overdue}</b> overdue</span>
      </div>
      <svg
        viewBox={`0 0 ${chartW} 250`}
        className="h-[250px] w-full"
        role="img"
        aria-label="Employee workload chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            className="chart-axis"
            key={t}
            x1="38"
            x2={chartW - 12}
            y1={10 + t * plot}
            y2={10 + t * plot}
            stroke={C.grid}
          />
        ))}
        {shown.map((person, i) => {
          const center = 38 + group * i + group / 2,
            keys = [
              ["assigned", "var(--foreground)"],
              ["completed", C.completed],
              ["inProgress", C.progress],
              ["overdue", C.overdue],
            ],
            start = center - (keys.length * bar + 9) / 2;
          return (
            <g
              key={person.employeeId}
              onClick={() => onClick(person.employeeId)}
              className="workload-group cursor-pointer"
            >
              {keys.map(([key, color], j) => (
                <rect
                  className="workload-bar"
                  key={key}
                  x={start + j * (bar + 3)}
                  y={10 + plot - (person[key] * plot) / max}
                  width={bar}
                  height={Math.max(
                    person[key] ? 3 : 0,
                    (person[key] * plot) / max,
                  )}
                  rx="3"
                  fill={color}
                >
                  <title>{`${person.name} — Assigned: ${person.assigned}, Completed: ${person.completed}, In Progress: ${person.inProgress}, Overdue: ${person.overdue}`}</title>
                </rect>
              ))}
              <text
                x={center}
                y="234"
                textAnchor="middle"
                fontSize="11"
                fill="var(--foreground)"
              >
                {person.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
function Projects({ rows, onClick }) {
  if (!rows.length) return <State text="No active projects." />;
  const completed = rows.filter((project) => project.progress >= 100).length;
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[[rows.length,"Projects"],[rows.length-completed,"Active"],[completed,"Completed"]].map(([value,label]) => <span key={label} className="rounded-xl bg-surface-secondary/60 p-2 text-center"><b className="block text-base">{value}</b><small className="text-[11px] text-muted-foreground">{label}</small></span>)}
      </div>
      <div className="space-y-4">
      {rows.slice(0, 5).map((x) => (
        <button key={x.name} onClick={() => onClick({})} className="min-h-[64px] w-full rounded-xl border border-transparent p-2.5 text-left transition hover:border-border hover:bg-surface-secondary/70">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-secondary text-xs font-black">
              {x.name
                .split(/\s+/)
                .map((v) => v[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-3 text-sm">
                <b className="truncate">{x.name}</b>
                <b>{x.progress}%</b>
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {x.completed} / {x.total} tasks
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-secondary">
                <i
                  className="project-progress block h-full rounded-full bg-gradient-to-r from-primary to-info"
                  style={{ width: `${x.progress}%` }}
                />
              </span>
            </span>
          </div>
        </button>
      ))}
      </div>
    </div>
  );
}
function State({ text, retry }) {
  return (
    <div className="grid h-[270px] place-items-center text-center text-sm text-muted-foreground">
      <div>
        {text}
        {retry && (
          <button
            onClick={retry}
            className="mt-2 block font-bold text-foreground"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((x) => (
          <i
            key={x}
            className="h-32 animate-pulse rounded-xl bg-surface-secondary"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {[1, 2].map((x, i) => (
          <i
            key={x}
            className={`h-96 animate-pulse rounded-xl bg-surface-secondary ${i === 0 ? "xl:col-span-2" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
const shortDate = (v) =>
  new Intl.DateTimeFormat("en-PK", { month: "short", day: "numeric" }).format(
    new Date(`${v}T00:00:00`),
  );
const readStoredRange = () => {
  try {
    const value = sessionStorage.getItem("task-analytics-range");
    return ranges.some(([key]) => key === value) ? value : "THIS_MONTH";
  } catch {
    return "THIS_MONTH";
  }
};
