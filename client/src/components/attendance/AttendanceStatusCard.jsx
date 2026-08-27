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
      {statusCard}
      <EmployeeLeavePanel summary={leave.summary} requests={leave.requests} />
    </div>
  );
}
