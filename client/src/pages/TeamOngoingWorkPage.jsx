import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, MoreVertical, PauseCircle, Search, Settings2, Trash2, Users } from "lucide-react";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import * as api from "../services/ongoingWork.service";
import { errorMessage } from "../utils/helpers";
import { publishPortalStateChanged, subscribePortalStateChanged } from "../utils/portalSync";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../utils/permissions";

const formatDuration = (value) => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};
const dateTime = (value) => value
  ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";
const withClock = (items) => {
  const receivedAt = performance.now();
  return items.map((item) => ({ ...item, receivedAt }));
};

export default function TeamOngoingWorkPage() {
  const canManageRetention = usePermission(PERMISSIONS.ONGOING_WORK_RETENTION_MANAGE);
  const [view, setView] = useState("active");
  const [active, setActive] = useState({ summary: null, items: [] });
  const [completed, setCompleted] = useState({ summary: null, items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [date, setDate] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(() => performance.now());
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [retention, setRetention] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (view === "active") {
        const data = await api.getTeamActive({ search, status });
        setActive({ ...data, items: withClock(data.items) });
      } else {
        if (date === "CUSTOM" && (!from || !to || from > to)) return;
        const data = await api.getTeamCompleted({ page, limit: 20, search, date, ...(date === "CUSTOM" ? { from, to } : {}) });
        setCompleted(data);
      }
      setTick(performance.now());
    } catch (requestError) {
      setError(errorMessage(requestError) || `Unable to load ${view === "active" ? "team ongoing work" : "completed work history"}.`);
    } finally {
      setLoading(false);
    }
  }, [date, from, page, search, status, to, view]);

  useEffect(() => {
    const timeout = window.setTimeout(load, 250);
    return () => window.clearTimeout(timeout);
  }, [load]);
  useEffect(() => {
    const reconcile = () => load();
    const unsubscribe = subscribePortalStateChanged((event) => event?.type === "ONGOING_WORK_CHANGED" && reconcile());
    const focus = () => reconcile();
    const visible = () => document.visibilityState === "visible" && reconcile();
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [load]);
  useEffect(() => {
    if (!active.items.some((item) => item.status === "WORKING")) return undefined;
    const interval = window.setInterval(() => setTick(performance.now()), 1000);
    return () => window.clearInterval(interval);
  }, [active.items]);
  useEffect(() => {
    if (!canManageRetention) return;
    api.getRetentionSettings().then(setRetention).catch(() => {});
  }, [canManageRetention]);

  const summary = (view === "active" ? active.summary : completed.summary) || active.summary || completed.summary;
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of active.items) {
      if (!map.has(item.employeeId)) map.set(item.employeeId, { employeeId: item.employeeId, employeeName: item.employeeName, items: [] });
      map.get(item.employeeId).items.push(item);
    }
    return [...map.values()];
  }, [active.items]);
  const displayTotal = (item) => formatDuration(Number(item.totalTimeSpent || 0) + (item.status === "WORKING" ? Math.floor((tick - item.receivedAt) / 1000) : 0));
  const displayCurrent = (item) => formatDuration(Number(item.currentSessionSeconds || 0) + (item.status === "WORKING" ? Math.floor((tick - item.receivedAt) / 1000) : 0));
  const openDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const data = await api.getTeamDetails(id);
      setDetails({ ...data, work: { ...data.work, receivedAt: performance.now() } });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDetailsLoading(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await api.removeCompletedByAdmin(deleteTarget.id);
      setDeleteTarget(null);
      publishPortalStateChanged("ONGOING_WORK_CHANGED", { includeCurrent: true });
    } catch (requestError) {
      setError(errorMessage(requestError) || "Unable to delete completed work.");
    } finally {
      setDeleting(false);
    }
  };
  const saveRetention = async () => {
    if (!retention || savingSettings) return;
    setSavingSettings(true);
    setError("");
    try {
      setRetention(await api.saveRetentionSettings({
        autoCleanupEnabled: retention.autoCleanupEnabled,
        retentionDays: Number(retention.retentionDays),
      }));
      setSettingsOpen(false);
    } catch (requestError) {
      setError(errorMessage(requestError) || "Unable to save retention settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <main className="min-w-0">
      <PageHeader title="Team Ongoing Work" description="Live, read-only visibility into employee-created ongoing work." />
      {summary && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[Users, "Employees Working Now", summary.employeesWorkingNow], [PauseCircle, "Paused Work", summary.pausedWork], [CheckCircle2, "Completed Today", summary.completedToday], [Clock3, "Total Active Work Items", summary.totalActiveWorkItems]].map(([Icon, label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><Icon size={18} className="text-primary-text" /><p className="mt-3 text-2xl font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></article>
        ))}
      </div>}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-xl bg-surface-secondary p-1">
            <button onClick={() => { setView("active"); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === "active" ? "bg-surface text-primary-text shadow-sm" : "text-muted-foreground"}`}>Active / Ongoing</button>
            <button onClick={() => { setView("completed"); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === "completed" ? "bg-surface text-primary-text shadow-sm" : "text-muted-foreground"}`}>Completed</button>
          </div>
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-border px-3"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search employee or work title" className="h-10 w-full bg-transparent text-sm outline-none" /></label>
          {view === "completed" && canManageRetention && <button type="button" onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold"><Settings2 size={15} /> Cleanup settings</button>}
          {view === "active" ? <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-border bg-surface px-3 text-sm"><option value="ALL">All statuses</option><option value="WORKING">Working</option><option value="PAUSED">Paused</option></select> : <><select value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} className="rounded-xl border border-border bg-surface px-3 text-sm"><option value="ALL">All dates</option><option value="TODAY">Today</option><option value="YESTERDAY">Yesterday</option><option value="LAST_7_DAYS">Last 7 days</option><option value="CUSTOM">Custom range</option></select>{date === "CUSTOM" && <><input aria-label="Completed from date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="rounded-xl border border-border bg-surface px-3 text-sm" /><input aria-label="Completed to date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="rounded-xl border border-border bg-surface px-3 text-sm" /></>}</>}
        </div>
      </section>
      {error && <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {loading && !summary ? <Loader /> : view === "active" ? (
        groups.length ? <div className="mt-5 grid gap-4 xl:grid-cols-2">{groups.map((group) => (
          <section key={group.employeeId} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="font-bold">{group.employeeName}</h2><p className="text-xs text-muted-foreground">{group.items.length} ongoing item{group.items.length === 1 ? "" : "s"} · {group.items.filter((item) => item.status === "WORKING").length} working · {group.items.filter((item) => item.status !== "WORKING").length} paused</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">{group.employeeName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span></div>
            <div className="mt-3 divide-y divide-border">{group.items.map((item) => (
              <article key={item.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p>{item.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>}</div><span className={`flex shrink-0 items-center gap-1 text-[10px] font-bold ${item.status === "WORKING" ? "text-success" : "text-muted-foreground"}`}>{item.status === "WORKING" && <i className="h-1.5 w-1.5 rounded-full bg-success" />}{item.status === "WORKING" ? "WORKING NOW" : "PAUSED"}</span></div><div className="mt-2 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.status === "WORKING" ? "Total Work Time" : "Total Tracked"}</p><p className="font-mono text-lg font-bold tabular-nums">{displayTotal(item)}</p>{item.status === "WORKING" ? <p className="text-[11px] text-muted-foreground">Current session {displayCurrent(item)} · started {dateTime(item.activeSessionStartedAt)}</p> : <p className="text-[11px] text-muted-foreground">Last worked {dateTime(item.lastActivityAt || item.updatedAt)}</p>}</div><button onClick={() => openDetails(item.id)} className="text-xs font-semibold text-primary-text">View Details</button></div></article>
            ))}</div>
          </section>
        ))}</div> : <Empty text={status === "WORKING" ? "No employees are currently tracking ongoing work." : "No active ongoing work found."} />
      ) : completed.items.length ? <><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{completed.items.map((item) => (
        <article key={item.id} className="flex min-h-56 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{item.employeeName}</p><h2 className="mt-1 font-bold">{item.title}</h2></div><div className="flex items-start gap-1"><span className="flex h-fit items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold text-success"><CheckCircle2 size={11} /> COMPLETED</span>{canManageRetention && <details className="relative"><summary aria-label={`Actions for ${item.title}`} className="list-none cursor-pointer rounded-lg p-1 hover:bg-hover"><MoreVertical size={17} /></summary><div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-border bg-surface p-1 shadow-xl"><button onClick={() => openDetails(item.id)} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-hover">View Details</button><button onClick={() => setDeleteTarget(item)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-danger hover:bg-danger-soft"><Trash2 size={13} /> Delete</button></div></details>}</div></div>{item.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}<div className="mt-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Tracked</p><p className="font-mono text-lg font-bold">{formatDuration(item.totalTimeSpent)}</p></div><div className="mt-3 rounded-xl bg-surface-secondary p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completion Note</p><p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs">{item.completionNote || "No completion note recorded."}</p></div><div className="mt-auto flex items-end justify-between gap-3 pt-3"><p className="text-[11px] text-muted-foreground">{dateTime(item.completedAt)}</p><button onClick={() => openDetails(item.id)} className="text-xs font-semibold text-primary-text">View Details</button></div></article>
      ))}</div><div className="mt-5 flex items-center justify-center gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-xs text-muted-foreground">Page {completed.pagination.page} of {completed.pagination.totalPages}</span><Button variant="secondary" disabled={page >= completed.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></> : <Empty text="No completed work found for the selected filters." />}
      {detailsLoading && <p className="mt-4 text-center text-sm text-muted-foreground">Loading details…</p>}
      <Modal open={Boolean(details)} title="Ongoing Work Details" onClose={() => setDetails(null)}>{details && <Details data={details} tick={tick} />}</Modal>
      <Modal open={Boolean(deleteTarget)} title="Delete completed work?" onClose={() => !deleting && setDeleteTarget(null)}>{deleteTarget && <div><p className="font-semibold">“{deleteTarget.title}”</p><p className="mt-2 text-sm text-muted-foreground">This will remove this completed Ongoing Work from the system.</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" disabled={deleting} onClick={confirmDelete}>{deleting ? "Deleting…" : "Delete"}</Button></div></div>}</Modal>
      <Modal open={settingsOpen} title="Completed Ongoing Work Cleanup" onClose={() => !savingSettings && setSettingsOpen(false)}>{retention ? <div className="space-y-5"><label className="flex items-center justify-between gap-4"><span><b className="block text-sm">Auto-delete completed work</b><small className="text-muted-foreground">Handled by the server-side cleanup command.</small></span><input type="checkbox" checked={retention.autoCleanupEnabled} onChange={(event) => setRetention((value) => ({ ...value, autoCleanupEnabled: event.target.checked }))} className="h-5 w-5" /></label><label className="block text-sm font-semibold">Delete after<select value={retention.retentionDays} onChange={(event) => setRetention((value) => ({ ...value, retentionDays: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5">{[7, 14, 30, 60, 90].map((days) => <option key={days} value={days}>{days} days after completion</option>)}</select></label><p className="rounded-xl bg-surface-secondary p-3 text-xs text-muted-foreground">Next cleanup: handled automatically by the configured hosting scheduler. Eligibility is calculated from the completion date.</p><div className="flex justify-end gap-2"><Button variant="secondary" disabled={savingSettings} onClick={() => setSettingsOpen(false)}>Cancel</Button><Button disabled={savingSettings} onClick={saveRetention}>{savingSettings ? "Saving…" : "Save settings"}</Button></div></div> : <Loader />}</Modal>
    </main>
  );
}

function Empty({ text }) { return <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">{text}</div>; }
function Details({ data, tick }) {
  const { work, sessions } = data;
  const extra = work.status === "WORKING" ? Math.floor((tick - (work.receivedAt || tick)) / 1000) : 0;
  return <div className="grid gap-5 text-sm"><div className="grid gap-3 sm:grid-cols-2"><Field label="Employee" value={work.employeeName} /><Field label="Status" value={work.status === "WORKING" ? "● WORKING" : work.status} /><Field label="Work" value={work.title} /><Field label="Description" value={work.description || "No description provided."} /><Field label="Current Session" value={work.status === "WORKING" ? formatDuration(Number(work.currentSessionSeconds || 0) + extra) : "—"} /><Field label="Total Tracked" value={formatDuration(Number(work.totalTimeSpent || 0) + extra)} /><Field label="Created" value={dateTime(work.createdAt)} /><Field label="First Started" value={dateTime(work.firstStartedAt)} /><Field label="Last Activity" value={dateTime(work.lastActivityAt || work.updatedAt)} /><Field label="Completed" value={dateTime(work.completedAt)} /></div>{work.status === "COMPLETED" && <div className="rounded-xl bg-surface-secondary p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completion Note</p><p className="mt-2 whitespace-pre-wrap">{work.completionNote || "No completion note recorded."}</p></div>}<div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Sessions</p>{sessions.length ? <div className="divide-y divide-border rounded-xl border border-border">{sessions.map((session, index) => <div key={`${session.startedAt}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs"><span>{dateTime(session.startedAt)} → {session.endedAt ? dateTime(session.endedAt) : "Working Now"}</span><strong className="font-mono">{formatDuration(session.durationSeconds)}</strong></div>)}</div> : <p className="text-xs text-muted-foreground">No timer sessions recorded.</p>}</div></div>;
}
function Field({ label, value }) { return <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-wrap font-medium">{value}</p></div>; }
