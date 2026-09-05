import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Coffee,
  LogOut,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import AttendanceBadge from "../components/attendance/AttendanceBadge";
import AttendanceStatusCard from "../components/attendance/AttendanceStatusCard";
import EmployeeDashboardSidebar from "../components/dashboard/EmployeeDashboardSidebar";
import EmployeeSalaryOverview from "../components/dashboard/EmployeeSalaryOverview";
import LiveActivityFeed from "../components/attendance/LiveActivityFeed";
import LiveOfficeStatus from "../components/attendance/LiveOfficeStatus";
import LiveWorkTimer from "../components/attendance/LiveWorkTimer";
import AutoRefreshControl from "../components/common/AutoRefreshControl";
import Loader from "../components/common/Loader";
import useAttendance from "../hooks/useAttendance";
import useAuth from "../hooks/useAuth";
import useAutoRefresh from "../hooks/useAutoRefresh";
import usePermission from "../hooks/usePermission";
import * as attendance from "../services/attendance.service";
import { myAccrual } from "../services/salary.service";
import { PERMISSIONS as P } from "../utils/permissions";
const clock = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";
const allowedIntervals = [0, 15000, 30000, 60000, 120000, 300000];
if (localStorage.getItem("remoteOffice.autoRefreshInterval") === null)
  localStorage.setItem("remoteOffice.autoRefreshInterval", "30000");
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
      <p className="mt-2 truncate text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
function Overview({ stats }) {
  const rows = [
    ["Present", stats.presentToday, "bg-chart-1"],
    ["Working", stats.workingNow, "bg-chart-2"],
    ["On Break", stats.onBreak, "bg-chart-3"],
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
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-surface-secondary/70 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-3 py-3">Job Title</th>
              <th className="px-3 py-3">Clock In</th>
              <th className="px-3 py-3">Work Time</th>
              <th className="px-5 py-3">Status</th>
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
                <td className="px-3 py-3 text-muted-foreground">{e.jobTitle}</td>
                <td className="px-3 py-3">{clock(e.clockInAt)}</td>
                <td className="px-3 py-3 font-medium">
                  <LiveWorkTimer
                    seconds={e.workSeconds}
                    running={e.status === "WORKING"}
                  />
                </td>
                <td className="px-5 py-3">
                  <AttendanceBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!employees.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No attendance-tracked employees.
          </p>
        )}
      </div>
    </section>
  );
}
export default function DashboardPage() {
  const { user } = useAuth(),
    canClock = usePermission(P.ATTENDANCE_CLOCK),
    canViewAll = usePermission(P.ATTENDANCE_ALL),
    canViewSalary = usePermission(P.SALARY_VIEW_OWN);
  const own = useAttendance(),
    [live, setLive] = useState(null),
    [activity, setActivity] = useState([]),
    [salaryAccrual,setSalaryAccrual]=useState(null),
    [interval, setIntervalPreference] = useState(() => {
      const stored = Number(
        localStorage.getItem("remoteOffice.autoRefreshInterval"),
      );
      return allowedIntervals.includes(stored) ? stored : 30000;
    });
  useEffect(()=>{if(canViewSalary)myAccrual().then(setSalaryAccrual).catch(()=>setSalaryAccrual(null))},[canViewSalary]);
  const refreshDashboard = useCallback(async () => {
    const tasks = [];
    if (canClock) tasks.push(own.refresh());
    if (canViewSalary) tasks.push(myAccrual().then(setSalaryAccrual));
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
  }, [canClock, canViewAll, canViewSalary, own.refresh]);
  const auto = useAutoRefresh({
    interval,
    enabled: canClock || canViewAll,
    onRefresh: refreshDashboard,
  });
  const changeInterval = (value) => {
    localStorage.setItem("remoteOffice.autoRefreshInterval", String(value));
    setIntervalPreference(value);
  };
  if (canClock && own.loading && !own.data) return <Loader />;
  const date = new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{date}</p>
        </div>
        <AutoRefreshControl
          interval={interval}
          onIntervalChange={changeInterval}
          countdown={auto.countdown}
          lastUpdated={auto.lastUpdated}
          refreshing={auto.refreshing}
          error={auto.error}
          onRefresh={auto.refresh}
        />
      </div>
      {own.notice && (
        <div className="mb-4 rounded-xl bg-primary-soft p-3 text-sm font-semibold text-primary-text">
          {own.notice}
        </div>
      )}
      {own.error && !auto.error && (
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
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(250px,1fr)]">
          <main className="space-y-5">
            <AttendanceStatusCard
              data={own.data}
              busy={own.busy}
              actions={{
                onClockIn: own.clockIn,
                onStartBreak: own.startBreak,
                onEndBreak: own.endBreak,
                onClockOut: own.clockOut,
              }}
            />
            {canViewSalary && <EmployeeSalaryOverview data={salaryAccrual} />}
          </main>
          <aside>
            <EmployeeDashboardSidebar items={own.data.timeline} />
          </aside>
        </div>
      )}
      {canViewAll && live && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <CompactStat
              label="Total Employees"
              value={live.stats.totalEmployees}
              detail="Attendance-tracked employees"
              icon={Users}
            />
          </div>
          <div className="xl:col-span-2">
            <CompactStat
              label="Present Today"
              value={live.stats.presentToday}
              detail={`Out of ${live.stats.totalEmployees} employees`}
              icon={UserCheck}
              tone="purple"
            />
          </div>
          <div className="xl:col-span-2">
            <CompactStat
              label="Working Now"
              value={live.stats.workingNow}
              detail="Currently active"
              icon={BriefcaseBusiness}
            />
          </div>
          <div className="xl:col-span-2">
            <CompactStat
              label="On Break"
              value={live.stats.onBreak}
              detail="Currently paused"
              icon={Coffee}
              tone="purple"
            />
          </div>
          <div className="xl:col-span-2">
            <CompactStat
              label="Clocked Out"
              value={live.stats.clockedOut}
              detail="Workday completed"
              icon={LogOut}
              tone="slate"
            />
          </div>
          <div className="xl:col-span-2">
            <CompactStat
              label="Not Clocked In"
              value={live.stats.notClockedIn}
              detail="Not arrived today"
              icon={UserMinus}
              tone="slate"
            />
          </div>
          <div className="xl:col-span-5">
            <Overview stats={live.stats} />
          </div>
          <div className="xl:col-span-7">
            <LiveOfficeStatus employees={live.employees} />
          </div>
          <div className="xl:col-span-8">
            <EmployeeAttendance employees={live.employees} />
          </div>
          <div className="xl:col-span-4">
            <LiveActivityFeed items={activity} />
          </div>
        </div>
      )}
    </>
  );
}
