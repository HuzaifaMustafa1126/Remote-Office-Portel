import { useEffect, useState } from "react";
import { Clock3, Coffee } from "lucide-react";
import AttendanceActionButtons from "./AttendanceActionButtons";
import BreakTimer from "./BreakTimer";
import LiveWorkTimer from "./LiveWorkTimer";
import EmployeeLeavePanel from "../leave/EmployeeLeavePanel";
import { getMyLeaves, getSummary } from "../../services/leave.service";

const colors = {
  NOT_CLOCKED_IN: "bg-slate-100 text-slate-600",
  WORKING: "bg-emerald-100 text-emerald-700",
  ON_BREAK: "bg-amber-100 text-amber-700",
  CLOCKED_OUT: "bg-indigo-100 text-indigo-700",
};
const time = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";
const duration = (value) =>
  `${Math.floor(Number(value || 0) / 60)}h ${Number(value || 0) % 60}m`;
const scheduleTime = (value) =>
  value
    ? new Date(`2000-01-01T${value}`).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function AttendanceStatusCard({ data, busy, actions }) {
  const [leave, setLeave] = useState({ summary: {}, requests: [] });
  const status = data?.status || "NOT_CLOCKED_IN";
  const record = data?.record;
  const activeBreak = data?.breaks?.find((item) => item.status === "ACTIVE");

  useEffect(() => {
    let active = true;
    Promise.all([getSummary(), getMyLeaves()])
      .then(([summary, requests]) => {
        if (active)
          setLeave({ summary: summary || {}, requests: requests || [] });
      })
      .catch(() => {
        if (active) setLeave({ summary: {}, requests: [] });
      });
    return () => {
      active = false;
    };
  }, [data]);

  const statusCard =
    data?.companyDay && !data.companyDay.isWorkingDay && !record ? (
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white shadow-xl">
        <p className="text-xs font-bold tracking-[.2em] text-indigo-300">
          OFFICE CLOSED TODAY
        </p>
        <h2 className="mt-4 text-3xl font-black">{data.companyDay.title}</h2>
        <p className="mt-2 text-slate-300">
          {data.companyDay.dayType.replaceAll("_", " ")} · Attendance is not
          required today.
        </p>
      </section>
    ) : (
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[.2em] text-indigo-300">
              CURRENT STATUS
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${colors[status]}`}
            >
              {status.replaceAll("_", " ")}
            </span>
            <h2 className="mt-5 text-4xl font-black tracking-tight">
              <LiveWorkTimer
                seconds={record?.liveWorkSeconds || 0}
                running={status === "WORKING"}
              />
            </h2>
            <p className="mt-1 text-sm text-slate-400">Live work time</p>
          </div>
          <AttendanceActionButtons status={status} busy={busy} {...actions} />
        </div>
        <div className="mt-8 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Clock3 className="text-indigo-300" />
            <div>
              <p className="text-xs text-slate-400">Clocked in</p>
              <p className="font-semibold">{time(record?.clockInAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Coffee className="text-indigo-300" />
            <div>
              <p className="text-xs text-slate-400">Completed breaks</p>
              <p className="font-semibold">
                {record?.totalBreakMinutes || 0} min
              </p>
            </div>
          </div>
          {activeBreak && (
            <div>
              <p className="text-xs text-slate-400">Current break</p>
              <BreakTimer seconds={activeBreak.liveDurationSeconds} running />
            </div>
          )}
        </div>
      </section>
    );

  return (
    <div className="space-y-5">
      {data?.schedule && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Today's Schedule
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Shift</p>
              <p className="font-semibold">
                {scheduleTime(data.schedule.clockInTime)} →{" "}
                {scheduleTime(data.schedule.clockOutTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Grace</p>
              <p className="font-semibold">{data.schedule.graceMinutes} min</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Required</p>
              <p className="font-semibold">
                {duration(data.schedule.requiredWorkMinutes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Break</p>
              <p className="font-semibold">
                {duration(data.schedule.breakAllowanceMinutes)}
              </p>
            </div>
          </div>
          {record && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs">
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
                Work date:{" "}
                {new Date(`${record.workDate}T00:00:00`).toLocaleDateString(
                  "en-PK",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-bold ${record.arrivalStatus === "LATE" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
              >
                {record.arrivalStatus === "LATE"
                  ? `${record.lateMinutes}m late`
                  : "On time"}
              </span>
              {record.reconciliationStatus === "OPEN_SHIFT" && (
                <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">
                  Open shift · review required
                </span>
              )}
              {status === "CLOCKED_OUT" && (
                <>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Short: {record.shortMinutes}m
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Extra: {record.extraMinutes}m
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Break exceeded: {record.breakExceededMinutes}m
                  </span>
                </>
              )}
            </div>
          )}
        </section>
      )}
      {statusCard}
      <EmployeeLeavePanel summary={leave.summary} requests={leave.requests} />
    </div>
  );
}
