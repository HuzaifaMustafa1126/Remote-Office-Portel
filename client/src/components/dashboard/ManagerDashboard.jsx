import {
  CalendarDays,
  Coffee,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AttendanceBadge from "../attendance/AttendanceBadge";
import AvailabilityBadge from "../availability/AvailabilityBadge";
import LiveWorkTimer from "../attendance/LiveWorkTimer";
import PriorityBadge from "../tasks/PriorityBadge";
import { initials } from "../../utils/helpers";

const time = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
      }).format(new Date(value))
    : "No deadline";
const icons = {
  ATTENDANCE_CLOCK_IN: LogIn,
  ATTENDANCE_CLOCK_OUT: LogOut,
  BREAK_STARTED: Coffee,
  BREAK_ENDED: Play,
};
const availabilityLabels = {
  ONLINE: "Online",
  IN_MEETING: "In a meeting",
  DO_NOT_DISTURB: "Do not disturb",
  ON_BREAK: "On break",
  AWAY: "Away",
  NAMAZ: "Namaz",
  OFFLINE: "Offline",
};
const refreshOptions = [
  [0, "Off"],
  [15000, "15 Seconds"],
  [30000, "30 Seconds"],
  [60000, "1 Minute"],
  [120000, "2 Minutes"],
  [300000, "5 Minutes"],
  [600000, "10 Minutes"],
  [900000, "15 Minutes"],
  [1800000, "30 Minutes"],
];
const countdownLabel = (seconds) =>
  seconds >= 60
    ? `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`
    : `${seconds}s`;

function Hero({
  user,
  stats,
  refreshing,
  lastUpdated,
  refreshInterval,
  countdown,
  onRefreshIntervalChange,
  onRefresh,
}) {
  const issueCount =
    Number(stats.late || 0) +
    Number(stats.onBreak || 0) +
    Number(stats.onLeave || 0) +
    Number(stats.notClockedIn || 0);
  const message = issueCount
    ? `${stats.workingNow || 0} employees are working now. ${issueCount} attendance item${issueCount === 1 ? " needs" : "s need"} attention.`
    : `All tracked employees are accounted for. No attendance alerts need attention.`;
  const cards = [
    ["Working now", stats.workingNow, "Currently active", "bg-success"],
    ["Late today", stats.late, "After grace period", "bg-danger"],
    ["On break", stats.onBreak, "Currently paused", "bg-warning"],
    ["On leave", stats.onLeave, "Approved today", "bg-muted-foreground"],
  ];
  const today = new Intl.DateTimeFormat("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
  return (
    <section className="overflow-hidden rounded-[18px] bg-[#111216] text-white shadow-[0_14px_40px_rgba(0,0,0,.12)]">
      <div
        className="flex flex-wrap items-start justify-between gap-6 px-5 py-6 sm:px-7 sm:py-8"
        style={{
          background:
            "radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--primary) 28%, transparent), transparent 40%), linear-gradient(135deg, #111216, #17181e)",
        }}
      >
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
            <i className="h-1.5 w-1.5 rounded-full bg-primary" />
            Live workforce status
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-[-.035em] sm:text-3xl">
            Welcome back, {user.name}
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400">
            {message}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3 sm:gap-4">
          <div className="text-right text-[9px] uppercase tracking-wider text-zinc-500">
            <span className="mb-1 block normal-case tracking-normal text-zinc-400">
              {today}
            </span>
            <span className="block">Last updated</span>
            <strong className="text-zinc-300">
              {lastUpdated ? time(lastUpdated) : "Waiting"}
            </strong>
            <span className="mt-1 block normal-case tracking-normal text-zinc-400">
              {refreshInterval
                ? `Next refresh in ${countdownLabel(countdown)}`
                : "Automatic refresh is off"}
            </span>
          </div>
          <label className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="mb-1 block">Auto refresh</span>
            <select
              value={refreshInterval}
              onChange={(event) =>
                onRefreshIntervalChange(Number(event.target.value))
              }
              className="rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-xs normal-case tracking-normal text-zinc-200 outline-none transition focus:border-primary"
            >
              {refreshOptions.map(([value, label]) => (
                <option className="bg-[#17181e]" key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition duration-150 hover:bg-primary-hover disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-4">
        {cards.map(([label, value, detail, color]) => (
          <div
            key={label}
            className="border-white/10 px-5 py-4 lg:border-r last:border-r-0"
          >
            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-zinc-500">
              {label}
            </p>
            <p className="mt-1 text-xl font-black">{value || 0}</p>
            <p className="mt-1 flex items-center gap-2 text-[9px] text-zinc-500">
              <i className={`h-0.5 w-5 ${color}`} />
              {detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttendanceToday({ stats }) {
  const total = Math.max(Number(stats.totalEmployees || 0), 1),
    present = Number(stats.presentToday || 0);
  const rows = [
    ["Present", present, "bg-primary"],
    ["Working", stats.workingNow, "bg-success"],
    ["Half day", stats.halfDay, "bg-info"],
    ["Late", stats.late, "bg-danger"],
    ["On break", stats.onBreak, "bg-warning"],
  ];
  return (
    <section className="h-full rounded-2xl border border-border/70 bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)] transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(0,0,0,.05)]">
      <div className="flex justify-between">
        <div>
          <h2 className="font-bold tracking-tight">Attendance Today</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Live distribution of employee attendance
          </p>
        </div>
        <Link
          to="/attendance"
          className="text-[11px] font-semibold text-primary-text"
        >
          View report ↗
        </Link>
      </div>
      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[120px_1fr]">
        <div
          className="mx-auto grid h-24 w-24 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${(present / total) * 100}%, var(--surface-secondary) 0)`,
          }}
        >
          <div className="grid h-[80px] w-[80px] place-items-center rounded-full bg-surface text-center">
            <div>
              <strong className="text-xl tracking-tight">
                {present}/{stats.totalEmployees || 0}
              </strong>
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">
                Present
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {rows.map(([label, value, color]) => (
            <div
              key={label}
              className="grid grid-cols-[65px_1fr_20px] items-center gap-2 text-[10px]"
            >
              <span className="text-muted-foreground">{label}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${(Number(value || 0) / total) * 100}%` }}
                />
              </div>
              <strong>{value || 0}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AttendanceTable({ employees, availability }) {
  const states = new Map(
    (availability?.employees || []).map((x) => [
      Number(x.employeeId),
      x.availability,
    ]),
  );
  return (
    <section className="h-full overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <div className="flex items-start justify-between px-5 py-4">
        <div>
          <h2 className="font-bold tracking-tight">Employee Attendance</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Today’s latest attendance status
          </p>
        </div>
        <Link
          to="/attendance"
          className="text-[11px] font-semibold text-primary-text"
        >
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="manager-attendance-table w-full min-w-[690px] text-left text-xs">
          <thead className="border-y border-border/60 bg-surface-secondary/35 text-[9px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2">Employee</th>
              <th>Clock in</th>
              <th>Late by</th>
              <th>Work time</th>
              <th>Attendance</th>
              <th className="pr-5">Live status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {employees.slice(0, 5).map((e) => (
              <tr
                key={e.employeeId}
                className="transition-colors hover:bg-surface-secondary/45"
              >
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-[9px] font-bold text-primary-text">
                      {initials(e.employeeName)}
                    </span>
                    <div>
                      <p className="font-semibold">{e.employeeName}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {e.department || e.jobTitle || "Employee"}
                      </p>
                    </div>
                  </div>
                </td>
                <td>{time(e.clockInAt)}</td>
                <td>
                  {Number(e.chargeableLateMinutes)
                    ? `${e.chargeableLateMinutes} min`
                    : "—"}
                </td>
                <td>
                  <LiveWorkTimer
                    seconds={e.workSeconds}
                    running={e.status === "WORKING"}
                  />
                </td>
                <td>
                  <AttendanceBadge status={e.attendanceStatus || "PRESENT"} />
                </td>
                <td className="pr-5">
                  <AvailabilityBadge
                    status={states.get(Number(e.employeeId)) || "OFFLINE"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!employees.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No attendance records today.
          </p>
        )}
      </div>
    </section>
  );
}

function Tasks({ rows, loading, canCreate, onCreate, onSelect }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <div className="flex items-start justify-between px-5 py-4">
        <h2 className="font-bold tracking-tight">All tasks</h2>
        {canCreate && (
          <button
            onClick={onCreate}
            className="rounded-lg bg-primary-soft px-3 py-2 text-[11px] font-semibold text-primary-text transition-colors duration-150 hover:bg-primary hover:text-primary-foreground"
          >
            + Add task
          </button>
        )}
      </div>
      {loading ? (
        <div className="space-y-2 p-5">
          {[1, 2, 3, 4].map((x) => (
            <div
              key={x}
              className="h-9 animate-pulse rounded bg-surface-secondary"
            />
          ))}
        </div>
      ) : rows.length ? (
        <div className="space-y-2 px-5 pb-5">
          {rows.slice(0, 5).map((row) => (
            <button
              key={row.id}
              onClick={() => onSelect(row)}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface-secondary/65 px-4 py-3 text-left hover:bg-primary-soft/40"
            >
              <span className="h-5 w-5 rounded-full border border-border bg-surface" />
              <span className="min-w-0">
                <strong className="block truncate text-xs">{row.title}</strong>
                <span
                  className={`mt-1 block truncate text-[10px] ${row.overdue ? "text-danger" : "text-muted-foreground"}`}
                >
                  {row.projectName ||
                    row.assigneeName ||
                    row.assignee_name ||
                    "General"}{" "}
                  · {date(row.due_at)}
                </span>
              </span>
              <PriorityBadge priority={row.priority} />
            </button>
          ))}
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No tasks available.
        </p>
      )}
    </section>
  );
}

function Holidays({ rows, loading, error }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <div className="flex justify-between gap-3">
        <h2 className="font-bold tracking-tight">Upcoming holidays</h2>
        <Link
          to="/company-calendar"
          className="text-[11px] font-semibold text-primary-text"
        >
          View calendar
        </Link>
      </div>
      {loading ? (
        <div className="mt-5 h-12 animate-pulse rounded-xl bg-surface-secondary" />
      ) : error ? (
        <p className="mt-6 text-xs text-danger">
          Unable to load upcoming holidays.
        </p>
      ) : rows?.length ? (
        <div className="mt-4 space-y-2">
          {rows.slice(0, 3).map((row) => (
            <div
              key={row.id}
              className="rounded-xl bg-surface-secondary p-3 text-xs font-semibold"
            >
              {row.title}
              <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                {date(row.calendarDate)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary-text">
            <CalendarDays size={17} />
          </span>
          <div>
            <p className="text-xs font-semibold">No upcoming holidays</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Your company calendar is clear.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function TeamAvailability({ data, connected }) {
  const [filter, setFilter] = useState("ALL"),
    employees = data?.employees || [];
  const shown = useMemo(
    () =>
      filter === "ALL"
        ? employees
        : employees.filter((row) => row.availability === filter),
    [employees, filter],
  );
  const statuses = [
    "ONLINE",
    "IN_MEETING",
    "DO_NOT_DISTURB",
    "ON_BREAK",
    "AWAY",
    "NAMAZ",
    "OFFLINE",
  ];
  const filters = [
    ["ALL", "All"],
    ["ONLINE", "Online"],
    ["IN_MEETING", "Meeting"],
    ["AWAY", "Away"],
    ["NAMAZ", "Namaz"],
    ["ON_BREAK", "Break"],
    ["DO_NOT_DISTURB", "DND"],
    ["OFFLINE", "Offline"],
  ];
  return (
    <section className="dashboard-card h-full min-w-0 bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold tracking-tight">Team availability</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <i
            className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-success" : "bg-warning"}`}
          />
          {connected ? "Live" : "Connecting"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-y-4 rounded-2xl bg-surface-secondary/65 p-4 sm:grid-cols-3">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="text-left"
          >
            <span className="block truncate text-[10px] text-muted-foreground">
              {availabilityLabels[status]}
            </span>
            <strong className="mt-1 block text-base">
              {data?.counts?.[status] || 0}
            </strong>
          </button>
        ))}
      </div>
      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter team availability"
      >
        {filters.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold ${filter === value ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 max-h-[315px] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-color:rgb(var(--border))_transparent] [scrollbar-width:thin]">
        {shown.length ? (
          shown.map((employee, index) => (
            <div
              key={employee.employeeId}
              className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 ${index ? "border-t border-border/60" : ""}`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary-text">
                {initials(employee.employeeName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {employee.employeeName}
                </p>
                {employee.ongoingWorkTitle && (
                  <p className="truncate text-[9px] text-primary-text">
                    Working on: {employee.ongoingWorkTitle}
                  </p>
                )}
                <p className="truncate text-[9px] text-muted-foreground">
                  {employee.jobTitle || employee.role || "Employee"} ·{" "}
                  {employee.department || "Team"}
                </p>
              </div>
              <AvailabilityBadge status={employee.availability} />
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-xs text-muted-foreground">
            No team members match this status.
          </p>
        )}
      </div>
    </section>
  );
}

function LeaveRequests({ data }) {
  const rows = data?.rows || [];
  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <div className="flex justify-between">
        <div>
          <h2 className="font-bold tracking-tight">Leave Requests</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Pending review
          </p>
        </div>
        <Link
          to="/leave-requests"
          className="text-[11px] font-semibold text-primary-text"
        >
          View All
        </Link>
      </div>
      {rows.length ? (
        <div className="mt-3 divide-y divide-border/60">
          {rows.slice(0, 3).map((row) => (
            <Link
              to="/leave-requests"
              key={row.id}
              className="flex justify-between py-3 text-xs transition-colors hover:text-primary-text"
            >
              <span className="font-semibold">{row.employeeName}</span>
              <span className="text-muted-foreground">{row.leaveType}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex items-center justify-between py-2">
          <div>
            <strong className="text-3xl tracking-tight">
              {data?.summary?.pending || 0}
            </strong>
            <p className="text-[11px] text-muted-foreground">
              Pending approvals
            </p>
          </div>
          <span className="rounded-full bg-success-soft px-3 py-1.5 text-[10px] font-semibold text-success">
            ● All clear
          </span>
        </div>
      )}
    </section>
  );
}

function Activity({ items }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <div className="flex justify-between">
        <h2 className="font-bold tracking-tight">Recent activity</h2>
        <Link
          to="/audit-logs"
          aria-label="View all activity"
          className="text-muted-foreground"
        >
          •••
        </Link>
      </div>
      <div className="mt-4 grid md:grid-cols-3">
        {items.length ? (
          items.slice(0, 3).map((item, index) => {
            const Icon = icons[item.action] || CalendarDays;
            return (
              <div
                key={item.id}
                className={`flex min-w-0 gap-3 py-3 md:px-5 md:first:pl-0 md:last:pr-0 ${index ? "border-t border-border/60 md:border-l md:border-t-0" : ""}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-text">
                  <Icon size={12} />
                </span>
                <div>
                  <p className="text-xs font-semibold leading-snug">
                    {item.action?.replaceAll("_", " ").toLowerCase() ||
                      "Activity recorded"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {time(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No recent activity.
          </p>
        )}
      </div>
    </section>
  );
}

export default function ManagerDashboard({
  user,
  live,
  availability,
  tasks,
  tasksLoading,
  holidays,
  holidaysLoading,
  holidaysError,
  leaves,
  activity,
  canCreateTask,
  connected,
  refreshing,
  lastUpdated,
  refreshInterval,
  countdown,
  onRefreshIntervalChange,
  onRefresh,
  onCreateTask,
  onTaskSelect,
}) {
  return (
    <div className="manager-dashboard mx-auto grid w-full max-w-[1800px] min-w-0 gap-4">
      <div>
        <Hero
          user={user}
          stats={live.stats}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          refreshInterval={refreshInterval}
          countdown={countdown}
          onRefreshIntervalChange={onRefreshIntervalChange}
          onRefresh={onRefresh}
        />
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(300px,1fr)_minmax(0,2fr)]">
        <AttendanceToday stats={live.stats} />
        <AttendanceTable
          employees={live.employees || []}
          availability={availability}
        />
      </div>
      <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
        <div className="grid min-w-0 gap-4">
          <Tasks
            rows={tasks}
            loading={tasksLoading}
            canCreate={canCreateTask}
            onCreate={onCreateTask}
            onSelect={onTaskSelect}
          />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Holidays
              rows={holidays}
              loading={holidaysLoading}
              error={holidaysError}
            />
            <LeaveRequests data={leaves} />
          </div>
        </div>
        <TeamAvailability data={availability} connected={connected} />
      </div>
      <Activity items={activity} />
    </div>
  );
}
