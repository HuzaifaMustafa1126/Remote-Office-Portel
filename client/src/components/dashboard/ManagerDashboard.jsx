import {
  CalendarDays,
  Coffee,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import AttendanceBadge from "../attendance/AttendanceBadge";
import AvailabilityBadge from "../availability/AvailabilityBadge";
import LiveOfficeStatus from "../attendance/LiveOfficeStatus";
import LiveWorkTimer from "../attendance/LiveWorkTimer";
import PriorityBadge from "../tasks/PriorityBadge";
import TaskStatusBadge from "../tasks/TaskStatusBadge";
import UpcomingHolidays from "../calendar/UpcomingHolidays";
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
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)] transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(0,0,0,.05)]">
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
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_rgba(0,0,0,.03)]">
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
        <table className="w-full min-w-[690px] text-left text-xs">
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
        <div>
          <h2 className="font-bold tracking-tight">All Tasks</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Latest task and deadline status
          </p>
        </div>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="border-y border-border/60 bg-surface-secondary/35 text-[9px] uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2">Task</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="pr-5">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.slice(0, 5).map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row)}
                  className="cursor-pointer transition-colors duration-150 hover:bg-surface-secondary/45"
                >
                  <td className="max-w-[250px] truncate px-5 py-3 font-semibold">
                    {row.title}
                  </td>
                  <td>
                    {row.assigneeName || row.assignee_name || "Not assigned"}
                  </td>
                  <td>
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td>
                    <TaskStatusBadge status={row.status} />
                  </td>
                  <td
                    className={`pr-5 font-medium ${row.overdue ? "text-danger" : ""}`}
                  >
                    {date(row.due_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No tasks available.
        </p>
      )}
      <div className="border-t border-border/60 px-5 py-3 text-right">
        <Link
          to="/tasks"
          className="text-[11px] font-semibold text-primary-text"
        >
          View all tasks
        </Link>
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
        <div>
          <h2 className="font-bold tracking-tight">Recent Activity</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Latest attendance events
          </p>
        </div>
        <Link
          to="/audit-logs"
          className="text-[11px] font-semibold text-primary-text"
        >
          View all
        </Link>
      </div>
      <div className="mt-3">
        {items.length ? (
          items.slice(0, 3).map((item, index) => {
            const Icon = icons[item.action] || CalendarDays;
            return (
              <div
                key={item.id}
                className={`flex gap-3 py-3 ${index < Math.min(items.length, 6) - 1 ? "border-b border-border/60" : ""}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-text">
                  <Icon size={12} />
                </span>
                <div>
                  <p className="text-xs font-medium leading-snug">
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
          <p className="py-8 text-center text-sm text-muted-foreground">
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
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-8 xl:grid-cols-12">
      <div className="md:col-span-8 xl:col-span-12">
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
      <div className="order-1 md:col-span-3 xl:col-span-5">
        <AttendanceToday stats={live.stats} />
      </div>
      <div className="order-3 md:col-span-5 xl:order-2 xl:col-span-7">
        <AttendanceTable
          employees={live.employees || []}
          availability={availability}
        />
      </div>
      <div className="order-2 md:col-span-5 xl:order-3 xl:col-span-7">
        <Tasks
          rows={tasks}
          loading={tasksLoading}
          canCreate={canCreateTask}
          onCreate={onCreateTask}
          onSelect={onTaskSelect}
        />
      </div>
      <div className="order-4 md:col-span-3 xl:col-span-5">
        <LiveOfficeStatus data={availability} connected={connected} />
      </div>
      <div className="order-5 md:col-span-4 xl:col-span-3">
        <UpcomingHolidays
          rows={holidays}
          loading={holidaysLoading}
          error={holidaysError}
        />
      </div>
      <div className="order-6 md:col-span-4 xl:col-span-3">
        <LeaveRequests data={leaves} />
      </div>
      <div className="order-7 md:col-span-8 xl:col-span-6">
        <Activity items={activity} />
      </div>
    </div>
  );
}
