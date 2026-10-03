import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  TriangleAlert,
  Repeat2,
} from "lucide-react";
import ScheduledWorkForm from "../components/scheduledWork/ScheduledWorkForm";
import ReminderManager from "../components/scheduledWork/ReminderManager";
import * as api from "../services/scheduledWork.service";
const tabs = ["Today", "Upcoming", "Overdue", "Recurring", "Completed"];
const fmt = (v) =>
  new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
const relative = (v) => {
  const d = new Date(v) - Date.now(),
    past = d < 0,
    n = Math.abs(d),
    h = Math.floor(n / 36e5),
    m = Math.floor((n % 36e5) / 6e4),
    days = Math.floor(h / 24);
  return `${past ? "Overdue by" : "Due in"} ${days ? `${days}d ` : ""}${h % 24}h ${m}m`;
};
const recurrenceText = (x) => {
  if (x.recurrenceType === "DAILY") return "Every day";
  if (x.recurrenceType === "WEEKLY") {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Every week · ${(x.recurrenceConfig?.weekdays || []).map((d) => names[d]).join(", ")}`;
  }
  if (x.recurrenceType === "MONTHLY") return `Monthly · day ${x.recurrenceConfig?.monthDay}`;
  return `Every ${x.recurrenceInterval} ${x.recurrenceUnit?.toLowerCase()}`;
};
export default function ScheduledWorkPage() {
  const [tab, setTab] = useState("Today"),
    [items, setItems] = useState([]),
    [counts, setCounts] = useState({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [priority, setPriority] = useState(""),
    [form, setForm] = useState(null),
    [history, setHistory] = useState(null),
    [reminderWork, setReminderWork] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "Recurring") {
        const recurring = await api.listRecurringWork();
        setItems(recurring);
      } else {
      const status =
        tab === "Completed"
          ? "COMPLETED"
          : tab === "Overdue"
            ? "OVERDUE"
            : tab === "Today"
              ? "DUE_TODAY"
              : "UPCOMING";
      const data = await api.listScheduledWork({
        status,
        search: search || undefined,
        priority: priority || undefined,
        limit: 100,
      });
      setItems(data.items);
      }
      const results = await Promise.all(
        ["DUE_TODAY", "UPCOMING", "OVERDUE", "COMPLETED"].map((s) =>
          api.listScheduledWork({ status: s, limit: 1 }),
        ),
      );
      const recurring = await api.listRecurringWork();
      setCounts(
        { Today: results[0].pagination.total, Upcoming: results[1].pagination.total, Overdue: results[2].pagination.total, Recurring: recurring.length, Completed: results[3].pagination.total },
      );
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load scheduled work.");
    } finally {
      setLoading(false);
    }
  }, [tab, search, priority]);
  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);
  const act = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update scheduled work.");
    }
  };
  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Scheduled Work</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule future work and follow-ups so nothing is forgotten.
          </p>
        </div>
        <button
          onClick={() => setForm({ mode: "create" })}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Plus size={17} />
          Schedule Work
        </button>
      </header>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tabs.map((x, i) => {
          const I = [CalendarClock, Clock3, TriangleAlert, Repeat2, CheckCircle2][i];
          return (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`rounded-2xl border p-4 text-left shadow-sm ${tab === x ? "border-primary bg-primary-soft" : "border-border bg-surface"}`}
            >
              <I size={18} />
              <p className="mt-2 text-2xl font-black">{counts[x] ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{x}</p>
            </button>
          );
        })}
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <input
            aria-label="Search scheduled work"
            placeholder="Search scheduled work..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3"
          />
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
        >
          <option value="">All priorities</option>
          {["LOW", "NORMAL", "HIGH", "URGENT"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {error && (
        <div className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          Loading scheduled work…
        </div>
      ) : items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((x) => (
            <article
              key={`${x.id}-${x.occurrenceId || "parent"}`}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{x.title}</h2>
                  {x.isRecurring && <p className="mt-1 text-xs font-bold text-primary-text">↻ {recurrenceText(x)}</p>}
                  {x.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {x.description}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-[10px] font-bold">
                  {(x.displayStatus || x.recurrenceStatus).replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold">{x.scheduledAt ? fmt(x.scheduledAt) : x.nextOccurrenceAt ? `Next: ${fmt(x.nextOccurrenceAt)}` : "No future occurrence"}</p>
              {tab === "Recurring" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => api.listOccurrences(x.id, { limit: 100 }).then((data) => setHistory({ parent: x, items: data.items })).catch(() => setError("Unable to load occurrence history."))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">View</button>
                  {x.recurrenceStatus === "ACTIVE" ? <button onClick={() => act(() => api.pauseRecurrence(x.id))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">Pause</button> : x.recurrenceStatus === "PAUSED" ? <button onClick={() => act(() => api.resumeRecurrence(x.id))} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Resume</button> : null}
                  {x.recurrenceStatus !== "ENDED" && <button onClick={() => setForm({ mode: "recurrenceEdit", item: x })} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">Edit</button>}
                  {x.recurrenceStatus !== "ENDED" && <button onClick={() => window.confirm(`End Recurring Work?\n\n${x.title}\n\nFuture occurrences will stop being created. Existing history will remain available.`) && act(() => api.endRecurrence(x.id))} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger">End series</button>}
                </div>
              )}
              {tab !== "Recurring" && <>
              <button
                onClick={() => setReminderWork(x)}
                className="mt-2 text-left text-xs font-semibold text-primary-text"
              >
                Reminders: {x.reminders?.filter((r) => r.status !== "CANCELLED").map((r) =>
                  r.reminderType === "AT_TIME"
                    ? "at scheduled time"
                    : `${r.value} ${r.unit.toLowerCase()} before`,
                ).join(" + ") || "view history"}
              </button>
              {x.status === "UPCOMING" && (
                <p
                  className={`mt-1 text-xs ${x.displayStatus === "OVERDUE" ? "text-danger" : "text-muted-foreground"}`}
                >
                  {relative(x.scheduledAt)}
                </p>
              )}
              {x.activeSnooze && (
                <p className="mt-2 text-xs font-semibold text-primary-text">
                  Reminding again {fmt(x.activeSnooze.snoozedUntil)}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-auto text-[10px] font-bold text-muted-foreground">
                  {x.priority}
                </span>
                {x.status === "UPCOMING" && (
                  <>
                    <button
                      onClick={() => act(() => x.isOccurrence ? api.startOccurrence(x.id, x.occurrenceId) : api.startScheduledWork(x.id))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Do Now
                    </button>
                    <button
                      onClick={() => act(() => x.isOccurrence ? api.snoozeOccurrence(x.id, x.occurrenceId, { value: 20, unit: "MINUTES" }) : api.snoozeScheduledWork(x.id, { value: 20, unit: "MINUTES" }))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Remind 20m
                    </button>
                    <button
                      onClick={() => act(() => x.isOccurrence ? api.completeOccurrence(x.id, x.occurrenceId) : api.completeScheduledWork(x.id))}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      Complete
                    </button>
                    {!x.isOccurrence && <button
                      onClick={() => setForm({ mode: "reschedule", item: x })}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Reschedule
                    </button>}
                    {!x.isOccurrence && <button
                      onClick={() => setForm({ mode: "edit", item: x })}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Edit
                    </button>}
                    {!x.isOccurrence && <button
                      onClick={() => act(() => api.cancelScheduledWork(x.id))}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger"
                    >
                      Cancel
                    </button>}
                  </>
                )}
              </div>
              {x.completedAt && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Completed: {fmt(x.completedAt)}
                </p>
              )}
              </>}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <CalendarClock className="mx-auto text-muted-foreground" />
          <h2 className="mt-3 font-bold">No Scheduled Work</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule future work so important follow-ups and checks are not
            forgotten.
          </p>
          <button
            onClick={() => setForm({ mode: "create" })}
            className="mt-4 text-sm font-bold text-primary-text"
          >
            Schedule Work
          </button>
        </div>
      )}
      <ScheduledWorkForm
        key={form?.item?.id || form?.mode}
        open={Boolean(form)}
        initial={form?.item}
        rescheduleOnly={form?.mode === "reschedule"}
        recurrenceOnly={form?.mode === "recurrenceEdit"}
        onClose={() => setForm(null)}
        onSave={async (data) => {
          if (form.mode === "create") await api.createScheduledWork(data);
          else if (form.mode === "reschedule")
            await api.rescheduleScheduledWork(form.item.id, data);
          else if (form.mode === "recurrenceEdit")
            await api.updateRecurrence(form.item.id, data.repeat);
          else
            await api.updateScheduledWork(form.item.id, {
              title: data.title,
              description: data.description,
              priority: data.priority,
            });
          await load();
        }}
      />
      {reminderWork && (
        <ReminderManager
          work={reminderWork}
          onClose={() => setReminderWork(null)}
          onChanged={load}
        />
      )}
      {history && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/50 p-4">
          <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">{history.parent.title}</h2><p className="mt-1 text-xs font-bold text-primary-text">↻ {recurrenceText(history.parent)}</p></div><button onClick={() => setHistory(null)} className="px-2 text-muted-foreground">✕</button></div>
            <h3 className="mt-6 text-sm font-black">Occurrence history</h3>
            <div className="mt-3 space-y-2">{history.items.map((item) => <div key={item.occurrenceId} className="flex items-center justify-between rounded-xl bg-surface-secondary p-3"><div><p className="text-sm font-semibold">{fmt(item.scheduledAt)}</p>{item.completedAt && <p className="text-xs text-muted-foreground">Completed {fmt(item.completedAt)}</p>}</div><span className="text-[10px] font-black">{item.displayStatus.replaceAll("_", " ")}</span></div>)}</div>
          </section>
        </div>
      )}
    </>
  );
}
