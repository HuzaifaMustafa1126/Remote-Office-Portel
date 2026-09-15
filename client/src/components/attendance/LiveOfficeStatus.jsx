import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { initials } from "../../utils/helpers";
import AvailabilityBadge, {
  availabilityLabels,
} from "../availability/AvailabilityBadge";

const statuses = [
  "ONLINE",
  "IN_MEETING",
  "DO_NOT_DISTURB",
  "ON_BREAK",
  "AWAY",
  "NAMAZ",
  "OFFLINE",
];
const dots = {
  ONLINE: "bg-success",
  IN_MEETING: "bg-primary",
  DO_NOT_DISTURB: "bg-danger",
  ON_BREAK: "bg-warning",
  AWAY: "bg-warning/60",
  NAMAZ: "bg-accent",
  OFFLINE: "bg-muted-foreground/50",
};
const relative = (value, now) => {
  if (!value) return "Not recently seen";
  const minutes = Math.max(
    0,
    Math.round((new Date(now) - new Date(value)) / 60000),
  );
  if (minutes < 2) return "Last seen recently";
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  return `Last seen ${new Intl.DateTimeFormat("en-PK", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))}`;
};
const untilLabel = (value) =>
  value
    ? `Until ${new Intl.DateTimeFormat("en-PK", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))}`
    : "Available now";

export default function LiveOfficeStatus({ data, connected = true }) {
  const [filter, setFilter] = useState("ALL"),
    [expanded, setExpanded] = useState(true);
  const employees = data?.employees || [];
  const shown = useMemo(
    () =>
      filter === "ALL"
        ? employees
        : employees.filter((employee) => employee.availability === filter),
    [employees, filter],
  );
  return (
    <section className="min-w-0 rounded-2xl border border-border/70 bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)] transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(0,0,0,.05)] sm:p-6">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div>
          <h2 className="font-bold tracking-tight">Team Availability</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Portal presence is separate from attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-primary-text">
            <i className="h-1.5 w-1.5 rounded-full bg-primary" />
            {connected ? "Live" : "Connecting"}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl bg-surface-secondary/70 sm:grid-cols-3">
        {statuses.map((status, index) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setExpanded(true);
            }}
            className={`min-w-0 px-3 py-3 text-left transition-colors duration-150 hover:bg-primary-soft/50 ${filter === status ? "bg-primary-soft/70" : ""} ${index < 3 ? "border-b border-border/50" : ""}`}
          >
            <span className="flex items-center gap-2 truncate text-[10px] text-muted-foreground">
              <i
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dots[status]}`}
              />
              {availabilityLabels[status]}
            </span>
            <strong className="mt-1 block text-lg tracking-tight">
              {data?.counts?.[status] || 0}
            </strong>
          </button>
        ))}
      </div>
      {expanded && (
        <>
          <div
            className="mt-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Filter team availability"
          >
            {["ALL", ...statuses].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors duration-150 ${filter === status ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-muted-foreground hover:bg-primary-soft hover:text-primary-text"}`}
              >
                {status === "ALL" ? "All" : availabilityLabels[status]}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[320px] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-color:rgb(var(--border))_transparent] [scrollbar-width:thin]">
            {shown.length ? (
              shown.map((employee, index) => (
                <div
                  key={employee.employeeId}
                  className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 transition-colors duration-150 hover:bg-surface-secondary/45 ${index ? "border-t border-border/60" : ""}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">
                    {initials(employee.employeeName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {employee.employeeName}
                    </p>
                    {employee.ongoingWorkTitle&&<p className="mt-0.5 truncate text-[10px] text-primary-text">Working on: {employee.ongoingWorkTitle}</p>}
                    <p className="truncate text-[11px] text-muted-foreground">
                      {employee.jobTitle || employee.role} ·{" "}
                      {employee.department}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {employee.availability === "OFFLINE"
                        ? relative(employee.lastSeenAt, data.serverTime)
                        : untilLabel(employee.statusUntil)}
                    </p>
                  </div>
                  <div className="min-w-0 text-right">
                    <AvailabilityBadge status={employee.availability} />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {employee.attendance === "CLOCKED_IN"
                        ? "Clocked in"
                        : employee.attendance === "ON_BREAK"
                          ? "On break"
                          : "Clocked out"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No team members match this status.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
