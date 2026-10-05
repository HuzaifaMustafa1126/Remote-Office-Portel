import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  TriangleAlert,
  Repeat2,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import ScheduledWorkForm from "../components/scheduledWork/ScheduledWorkForm";
import ReminderManager from "../components/scheduledWork/ReminderManager";
import ScheduledWorkCalendar from "../components/scheduledWork/ScheduledWorkCalendar";
import TeamScheduledWork from "../components/scheduledWork/TeamScheduledWork";
import * as api from "../services/scheduledWork.service";
import { publishPortalStateChanged } from "../utils/portalSync";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS as P } from "../utils/permissions";
const tabs = ["Overview", "Today", "Upcoming", "Overdue", "Recurring", "Completed", "Calendar"];
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
const pakistanDay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const daysBefore = (value, count) => { const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - count); return date.toISOString().slice(0, 10); };
export default function ScheduledWorkPage() {
  const navigate = useNavigate();
  const canViewTeam = usePermission(P.SCHEDULED_WORK_VIEW_TEAM), canAssignTeam = usePermission(P.SCHEDULED_WORK_ASSIGN), canManageTeam = usePermission(P.SCHEDULED_WORK_MANAGE_TEAM), canReassignTeam = usePermission(P.SCHEDULED_WORK_REASSIGN);
  const [scope, setScope] = useState("MY");
  const [tab, setTab] = useState("Overview"),
    [items, setItems] = useState([]),
    [overview, setOverview] = useState(null),
    [counts, setCounts] = useState({}),
    [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 }),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [priority, setPriority] = useState(""),
    [type, setType] = useState("ALL"),
    [recurrenceStatus, setRecurrenceStatus] = useState("ACTIVE"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [form, setForm] = useState(null),
    [history, setHistory] = useState(null),
    [detail, setDetail] = useState(null),
    [completeTarget, setCompleteTarget] = useState(null),
    [now, setNow] = useState(() => new Date()),
    [reminderWork, setReminderWork] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "Overview") {
        const data = await api.getOverview();
        setOverview(data);
        setItems([]);
        setCounts({ Today: data.counts.today, "Due Now": data.counts.dueNow, Overdue: data.counts.overdue, Upcoming: data.counts.upcoming, Recurring: data.counts.recurring });
      } else if (tab === "Calendar") {
        setItems([]);
      } else if (tab === "Recurring") {
        const recurring = await api.listRecurringWork();
        setItems(recurring.filter((item) => (!search || `${item.title} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase())) && (!priority || item.priority === priority) && (!recurrenceStatus || item.recurrenceStatus === recurrenceStatus)));
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
        type,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: tab === "Today" ? 100 : 20,
      });
      setItems(data.items);
      setPagination(data.pagination);
      }
      if (["Overview", "Calendar"].includes(tab)) return;
      const overviewData = await api.getOverview();
      setOverview(overviewData);
      setCounts({ Today: overviewData.counts.today, Upcoming: overviewData.counts.upcoming, Overdue: overviewData.counts.overdue, Recurring: overviewData.counts.recurring });
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load scheduled work.");
    } finally {
      setLoading(false);
    }
  }, [tab, search, priority, type, recurrenceStatus, from, to, page]);
  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);
  useEffect(() => { setPage(1); }, [tab, search, priority, type, recurrenceStatus, from, to]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), workId = params.get("work"), occurrenceId = params.get("occurrence");
    if (!workId) return;
    (occurrenceId ? api.getOccurrence(workId, occurrenceId) : api.getScheduledWork(workId)).then(setDetail).catch(() => {});
  }, []);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const act = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update scheduled work.");
    }
  };
  const startExecution = async (item) => {
    const result = item.isOccurrence ? await api.startOccurrenceWork(item.id, item.occurrenceId) : await api.startWork(item.id);
    publishPortalStateChanged("ONGOING_WORK_CHANGED", { includeCurrent: true });
    if (result.executionType === "TASK") navigate(`/tasks?task=${result.task.id}`);
    else navigate("/dashboard");
    return result;
  };
  const requestComplete = (item) => item.ongoingWorkId
    ? setCompleteTarget(item)
    : act(() => item.isOccurrence ? api.completeOccurrence(item.id, item.occurrenceId) : api.completeScheduledWork(item.id));
  if (scope === "TEAM" && canViewTeam) return <TeamScheduledWork onPersonal={()=>setScope("MY")} canAssign={canAssignTeam} canManage={canManageTeam} canReassign={canReassignTeam}/>;
  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Scheduled Work</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule future work and follow-ups so nothing is forgotten.
          </p>
        </div>
        <div className="flex gap-2">{canViewTeam&&<button onClick={()=>setScope("TEAM")} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Team Schedule</button>}<button
          onClick={() => setForm({ mode: "create" })}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Plus size={17} />
          Schedule Work
        </button></div>
      </header>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1" role="tablist" aria-label="Scheduled work views">
        {tabs.map((x) => <button role="tab" aria-selected={tab === x} key={x} onClick={() => setTab(x)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${tab === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-secondary"}`}>{x}</button>)}
      </div>
      {tab === "Overview" && overview && <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">{[
        ["Today", overview.counts.today, CalendarClock, "Today"],
        ["Due Now", overview.counts.dueNow, Clock3, "Today"],
        ["Overdue", overview.counts.overdue, TriangleAlert, "Overdue"],
        ["Upcoming", overview.counts.upcoming, CalendarDays, "Upcoming"],
        ["Recurring", `${overview.counts.recurring} Active`, Repeat2, "Recurring"],
      ].map(([label, value, Icon, target]) => <button key={label} onClick={() => setTab(target)} className="rounded-2xl border border-border bg-surface p-4 text-left shadow-sm"><Icon size={17}/><p className="mt-2 text-xl font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></button>)}</div>}
      {!['Overview','Calendar'].includes(tab) && <div className="mb-4 flex flex-col gap-2 sm:flex-row">
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
        {tab === "Recurring" && <select value={recurrenceStatus} onChange={(e) => setRecurrenceStatus(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="ENDED">Ended</option><option value="">All statuses</option></select>}
        {!["Recurring"].includes(tab) && <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"><option value="ALL">All types</option><option value="ONE_TIME">One-Time</option><option value="RECURRING">Recurring</option></select>}
        {!["Today","Recurring"].includes(tab) && <><input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"/><input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"/></>}
      </div>}
      {tab === "Completed" && <div className="-mt-2 mb-4 flex flex-wrap gap-2">{[["Today",0],["Last 7 Days",6],["Last 30 Days",29]].map(([label,days])=><button key={label} onClick={()=>{const today=pakistanDay();setFrom(daysBefore(today,days));setTo(today);}} className="rounded-lg bg-surface-secondary px-3 py-1.5 text-xs font-semibold">{label}</button>)}{(from||to)&&<button onClick={()=>{setFrom('');setTo('');}} className="px-2 text-xs font-bold text-primary-text">Clear dates</button>}</div>}
      {tab === "Calendar" && <div className="mb-4 flex flex-wrap gap-2"><select value={priority} onChange={(e)=>setPriority(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"><option value="">All priorities</option>{["LOW","NORMAL","HIGH","URGENT"].map((value)=><option key={value}>{value}</option>)}</select><select value={type} onChange={(e)=>setType(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"><option value="ALL">All types</option><option value="ONE_TIME">One-Time</option><option value="RECURRING">Recurring</option></select></div>}
      {error && (
        <div className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error} <button onClick={load} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}
      {loading ? (
        <div className="space-y-3"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-secondary"/>)}</div><div className="h-64 animate-pulse rounded-2xl bg-surface-secondary"/></div>
      ) : tab === "Calendar" ? (
        <ScheduledWorkCalendar priority={priority} type={type} onOpen={setDetail}/>
      ) : tab === "Overview" && overview ? (
        <div className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]">
          <div className="space-y-4">
              {overview.dueNow.length > 0 && <section className="rounded-2xl border border-danger/20 bg-surface p-5 shadow-sm"><div className="flex items-center gap-2"><Clock3 size={17} className="text-danger"/><h2 className="text-sm font-black uppercase tracking-wide">Due Now</h2></div><div className="mt-3 space-y-2">{overview.dueNow.map((x)=><div key={`${x.id}-${x.occurrenceId||'p'}`} className="rounded-xl bg-danger-soft p-4"><button onClick={()=>setDetail(x)} className="font-bold">{x.title}</button><p className="mt-1 text-xs text-muted-foreground">{fmt(x.scheduledAt)} · {relative(x.scheduledAt)}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>act(()=>startExecution(x))} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">{x.linkedTaskId ? "Open Linked Task" : "Start Work"}</button><button onClick={()=>act(()=>x.isOccurrence?api.snoozeOccurrence(x.id,x.occurrenceId,{value:20,unit:'MINUTES'}):api.snoozeScheduledWork(x.id,{value:20,unit:'MINUTES'}))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold">Remind 20m</button><button onClick={()=>act(()=>x.isOccurrence?api.completeOccurrence(x.id,x.occurrenceId):api.completeScheduledWork(x.id))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold">Complete</button></div></div>)}</div></section>}
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Today’s Schedule</h2><button onClick={()=>setTab('Today')} className="text-xs font-bold text-primary-text">View all</button></div><div className="mt-3 flex items-center gap-2 text-[10px] font-black text-primary-text"><span className="h-px flex-1 bg-primary/30"/>NOW · {new Intl.DateTimeFormat('en-PK',{timeZone:'Asia/Karachi',hour:'numeric',minute:'2-digit'}).format(now)}<span className="h-px flex-1 bg-primary/30"/></div><div className="mt-4 border-l border-border pl-4">{overview.today.length ? overview.today.map((x)=><div key={`${x.id}-${x.occurrenceId||'p'}`} className="relative pb-5 last:pb-0"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary"/><p className="text-xs font-bold text-muted-foreground">{new Intl.DateTimeFormat('en-PK',{timeZone:'Asia/Karachi',hour:'numeric',minute:'2-digit'}).format(new Date(x.scheduledAt))}</p><button onClick={()=>setDetail(x)} className="mt-1 text-left text-sm font-bold">{x.title}</button>{x.isRecurring&&<p className="text-[11px] font-semibold text-primary-text">↻ {recurrenceText(x)}</p>}<p className="mt-1 text-[10px] font-bold">{x.displayStatus.replaceAll('_',' ')}</p></div>) : <p className="py-4 text-sm text-muted-foreground">You’re clear for today.</p>}</div></section>
          </div>
          <div className="space-y-4"><section className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Overdue</h2><button onClick={()=>setTab('Overdue')} className="text-xs font-bold text-primary-text">View all</button></div><div className="mt-3 space-y-3">{overview.overduePreview.length?overview.overduePreview.map((x)=><button key={`${x.id}-${x.occurrenceId||'p'}`} onClick={()=>setDetail(x)} className="block w-full rounded-xl bg-surface-secondary p-3 text-left"><span className="block text-sm font-bold">{x.title}</span><span className="mt-1 block text-xs text-danger">{fmt(x.scheduledAt)} · {relative(x.scheduledAt)}</span></button>):<p className="text-sm text-muted-foreground">No overdue scheduled work.</p>}</div></section><section className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Next Up</h2><button onClick={()=>setTab('Calendar')} className="text-xs font-bold text-primary-text">View calendar</button></div><div className="mt-3 space-y-3">{overview.upcomingPreview.slice(0,5).map((x)=><button key={`${x.id}-${x.occurrenceId||'p'}`} onClick={()=>setDetail(x)} className="block w-full border-b border-border pb-3 text-left last:border-0 last:pb-0"><span className="block text-xs font-bold text-muted-foreground">{fmt(x.scheduledAt)}</span><span className="mt-1 block text-sm font-bold">{x.isRecurring?'↻ ':''}{x.title}</span></button>)}</div></section></div>
        </div>
      ) : items.length || (tab === "Today" && overview?.completedToday?.length) ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="lg:col-span-2"><h2 className="text-lg font-black">{tab === 'Today' ? new Intl.DateTimeFormat('en-PK',{timeZone:'Asia/Karachi',dateStyle:'full'}).format(new Date()) : `${tab} Scheduled Work`}</h2><p className="mt-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}{tab === 'Overdue' ? ' need attention' : ''}</p>{tab === 'Today' && overview?.completedToday && <div className="mt-3 rounded-xl bg-surface-secondary p-3"><div className="flex justify-between text-xs font-bold"><span>Today’s Progress</span><span>{overview.completedToday.length} of {overview.completedToday.length + items.length} completed</span></div><div className="mt-2 h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{width:`${Math.round(overview.completedToday.length / Math.max(1,overview.completedToday.length + items.length) * 100)}%`}}/></div></div>}</div>
          {items.map((x) => (
            <article
              key={`${x.id}-${x.occurrenceId || "parent"}`}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button onClick={() => setDetail(x)} className="text-left font-bold hover:underline">{x.title}</button>
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
                      onClick={() => x.ongoingWorkId ? navigate("/dashboard") : act(() => startExecution(x))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      {x.ongoingWorkId ? "Open Work" : x.linkedTaskId ? "Open Task" : "Start Work"}
                    </button>
                    {!x.ongoingWorkId && <button
                      onClick={() => act(() => x.isOccurrence ? api.snoozeOccurrence(x.id, x.occurrenceId, { value: 20, unit: "MINUTES" }) : api.snoozeScheduledWork(x.id, { value: 20, unit: "MINUTES" }))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Remind 20m
                    </button>}
                    <button
                      onClick={() => requestComplete(x)}
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
                    {x.isOccurrence && <button
                      onClick={() => setForm({ mode: "occurrenceReschedule", item: x })}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >Reschedule This Occurrence</button>}
                    {!x.isOccurrence && <button
                      onClick={() => setForm({ mode: "edit", item: x })}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Edit
                    </button>}
                    {!x.isOccurrence && <button
                      onClick={() => (!x.ongoingWorkId || window.confirm("Active Work Exists\n\nCancelling the schedule will not stop or delete the linked Ongoing Work. Continue?")) && act(() => api.cancelScheduledWork(x.id, x.ongoingWorkId ? { executionHandling: "SCHEDULE_ONLY" } : {}))}
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
          {tab === "Today" && overview?.completedToday?.length > 0 && <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2"><h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground">Completed Today</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{overview.completedToday.map((item)=><button key={`${item.id}-${item.occurrenceId||'p'}`} onClick={()=>setDetail(item)} className="rounded-xl bg-surface-secondary p-3 text-left"><span className="text-sm font-semibold">✓ {item.title}</span><span className="mt-1 block text-xs text-muted-foreground">Completed {fmt(item.completedAt)}</span></button>)}</div></section>}
          {!["Today","Recurring"].includes(tab) && pagination.pages > 1 && <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 lg:col-span-2"><button disabled={page <= 1} onClick={()=>setPage((value)=>value-1)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40">Previous</button><span className="text-xs text-muted-foreground">Page {page} of {pagination.pages}</span><button disabled={page >= pagination.pages} onClick={()=>setPage((value)=>value+1)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40">Next</button></div>}
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
        rescheduleOnly={["reschedule", "occurrenceReschedule"].includes(form?.mode)}
        recurrenceOnly={form?.mode === "recurrenceEdit"}
        onClose={() => setForm(null)}
        onSave={async (data) => {
          if (form.mode === "create") await api.createScheduledWork(data);
          else if (form.mode === "reschedule")
            await api.rescheduleScheduledWork(form.item.id, form.item.ongoingWorkId
              ? { ...data, confirmActiveExecution: window.confirm("Work Already Started\n\nRescheduling changes reminders but does not move or delete the active Ongoing Work. Continue?") }
              : data);
          else if (form.mode === "occurrenceReschedule")
            await api.rescheduleOccurrence(form.item.id, form.item.occurrenceId, form.item.ongoingWorkId
              ? { ...data, confirmActiveExecution: window.confirm("Work Already Started\n\nRescheduling this occurrence does not move or delete its active Ongoing Work. Continue?") }
              : data);
          else if (form.mode === "recurrenceEdit")
            await api.updateRecurrence(form.item.id, data.repeat);
          else
            await api.updateScheduledWork(form.item.id, {
              title: data.title,
              description: data.description,
              priority: data.priority,
              linkedTaskId: data.linkedTaskId,
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
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-overlay/50" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="scheduled-work-detail-title" className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">{detail.isOccurrence ? "This Occurrence" : detail.isRecurring ? "Recurring Schedule" : "Scheduled Work"}</p><h2 id="scheduled-work-detail-title" className="mt-2 text-xl font-black">{detail.title}</h2></div><button autoFocus aria-label="Close details" onClick={() => setDetail(null)} className="rounded-lg px-2 py-1 text-muted-foreground">✕</button></div>
            {detail.description && <p className="mt-4 text-sm text-muted-foreground">{detail.description}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-surface-secondary p-4 text-sm"><div><dt className="text-xs text-muted-foreground">Scheduled</dt><dd className="mt-1 font-semibold">{detail.scheduledAt ? fmt(detail.scheduledAt) : detail.nextOccurrenceAt ? fmt(detail.nextOccurrenceAt) : "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 font-semibold">{(detail.displayStatus || detail.recurrenceStatus).replaceAll('_',' ')}</dd></div><div><dt className="text-xs text-muted-foreground">Priority</dt><dd className="mt-1 font-semibold">{detail.priority}</dd></div>{detail.isRecurring && <div><dt className="text-xs text-muted-foreground">Repeats</dt><dd className="mt-1 font-semibold">{recurrenceText(detail)}</dd></div>}{detail.startedAt && <div><dt className="text-xs text-muted-foreground">Started</dt><dd className="mt-1 font-semibold">{fmt(detail.startedAt)}</dd></div>}{detail.completedAt && <div><dt className="text-xs text-muted-foreground">Completed</dt><dd className="mt-1 font-semibold">{fmt(detail.completedAt)}</dd></div>}</dl>
            {detail.reminders?.length > 0 && <div className="mt-5"><h3 className="text-sm font-black">Reminders</h3><p className="mt-2 text-sm text-muted-foreground">{detail.reminders.map((reminder) => reminder.reminderType === 'AT_TIME' ? 'At scheduled time' : `${reminder.value} ${reminder.unit.toLowerCase()} before`).join(' · ')}</p></div>}
            {(detail.ongoingWorkId || detail.linkedTaskId) && <div className="mt-5 rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Execution</p><p className="mt-2 font-bold">{detail.ongoingWorkId ? `Ongoing Work · ${detail.ongoingWorkStatus === 'WORKING' ? 'Active' : detail.ongoingWorkStatus}` : `Linked Task · ${detail.linkedTaskStatus?.replaceAll('_',' ')}`}</p>{detail.startedAt && <p className="mt-1 text-xs text-muted-foreground">Started {fmt(detail.startedAt)}</p>}</div>}
            {detail.status === 'UPCOMING' && <div className="mt-6 grid gap-2">{detail.ongoingWorkId ? <button onClick={()=>navigate('/dashboard')} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Open Work</button> : <button onClick={() => act(() => startExecution(detail)).then(()=>setDetail(null))} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">{detail.linkedTaskId ? "Open Linked Task" : "Start Work"}</button>}<div className="grid grid-cols-2 gap-2">{!detail.ongoingWorkId && <button onClick={() => act(() => detail.isOccurrence ? api.snoozeOccurrence(detail.id,detail.occurrenceId,{value:20,unit:'MINUTES'}) : api.snoozeScheduledWork(detail.id,{value:20,unit:'MINUTES'})).then(()=>setDetail(null))} className="rounded-xl border border-border px-3 py-2.5 text-sm font-bold">Remind 20m</button>}<button onClick={() => { requestComplete(detail); setDetail(null); }} className="rounded-xl border border-border px-3 py-2.5 text-sm font-bold">Complete</button></div>{detail.linkedTaskId && <button onClick={()=>navigate(`/tasks?task=${detail.linkedTaskId}`)} className="rounded-xl px-3 py-2 text-sm font-semibold text-primary-text">{detail.linkedTaskTitle} · {detail.linkedTaskStatus?.replaceAll('_',' ')}</button>}<button onClick={() => { setForm({mode:detail.isOccurrence?'occurrenceReschedule':'reschedule',item:detail}); setDetail(null); }} className="rounded-xl px-3 py-2 text-sm font-semibold text-primary-text">{detail.isOccurrence ? "Reschedule This Occurrence" : "Reschedule"}</button></div>}
          </section>
        </div>
      )}
      {completeTarget && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-overlay/60 p-4">
          <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-black">Active Ongoing Work Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">“{completeTarget.title}” currently has linked Ongoing Work. Choose what should be completed.</p>
            <div className="mt-5 grid gap-2"><button onClick={() => act(() => completeTarget.isOccurrence ? api.completeOccurrence(completeTarget.id, completeTarget.occurrenceId, { executionHandling: "COMPLETE_BOTH" }) : api.completeScheduledWork(completeTarget.id, { executionHandling: "COMPLETE_BOTH" })).then(() => setCompleteTarget(null))} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Complete Both</button><button onClick={() => act(() => completeTarget.isOccurrence ? api.completeOccurrence(completeTarget.id, completeTarget.occurrenceId, { executionHandling: "SCHEDULE_ONLY" }) : api.completeScheduledWork(completeTarget.id, { executionHandling: "SCHEDULE_ONLY" })).then(() => setCompleteTarget(null))} className="rounded-xl border border-border px-4 py-3 text-sm font-bold">Complete Schedule Only</button><button onClick={() => setCompleteTarget(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground">Cancel</button></div>
          </section>
        </div>
      )}
    </>
  );
}
