import { Clock3, Coffee } from "lucide-react";
import AttendanceActionButtons from "./AttendanceActionButtons";
import BreakTimer from "./BreakTimer";
import LiveWorkTimer from "./LiveWorkTimer";

const colors = {
  NOT_CLOCKED_IN: "bg-surface-secondary text-muted-foreground",
  WORKING: "bg-success-soft text-success",
  ON_BREAK: "bg-warning-soft text-warning",
  CLOCKED_OUT: "bg-primary-soft text-primary-text",
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
  const status = data?.status || "NOT_CLOCKED_IN";
  const record = data?.record;
  const activeBreak = data?.breaks?.find((item) => item.status === "ACTIVE");

  const statusCard =
    data?.companyDay && !data.companyDay.isWorkingDay && !record ? (
      <section className="rounded-3xl bg-gradient-to-br from-hero to-hero-end p-8 text-hero-foreground shadow-xl">
        <p className="text-xs font-bold tracking-[.2em] text-hero-muted">
          OFFICE CLOSED TODAY
        </p>
        <h2 className="mt-4 text-3xl font-black">{data.companyDay.title}</h2>
        <p className="mt-2 text-hero-muted">
          {data.companyDay.dayType.replaceAll("_", " ")} · Attendance is not
          required today.
        </p>
      </section>
    ) : (
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-hero to-hero-end p-6 text-hero-foreground shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[.2em] text-hero-muted">
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
            <p className="mt-1 text-sm text-hero-muted">Live work time</p>
          </div>
          <AttendanceActionButtons status={status} busy={busy} {...actions} />
        </div>
        <div className="mt-8 grid gap-3 border-t border-sidebar-foreground/10 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Clock3 className="text-hero-muted" />
            <div>
              <p className="text-xs text-hero-muted">Clocked in</p>
              <p className="font-semibold">{time(record?.clockInAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Coffee className="text-hero-muted" />
            <div>
              <p className="text-xs text-hero-muted">Completed breaks</p>
              <p className="font-semibold">
                {record?.totalBreakMinutes || 0} min
              </p>
            </div>
          </div>
          {activeBreak && (
            <div>
              <p className="text-xs text-hero-muted">Current break</p>
              <BreakTimer seconds={activeBreak.liveDurationSeconds} running className="font-mono font-bold text-hero-foreground" />
            </div>
          )}
        </div>
      </section>
    );

  return (
    <div className="space-y-5">
      {data?.schedule && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-text">
            Today's Schedule
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Shift</p>
              <p className="font-semibold">
                {scheduleTime(data.schedule.clockInTime)} →{" "}
                {scheduleTime(data.schedule.clockOutTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grace</p>
              <p className="font-semibold">{data.schedule.graceMinutes} min</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Required</p>
              <p className="font-semibold">
                {duration(data.schedule.requiredWorkMinutes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Break</p>
              <p className="font-semibold">
                {duration(data.schedule.breakAllowanceMinutes)}
              </p>
            </div>
          </div>
          {record && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
              <span className="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary-text">
                Work date:{" "}
                {new Date(`${record.workDate}T00:00:00`).toLocaleDateString(
                  "en-PK",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-bold ${record.arrivalStatus === "LATE" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}
              >
                {record.arrivalStatus === "LATE"
                  ? `${record.lateMinutes}m late`
                  : "On time"}
              </span>
              {record.reconciliationStatus === "OPEN_SHIFT" && (
                <span className="rounded-full bg-danger-soft px-3 py-1 font-bold text-danger">
                  Open shift · review required
                </span>
              )}
              {status === "CLOCKED_OUT" && (
                <>
                  <span className="rounded-full bg-surface-secondary px-3 py-1">
                    Short: {record.shortMinutes}m
                  </span>
                  <span className="rounded-full bg-surface-secondary px-3 py-1">
                    Extra: {record.extraMinutes}m
                  </span>
                  <span className="rounded-full bg-surface-secondary px-3 py-1">
                    Break exceeded: {record.breakExceededMinutes}m
                  </span>
                </>
              )}
            </div>
          )}
        </section>
      )}
      {statusCard}
    </div>
  );
}
