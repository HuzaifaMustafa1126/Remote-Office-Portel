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
import useNotifications from "../hooks/useNotifications";
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
function WorkforceOverview({stats}) { return <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Workforce today</p><div className="mt-3 flex items-end gap-3"><span className="text-5xl font-black">{stats.totalEmployees}</span><span className="pb-1 text-sm text-muted-foreground">Total employees</span></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">{[["Present",stats.presentToday],["Working",stats.workingNow],["Clocked out",stats.clockedOut],["Not arrived",stats.notClockedIn]].map(([label,value])=><div key={label}><p className="text-xl font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div></section> }
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
                <td className="px-3 py-3 text-muted-foreground">{e.jobTitle}</td>
                <td className="px-3 py-3">{clock(e.clockInAt)}</td>
                <td className="px-3 py-3 text-muted-foreground">{Number(e.chargeableLateMinutes) ? `${e.chargeableLateMinutes} min` : "—"}</td>
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
  const current = rows.filter((x) => String(x.leaveDate).slice(0, 10) === today);
  const upcoming = rows.filter((x) => String(x.leaveDate).slice(0, 10) > today);
  const block = (title, data) => <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><h2 className="font-bold">{title}</h2><div className="mt-3 space-y-2">{data.length ? data.slice(0,6).map((x)=><div key={`${x.employeeId}-${x.leaveDate}`} className="rounded-xl border border-border p-3"><p className="text-sm font-semibold">{x.employeeName}</p><p className="text-xs text-muted-foreground">{x.jobTitle || x.department} · {String(x.leaveType).replaceAll('_',' ')}</p><p className="mt-1 text-xs">{x.leaveDate}{x.returnDate !== x.leaveDate ? ` · Back after ${x.returnDate}` : " · Today only"}</p></div>) : <p className="text-sm text-muted-foreground">No approved leave.</p>}</div></section>;
  return <div className="grid gap-4 md:grid-cols-2">{block("Who's On Leave Today",current)}{block("Upcoming Team Leave",upcoming)}</div>;
}
export default function DashboardPage() {
  const {connected}=useNotifications();
  const { user } = useAuth(),
    canClock = usePermission(P.ATTENDANCE_CLOCK),
    canViewAll = usePermission(P.ATTENDANCE_ALL),
    canViewSalary = usePermission(P.SALARY_VIEW_OWN);
  const own = useAttendance(),
    [live, setLive] = useState(null),
    [activity, setActivity] = useState([]),
    [teamLeave,setTeamLeave]=useState([]),
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
    if (canClock) tasks.push(attendance.getTeamLeave().then(setTeamLeave));
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
      {canClock && <div className="mt-5"><TeamLeave rows={teamLeave} /></div>}
      {canViewAll && live && (
        <div className="mt-5 space-y-4 min-w-0">
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,.75fr)]"><WorkforceOverview stats={live.stats}/><div className="grid grid-cols-2 gap-4"><CompactStat label="Working Now" value={live.stats.workingNow} detail="Currently active" icon={BriefcaseBusiness}/><CompactStat label="Late Today" value={live.stats.late} detail="After configured grace" icon={UserMinus} tone="purple"/><CompactStat label="On Break" value={live.stats.onBreak} detail="Currently paused" icon={Coffee} tone="slate"/><CompactStat label="On Leave" value={live.stats.onLeave} detail="Approved leave today" icon={CalendarPlus} tone="slate"/></div></div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(340px,.75fr)_minmax(0,1.25fr)]"><Overview stats={live.stats}/><LiveOfficeStatus employees={live.employees} connected={connected} /></div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]"><EmployeeAttendance employees={live.employees}/><LiveActivityFeed items={activity}/></div>
        </div>
      )}
    </>
  );
}
