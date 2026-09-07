import { initials } from "../../utils/helpers";
import AttendanceBadge from "./AttendanceBadge";
import LiveWorkTimer from "./LiveWorkTimer";
import BreakTimer from "./BreakTimer";
import { useMemo, useState } from "react";
const time = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";
export default function LiveOfficeStatus({ employees = [], connected = true }) {
  const [filter,setFilter]=useState("All");
  const shown=useMemo(()=>employees.filter(e=>{const live=e.liveStatus||e.status, attendance=e.attendanceStatus; if(filter==="All")return true;if(filter==="Working")return live==="WORKING";if(filter==="Break")return live==="ON_BREAK";if(filter==="Late")return attendance==="LATE";if(filter==="Leave")return attendance==="ON_LEAVE";return ["OFFLINE","NOT_CLOCKED_IN","CLOCKED_OUT"].includes(live)}),[employees,filter]);
  return (
    <section className="h-full rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Live Office Status</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Current employee availability
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary-text">
          <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {connected ? "LIVE" : "CONNECTING"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-1">{["All","Working","Break","Late","Leave","Offline"].map(x=><button key={x} onClick={()=>setFilter(x)} className={`rounded-full border px-3 py-1 text-xs ${filter===x?'bg-primary text-primary-foreground':'border-border text-muted-foreground'}`}>{x}</button>)}</div>
      <div className="mt-3 max-h-[430px] space-y-1 overflow-y-auto pr-1">
        {shown.length ? (
          shown.map((e) => (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-secondary"
              key={e.employeeId}
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">
                {initials(e.employeeName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {e.employeeName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {e.employeeCode} • {e.department}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  In: {time(e.clockInAt)}
                </p>
              </div>
              <div className="text-right">
                <AttendanceBadge status={e.liveStatus || e.status} />
                {e.attendanceStatus && e.attendanceStatus !== "PRESENT" && e.attendanceStatus !== e.status && (
                  <div className="mt-1"><AttendanceBadge status={e.attendanceStatus} /></div>
                )}
                {Number(e.chargeableLateMinutes) > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Late {e.chargeableLateMinutes} min after grace</p>
                )}
                <div className="mt-1.5 text-xs font-semibold text-foreground">
                  {(e.liveStatus || e.status) === "ON_BREAK" ? (
                    <>
                      <span className="mr-1 text-muted-foreground">Break:</span>
                      <BreakTimer seconds={e.currentBreakSeconds} running />
                    </>
                  ) : (
                    <>
                      <span className="mr-1 text-muted-foreground">
                        {e.status === "CLOCKED_OUT" ? "Worked:" : "Work:"}
                      </span>
                      <LiveWorkTimer
                        seconds={e.workSeconds}
                        running={(e.liveStatus || e.status) === "WORKING"}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No attendance-tracked employees.
          </p>
        )}
      </div>
    </section>
  );
}
