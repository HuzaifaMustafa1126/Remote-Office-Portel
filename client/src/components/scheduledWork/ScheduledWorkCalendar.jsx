import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as api from "../../services/scheduledWork.service";

const isoDay = (date) => date.toISOString().slice(0, 10);
const addDays = (value, count) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return isoDay(date);
};
const monthRange = (anchor) => {
  const date = new Date(`${anchor.slice(0, 7)}-01T00:00:00Z`),
    start = new Date(date),
    end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));
  return { from: isoDay(start), to: isoDay(end) };
};
const weekRange = (anchor) => {
  const date = new Date(`${anchor}T00:00:00Z`),
    day = date.getUTCDay();
  return { from: addDays(anchor, -day), to: addDays(anchor, 6 - day) };
};
const time = (value) =>
  new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
const label = (value, options) =>
  new Intl.DateTimeFormat("en-PK", { timeZone: "UTC", ...options }).format(
    new Date(`${value}T00:00:00Z`),
  );

export default function ScheduledWorkCalendar({
  priority = "",
  type = "ALL",
  onOpen,
  loadCalendar = api.getCalendar,
  employeeId = "",
  showAssignee = false,
}) {
  const [view, setViewState] = useState(
    () => localStorage.getItem("scheduled-work-calendar-view") || "MONTH",
  );
  const [anchor, setAnchor] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const range = useMemo(
    () =>
      view === "MONTH"
        ? monthRange(anchor)
        : view === "WEEK"
          ? weekRange(anchor)
          : { from: anchor, to: anchor },
    [anchor, view],
  );
  useEffect(() => {
    setLoading(true);
    setError("");
    loadCalendar({
      ...range,
      priority: priority || undefined,
      type,
      employeeId: employeeId || undefined,
    })
      .then(setItems)
      .catch(() => setError("Unable to load calendar."))
      .finally(() => setLoading(false));
  }, [range.from, range.to, priority, type, employeeId, loadCalendar]);
  const setView = (next) => {
    localStorage.setItem("scheduled-work-calendar-view", next);
    setViewState(next);
  };
  const move = (direction) =>
    setAnchor((value) =>
      view === "MONTH"
        ? (() => {
            const d = new Date(`${value.slice(0, 7)}-01T00:00:00Z`);
            d.setUTCMonth(d.getUTCMonth() + direction);
            return isoDay(d);
          })()
        : addDays(value, direction * (view === "WEEK" ? 7 : 1)),
    );
  const byDay = items.reduce((groups, item) => {
    const day = item.scheduledAt.slice(0, 10);
    (groups[day] ||= []).push(item);
    return groups;
  }, {});
  const days = [];
  for (let value = range.from; value <= range.to; value = addDays(value, 1))
    days.push(value);
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black">
            {view === "MONTH"
              ? label(anchor.slice(0, 7) + "-01", {
                  month: "long",
                  year: "numeric",
                })
              : view === "WEEK"
                ? `${label(range.from, { month: "short", day: "numeric" })} – ${label(range.to, { month: "short", day: "numeric", year: "numeric" })}`
                : label(anchor, { dateStyle: "full" })}
          </h2>
          <p className="text-xs text-muted-foreground">
            Times shown in Pakistan time
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous period"
            onClick={() => move(-1)}
            className="rounded-lg border border-border p-2"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() =>
              setAnchor(
                new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Karachi",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date()),
              )
            }
            className="rounded-lg border border-border px-3 py-2 text-xs font-bold"
          >
            Today
          </button>
          <button
            aria-label="Next period"
            onClick={() => move(1)}
            className="rounded-lg border border-border p-2"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex gap-1 rounded-xl bg-surface-secondary p-1">
        {["MONTH", "WEEK", "DAY"].map((option) => (
          <button
            key={option}
            onClick={() => setView(option)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${view === option ? "bg-surface shadow-sm" : "text-muted-foreground"}`}
          >
            {option[0] + option.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}{" "}
          <button
            onClick={() => setAnchor((x) => x)}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className="mt-4 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-surface-secondary"
            />
          ))}
        </div>
      ) : view === "MONTH" ? (
        <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-border">
          <>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-surface-secondary p-2 text-center text-[10px] font-bold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => {
                setAnchor(day);
                setView("DAY");
              }}
              aria-label={`${label(day, { dateStyle: "long" })}, ${(byDay[day] || []).length} scheduled items`}
              className={`min-h-24 bg-surface p-2 text-left align-top ${day.slice(0, 7) !== anchor.slice(0, 7) ? "opacity-45" : ""}`}
            >
              <span className="text-xs font-bold">{Number(day.slice(8))}</span>
              <div className="mt-2 space-y-1">
                {(byDay[day] || []).slice(0, 3).map((item) => (
                  <span
                    key={`${item.id}-${item.occurrenceId || "p"}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(item);
                    }}
                    className="block truncate rounded bg-surface-secondary px-1.5 py-1 text-[10px] font-semibold"
                  >
                    {time(item.scheduledAt)} {item.isRecurring ? "↻ " : ""}
                    {item.title}
                    {showAssignee && item.assigneeName
                      ? ` · ${item.assigneeName}`
                      : ""}
                  </span>
                ))}
                {(byDay[day] || []).length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{(byDay[day] || []).length - 3} more
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`mt-4 grid gap-3 ${view === "WEEK" ? "grid-cols-1 md:grid-cols-7" : "grid-cols-1"}`}
        >
          {days.map((day) => (
            <div
              key={day}
              className="min-w-0 rounded-xl bg-surface-secondary p-3"
            >
              <button
                onClick={() => {
                  setAnchor(day);
                  setView("DAY");
                }}
                className="text-xs font-black"
              >
                {label(day, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </button>
              <div className="mt-3 space-y-2">
                {(byDay[day] || []).map((item) => (
                  <button
                    key={`${item.id}-${item.occurrenceId || "p"}`}
                    onClick={() => onOpen(item)}
                    className="block w-full rounded-lg border border-border bg-surface p-2 text-left"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {time(item.scheduledAt)}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold">
                      {item.isRecurring ? "↻ " : ""}
                      {item.title}
                    </span>
                    <span className="mt-1 block text-[9px] font-bold">
                      {item.displayStatus.replaceAll("_", " ")}
                    </span>
                  </button>
                ))}
                {!(byDay[day] || []).length && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No scheduled work.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
