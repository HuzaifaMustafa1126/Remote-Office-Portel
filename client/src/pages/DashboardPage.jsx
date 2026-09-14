import ResponsiveTable from "../components/common/ResponsiveTable";
import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Coffee,
  LogOut,
  UserCheck,
  UserMinus,
  Users,
  CalendarPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AttendanceBadge from "../components/attendance/AttendanceBadge";
import AttendanceStatusCard, {
  AttendanceScheduleSummary,
} from "../components/attendance/AttendanceStatusCard";
import EmployeeDashboardSidebar from "../components/dashboard/EmployeeDashboardSidebar";
import EmployeeSalaryOverview from "../components/dashboard/EmployeeSalaryOverview";
import EmployeeMyTasks from "../components/dashboard/EmployeeMyTasks";
import EmployeeTeamAvailability from "../components/dashboard/EmployeeTeamAvailability";
import LiveActivityFeed from "../components/attendance/LiveActivityFeed";
import LiveOfficeStatus from "../components/attendance/LiveOfficeStatus";
import LiveWorkTimer from "../components/attendance/LiveWorkTimer";
import Loader from "../components/common/Loader";
import AutoRefreshControl from "../components/common/AutoRefreshControl";
import useAttendance from "../hooks/useAttendance";
import useAuth from "../hooks/useAuth";
import useAutoRefresh from "../hooks/useAutoRefresh";
import usePermission from "../hooks/usePermission";
import useNotifications from "../hooks/useNotifications";
import * as attendance from "../services/attendance.service";
import * as availability from "../services/availability.service";
import { subscribePortalStateChanged } from "../utils/portalSync";
import { myAccrual } from "../services/salary.service";
import { PERMISSIONS as P } from "../utils/permissions";
import ManagerDashboard from "../components/dashboard/ManagerDashboard";
import TaskDrawerShell from "../components/tasks/TaskDrawerShell";
import TaskFormDrawer from "../components/tasks/TaskFormDrawer";
import { listTasks, transitionTask } from "../services/task.service";
import { getUpcoming } from "../services/companyCalendar.service";
import { getLeaves } from "../services/leave.service";
const clock = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";
const refreshIntervals = [
  0, 15000, 30000, 60000, 120000, 300000, 600000, 900000, 1800000,
];
function CompactStat({ label, value, detail, icon: Icon, tone = "indigo" }) {
  const colors = {
    indigo: "bg-primary-soft text-primary-text",
    purple: "bg-accent-soft text-accent-text",
    slate: "bg-surface-secondary text-muted-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
        </div>
        <div
          className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}
        >
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-2 truncate text-[11px] text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}
function Overview({ stats }) {
  const rows = [
    ["Present", stats.presentToday, "bg-chart-1"],
    ["Working", stats.workingNow, "bg-chart-2"],
    ["Late", stats.late, "bg-chart-3"],
    ["Half Day", stats.halfDay, "bg-chart-4"],
    ["On Break", stats.onBreak, "bg-chart-3"],
    ["On Leave", stats.onLeave, "bg-chart-5"],
    ["Clocked Out", stats.clockedOut, "bg-chart-4"],
    ["Not Arrived", stats.notClockedIn, "bg-chart-5"],
  ];
  const max = Math.max(stats.totalEmployees, 1);
  return (
    <section className="h-full rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="font-bold">Attendance Today</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Live distribution of active employees
      </p>
      <div className="mt-5 space-y-3">
        {rows.map(([label, value, color]) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">{label}</span>
              <span className="font-bold text-foreground">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function WorkforceOverview({ stats }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Workforce today
      </p>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-5xl font-black">{stats.totalEmployees}</span>
        <span className="pb-1 text-sm text-muted-foreground">
          Total employees
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
        {[
          ["Present", stats.presentToday],
          ["Working", stats.workingNow],
          ["Clocked out", stats.clockedOut],
          ["Not arrived", stats.notClockedIn],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xl font-black">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
function EmployeeAttendance({ employees }) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-bold">Employee Attendance</h2>
          <p className="text-xs text-muted-foreground">Today’s latest status</p>
        </div>
        <Link
          to="/attendance"
          className="text-xs font-semibold text-primary-text"
        >
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <ResponsiveTable className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-surface-secondary/70 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-3 py-3">Job Title</th>
              <th className="px-3 py-3">Clock In</th>
              <th className="px-3 py-3">Late By</th>
              <th className="px-3 py-3">Work Time</th>
              <th className="px-3 py-3">Attendance</th>
              <th className="px-5 py-3">Live Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.slice(0, 7).map((e) => (
              <tr key={e.employeeId} className="hover:bg-surface-secondary/70">
                <td className="px-5 py-3">
                  <p className="font-semibold">{e.employeeName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.employeeCode} • {e.department}
                  </p>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {e.jobTitle}
                </td>
                <td className="px-3 py-3">{clock(e.clockInAt)}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {Number(e.chargeableLateMinutes)
                    ? `${e.chargeableLateMinutes} min`
                    : "—"}
                </td>
                <td className="px-3 py-3 font-medium">
                  <LiveWorkTimer
                    seconds={e.workSeconds}
                    running={e.status === "WORKING"}
                  />
                </td>
                <td className="px-3 py-3">
                  <AttendanceBadge status={e.attendanceStatus || "PRESENT"} />
                </td>
                <td className="px-5 py-3">
                  <AttendanceBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
        {!employees.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No attendance-tracked employees.
          </p>
        )}
      </div>
    </section>
  );
}
function TeamLeave({ rows = [] }) {
  const today = new Date().toISOString().slice(0, 10);
  const current = rows.filter(
    (x) => String(x.leaveDate).slice(0, 10) === today,
  );
  const upcoming = rows.filter((x) => String(x.leaveDate).slice(0, 10) > today);
  const block = (title, data) => (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="font-bold">{title}</h2>
      <div className="mt-3 space-y-2">
        {data.length ? (
          data.slice(0, 6).map((x) => (
            <div
              key={`${x.employeeId}-${x.leaveDate}`}
              className="rounded-xl border border-border p-3"
            >
              <p className="text-sm font-semibold">{x.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {x.jobTitle || x.department} ·{" "}
                {String(x.leaveType).replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs">
                {x.leaveDate}
                {x.returnDate !== x.leaveDate
                  ? ` · Back after ${x.returnDate}`
                  : " · Today only"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No approved leave.</p>
        )}
      </div>
    </section>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {block("Who's On Leave Today", current)}
      {block("Upcoming Team Leave", upcoming)}
    </div>
  );
}
function LoginSecuritySummary({ data }) {
  if (!data) return null;
  const values = [
    ["Active Sessions", data.stats.activeSessions],
    ["Logins Today", data.stats.loginsToday],
    ["New Login Signals", data.stats.newLoginSignals],
    ["Failed Attempts", data.stats.failedAttempts],
  ];
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Login Security</h2>
          <p className="text-xs text-muted-foreground">
            Authentication activity only
          </p>
        </div>
        <Link
          to="/login-security"
          className="text-xs font-semibold text-primary-text"
        >
          View Login Activity
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {values.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xl font-black">{value || 0}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {data.recent.slice(0, 4).map((row) => (
          <div
            key={row.sessionId}
            className="flex items-center justify-between gap-3 border-t border-border pt-2 text-sm"
          >
            <div>
              <p className="font-semibold">{row.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {row.operatingSystem} · {row.browser}
              </p>
            </div>
            <span
              className={`text-xs font-bold ${row.status === "ACTIVE" ? "text-success" : "text-muted-foreground"}`}
            >
              {row.status.replaceAll("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
export default function DashboardPage() {
  const navigate = useNavigate();
  const { connected } = useNotifications();
  const { user } = useAuth(),
    canClock = usePermission(P.ATTENDANCE_CLOCK),
    canViewAll = usePermission(P.ATTENDANCE_ALL),
    canViewSalary = usePermission(P.SALARY_VIEW_OWN);
  const canViewOwnTasks = usePermission(P.TASK_VIEW_OWN),
    canViewAllTasks = usePermission(P.TASK_VIEW_ALL),
    canCreateTask = usePermission(P.TASK_CREATE),
    canViewCalendar = usePermission(P.CALENDAR_VIEW),
    canViewLeaves = usePermission(P.LEAVE_ALL);
  const own = useAttendance({ enabled: canClock }),
    [live, setLive] = useState(null),
    [teamAvailability, setTeamAvailability] = useState(null),
    [activity, setActivity] = useState([]),
    [teamLeave, setTeamLeave] = useState([]),
    [salaryAccrual, setSalaryAccrual] = useState(null),
    [dashboardTasks, setDashboardTasks] = useState([]),
    [tasksLoading, setTasksLoading] = useState(false),
    [holidays, setHolidays] = useState([]),
    [holidaysLoading, setHolidaysLoading] = useState(false),
    [holidaysError, setHolidaysError] = useState(""),
    [pendingLeaves, setPendingLeaves] = useState(null),
    [selectedTask, setSelectedTask] = useState(null),
    [creatingTask, setCreatingTask] = useState(false),
    [taskBusy, setTaskBusy] = useState(null),
    [taskNotice, setTaskNotice] = useState(""),
    [refreshInterval, setRefreshInterval] = useState(() => {
      const stored = Number(
        localStorage.getItem(
          `remoteOffice.dashboardAutoRefreshInterval.${user.id}`,
        ),
      );
      return refreshIntervals.includes(stored) ? stored : 0;
    });
  useEffect(() => {
    if (canViewSalary)
      myAccrual()
        .then(setSalaryAccrual)
        .catch(() => setSalaryAccrual(null));
  }, [canViewSalary]);
  const refreshDashboard = useCallback(async () => {
    const tasks = [availability.getTeam().then(setTeamAvailability)];
    if (canClock) tasks.push(own.refresh());
    if (canClock) tasks.push(attendance.getTeamLeave().then(setTeamLeave));
    if (canViewSalary) tasks.push(myAccrual().then(setSalaryAccrual));
    if (canViewOwnTasks || canViewAllTasks) {
      setTasksLoading(true);
      tasks.push(
        listTasks({})
          .then(setDashboardTasks)
          .finally(() => setTasksLoading(false)),
      );
    }
    if (canViewCalendar) {
      setHolidaysLoading(true);
      setHolidaysError("");
      tasks.push(
        getUpcoming()
          .then(setHolidays)
          .catch((error) => {
            setHolidaysError("Unable to load upcoming holidays.");
            throw error;
          })
          .finally(() => setHolidaysLoading(false)),
      );
    }
    if (canViewLeaves)
      tasks.push(getLeaves({ status: "PENDING" }).then(setPendingLeaves));
    if (canViewAll)
      tasks.push(
        Promise.all([attendance.getLive(), attendance.getActivity()]).then(
          ([office, events]) => {
            setLive(office);
            setActivity(events);
          },
        ),
      );
    const results = await Promise.allSettled(tasks);
    if (results.length && results.every((r) => r.status === "rejected"))
      throw results[0].reason;
  }, [
    canClock,
    canViewAll,
    canViewSalary,
    canViewOwnTasks,
    canViewAllTasks,
    canViewCalendar,
    canViewLeaves,
    own.refresh,
  ]);
  const auto = useAutoRefresh({
    interval: refreshInterval,
    enabled: true,
    onRefresh: refreshDashboard,
  });
  const changeRefreshInterval = (value) => {
    if (!refreshIntervals.includes(value)) return;
    localStorage.setItem(
      `remoteOffice.dashboardAutoRefreshInterval.${user.id}`,
      String(value),
    );
    setRefreshInterval(value);
  };
  const startEmployeeTask = async (task) => {
    if (taskBusy) return;
    setTaskBusy(task.id);
    setTaskNotice("");
    try {
      await transitionTask(task.id, { status: "IN_PROGRESS" });
      setTaskNotice(
        task.status === "TO_DO" ? "Task started." : "Task resumed.",
      );
      await refreshDashboard();
    } catch (error) {
      setTaskNotice(
        error.response?.data?.message || "Unable to update the task.",
      );
      await refreshDashboard().catch(() => {});
    } finally {
      setTaskBusy(null);
    }
  };
  useEffect(() => {
    const refresh = () => refreshDashboard().catch(() => {});
    window.addEventListener("office:activity", refresh);
    return () => window.removeEventListener("office:activity", refresh);
  }, [refreshDashboard]);
  useEffect(
    () =>
      subscribePortalStateChanged((event) => {
        if (
          [
            "AVAILABILITY_CHANGED",
            "BREAK_CHANGED",
            "CONNECTION_RESTORED",
          ].includes(event?.type)
        )
          availability
            .getTeam()
            .then(setTeamAvailability)
            .catch(() => {});
      }),
    [],
  );
  if (canClock && own.loading && !own.data) return <Loader />;
  const date = new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return (
    <>
      {!canViewAll && <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {canViewAll ? "Dashboard Overview" : `Welcome back, ${user.name}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canViewAll
              ? "Attendance, availability and security for your remote team — one clear view."
              : date}
          </p>
        </div>
        {!canViewAll && (
          <AutoRefreshControl
            interval={refreshInterval}
            onIntervalChange={changeRefreshInterval}
            countdown={auto.countdown}
            lastUpdated={auto.lastUpdated}
            refreshing={auto.refreshing}
            error={auto.error}
            onRefresh={auto.refresh}
          />
        )}
      </div>}
      {auto.error && canViewAll && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {auto.error}
        </div>
      )}
      {own.notice && (
        <div className="mb-4 rounded-xl bg-primary-soft p-3 text-sm font-semibold text-primary-text">
          {own.notice}
        </div>
      )}
      {taskNotice && !canViewAll && (
        <div className="mb-4 rounded-xl bg-primary-soft p-3 text-sm font-semibold text-primary-text">
          {taskNotice}
        </div>
      )}
      {canClock && own.error && !auto.error && (
        <div className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {own.error}
        </div>
      )}
      {canClock && !own.loading && !own.data && (
        <div className="rounded-2xl border border-danger-border bg-surface p-8 text-center">
          <p className="font-semibold text-danger">
            Unable to load your workday.
          </p>
          <button
            onClick={own.refresh}
            className="mt-3 text-sm font-semibold text-primary-text"
          >
            Try again
          </button>
        </div>
      )}
      {canClock && own.data && (
        <div className="space-y-5">
          <AttendanceScheduleSummary data={own.data} />
          <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)_minmax(300px,.9fr)]">
            <AttendanceStatusCard
              data={own.data}
              busy={own.busy}
              showSchedule={false}
              actions={{
                onClockIn: own.clockIn,
                onStartBreak: own.startBreak,
                onEndBreak: own.endBreak,
                onClockOut: own.clockOut,
              }}
            />
            {canViewOwnTasks && (
              <EmployeeMyTasks
                tasks={dashboardTasks}
                loading={tasksLoading}
                busy={Boolean(taskBusy)}
                onOpen={setSelectedTask}
                onStart={startEmployeeTask}
              />
            )}
            {teamAvailability && (
              <EmployeeTeamAvailability
                data={teamAvailability}
                connected={connected}
                activity={own.data.timeline}
              />
            )}
          </div>
          <div
            className={`grid items-start gap-5 ${canViewSalary ? "xl:grid-cols-[minmax(300px,.7fr)_minmax(0,1.3fr)]" : ""}`}
          >
            {canViewSalary && <EmployeeSalaryOverview data={salaryAccrual} />}
            <EmployeeDashboardSidebar
              items={own.data.timeline}
              showRecent={false}
            />
          </div>
        </div>
      )}
      {canClock && (
        <div className="mt-5">
          <TeamLeave rows={teamLeave} />
        </div>
      )}
      {canViewAll && !live && (
        <div className="grid min-h-[360px] place-items-center rounded-2xl border border-border bg-surface">
          <div className="text-center">
            <p className="text-sm font-semibold">
              Unable to load the management dashboard.
            </p>
            <button
              onClick={auto.refresh}
              className="mt-3 text-sm font-bold text-primary-text"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {canViewAll && live && (
        <ManagerDashboard
          user={user}
          live={live}
          availability={teamAvailability}
          tasks={dashboardTasks}
          tasksLoading={tasksLoading}
          holidays={holidays}
          holidaysLoading={holidaysLoading}
          holidaysError={holidaysError}
          leaves={pendingLeaves}
          activity={activity}
          canCreateTask={canCreateTask}
          connected={connected}
          refreshing={auto.refreshing}
          lastUpdated={auto.lastUpdated}
          refreshInterval={refreshInterval}
          countdown={auto.countdown}
          onRefreshIntervalChange={changeRefreshInterval}
          onRefresh={auto.refresh}
          onCreateTask={() => setCreatingTask(true)}
          onTaskSelect={setSelectedTask}
        />
      )}
      {selectedTask && (
        <TaskDrawerShell
          task={selectedTask}
          management={canViewAll}
          onClose={() => setSelectedTask(null)}
          onAction={() => {
            setSelectedTask(null);
            navigate("/tasks");
          }}
        />
      )}
      {creatingTask && (
        <TaskFormDrawer
          task={null}
          onClose={() => setCreatingTask(false)}
          onSaved={() => {
            setCreatingTask(false);
            refreshDashboard().catch(() => {});
          }}
        />
      )}
    </>
  );
}
