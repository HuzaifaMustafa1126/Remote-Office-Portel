import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import * as api from "../../services/ongoingWork.service";
import { errorMessage } from "../../utils/helpers";
import { publishPortalStateChanged, subscribePortalStateChanged } from "../../utils/portalSync";

const emptyForm = { title: "", description: "" };
const dateTime = new Intl.DateTimeFormat("en-PK", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const formatDuration = (value) => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
};

export default function EmployeeOngoingWork({ attendanceStatus }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(() => performance.now());
  const [view, setView] = useState("ongoing");
  const [history, setHistory] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [completionTarget, setCompletionTarget] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [details, setDetails] = useState(null);
  const activeRows = useMemo(() => rows.filter((row) => row.status !== "COMPLETED"), [rows]);
  const attendanceActive = ["WORKING", "ON_BREAK"].includes(attendanceStatus);
  const load = useCallback(() => api.getMine().then((data) => {
    const receivedAt = performance.now();
    setTick(receivedAt);
    setRows(data.map((row) => ({ ...row, receivedAt })));
  }), []);
  const loadCompleted = useCallback((page = 1) => {
    setHistoryLoading(true);
    return api.getCompleted(page).then((data) => {
      setHistory(data);
      return data;
    }).finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    const reconcile = () => Promise.all([
      load(),
      view === "completed" ? loadCompleted(history.pagination.page) : Promise.resolve(),
    ]).catch((e) => setError(errorMessage(e)));
    reconcile();
    const unsubscribe = subscribePortalStateChanged((event) => event?.type === "ONGOING_WORK_CHANGED" && reconcile());
    const onFocus = () => reconcile();
    const onVisibility = () => document.visibilityState === "visible" && reconcile();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [history.pagination.page, load, loadCompleted, view]);

  useEffect(() => {
    if (!activeRows.some((row) => row.status === "WORKING")) return undefined;
    const interval = window.setInterval(() => setTick(performance.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeRows]);

  const closeModal = () => {
    if (busyId) return;
    setEditing(null);
    setForm(emptyForm);
  };
  const openCreate = () => {
    setError("");
    setForm(emptyForm);
    setEditing("new");
  };
  const openEdit = (row) => {
    setError("");
    setForm({ title: row.title, description: row.description || "" });
    setEditing(row.id);
  };
  const refreshAll = async () => {
    await load();
    publishPortalStateChanged("ONGOING_WORK_CHANGED", { includeCurrent: true });
  };
  const save = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return setError("Work title is required.");
    setBusyId(editing);
    setError("");
    try {
      const payload = { title, description: form.description.trim() };
      if (editing === "new") await api.create(payload);
      else await api.update(editing, payload);
      setEditing(null);
      setForm(emptyForm);
      await refreshAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };
  const remove = async (row) => {
    if (!window.confirm(`Delete “${row.title}”?`)) return;
    setBusyId(row.id);
    setError("");
    try {
      await api.remove(row.id);
      await refreshAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };
  const timerAction = async (row) => {
    if (row.status !== "WORKING" && !attendanceActive) {
      setError("Clock in before starting or resuming ongoing work.");
      return;
    }
    setBusyId(row.id);
    setError("");
    try {
      if (row.status === "WORKING") await api.pause(row.id);
      else await api.start(row.id);
      await refreshAll();
    } catch (e) {
      const message = errorMessage(e);
      await load()
        .then(() =>
          publishPortalStateChanged("ONGOING_WORK_CHANGED", {
            includeCurrent: true,
          }),
        )
        .catch(() => {});
      setError(message);
    } finally {
      setBusyId(null);
    }
  };
  const timerLabel = (row) => {
    const hasPreviousTime = Number(row.totalTimeSpent || 0) > 0;
    const switching = activeRows.some((item) => item.status === "WORKING" && item.id !== row.id);
    if (busyId === row.id) {
      if (row.status === "WORKING") return "Pausing…";
      if (switching) return "Switching…";
      return hasPreviousTime ? "Resuming…" : "Starting…";
    }
    if (row.status === "WORKING") return "Pause";
    return hasPreviousTime ? "Resume" : "Start Work";
  };
  const openCompletion = (row) => {
    setError("");
    setCompletionNote("");
    setCompletionTarget(row);
  };
  const completeWork = async (event) => {
    event.preventDefault();
    const note = completionNote.trim();
    if (!note) return setError("Please add a completion note.");
    setBusyId(completionTarget.id);
    setError("");
    try {
      await api.complete(completionTarget.id, note);
      setCompletionTarget(null);
      setCompletionNote("");
      await Promise.all([load(), loadCompleted(1)]);
      setView("completed");
      publishPortalStateChanged("ONGOING_WORK_CHANGED", { includeCurrent: true });
    } catch (e) {
      const message = errorMessage(e);
      const reconciled = await Promise.all([load(), loadCompleted(1)]).catch(() => null);
      if (reconciled?.[1]?.items.some((item) => item.id === completionTarget.id)) {
        setCompletionTarget(null);
        setCompletionNote("");
        setView("completed");
        setError("");
        return;
      }
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Ongoing Work</h2>
          <p className="text-xs text-muted-foreground">Keep a lightweight list of what you are working on now.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-1.5"><Plus size={16} /> Add Ongoing Work</Button>
      </div>

      <div className="mt-4 flex gap-1 rounded-xl bg-surface-secondary p-1">
        <button type="button" onClick={() => setView("ongoing")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${view === "ongoing" ? "bg-surface text-primary-text shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Ongoing ({activeRows.length})</button>
        <button type="button" onClick={() => setView("completed")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${view === "completed" ? "bg-surface text-primary-text shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Completed{history.pagination.total ? ` (${history.pagination.total})` : ""}</button>
      </div>

      {view === "ongoing" ? (activeRows.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeRows.map((row) => (
            <article key={row.id} className="flex min-h-40 flex-col rounded-xl border border-border bg-surface-secondary p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-sm font-semibold">{row.title}</h3>
                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${row.status === "PAUSED" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>
                  {row.status === "WORKING" && <i className="h-1.5 w-1.5 rounded-full bg-success" />}
                  {row.status === "WORKING" ? "WORKING NOW" : row.status}
                </span>
              </div>
              {row.description && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{row.description}</p>}
              <div className="mt-auto pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time Spent</p>
                <p className="mt-0.5 font-mono text-xl font-bold tabular-nums">
                  {formatDuration(Number(row.totalTimeSpent || 0) + (row.status === "WORKING" ? Math.floor((tick - row.receivedAt) / 1000) : 0))}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Created: {dateTime.format(new Date(row.createdAt))}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <button type="button" title={row.status !== "WORKING" && !attendanceActive ? "Clock in to start work" : undefined} disabled={Boolean(busyId) || (row.status !== "WORKING" && !attendanceActive)} onClick={() => timerAction(row)} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold disabled:opacity-50 ${row.status === "WORKING" ? "bg-warning-soft text-warning" : "bg-primary text-primary-foreground"}`}>
                  {row.status === "WORKING" ? <Pause size={13} /> : <Play size={13} />}
                  {row.status !== "WORKING" && !attendanceActive ? "Clock in to start" : timerLabel(row)}
                </button>
                <button type="button" disabled={Boolean(busyId)} onClick={() => openEdit(row)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-hover disabled:opacity-50"><Pencil size={13} /> Edit</button>
                <button type="button" disabled={Boolean(busyId)} onClick={() => remove(row)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-50"><Trash2 size={13} /> Delete</button>
                <button type="button" disabled={Boolean(busyId)} onClick={() => openCompletion(row)} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-success hover:bg-success-soft disabled:opacity-50"><CheckCircle2 size={13} /> Complete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-7 text-center">
          <p className="text-sm font-medium">No active ongoing work</p>
          <p className="mt-1 text-xs text-muted-foreground">Add an item when you start working on something.</p>
        </div>
      )) : historyLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading completed work…</p>
      ) : history.items.length ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {history.items.map((row) => (
              <article key={row.id} className="flex min-h-48 flex-col rounded-xl border border-border bg-surface-secondary p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words text-sm font-semibold">{row.title}</h3>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold text-success"><CheckCircle2 size={11} /> COMPLETED</span>
                </div>
                {row.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{row.description}</p>}
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Time</p>
                  <p className="font-mono text-lg font-bold tabular-nums">{formatDuration(row.totalTimeSpent)}</p>
                </div>
                <div className="mt-3 rounded-lg bg-surface px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completion Note</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs">{row.completionNote || "No completion note recorded."}</p>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <p className="text-[11px] text-muted-foreground">Completed: {dateTime.format(new Date(row.completedAt || row.updatedAt))}</p>
                  <button type="button" onClick={() => setDetails(row)} className="shrink-0 text-xs font-semibold text-primary-text">View Details</button>
                </div>
              </article>
            ))}
          </div>
          {history.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={history.pagination.page <= 1 || historyLoading} onClick={() => loadCompleted(history.pagination.page - 1)}>Previous</Button>
              <span className="text-xs text-muted-foreground">Page {history.pagination.page} of {history.pagination.totalPages}</span>
              <Button variant="secondary" disabled={history.pagination.page >= history.pagination.totalPages || historyLoading} onClick={() => loadCompleted(history.pagination.page + 1)}>Next</Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-7 text-center">
          <p className="text-sm font-medium">No completed work yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Completed items will appear here with their final notes and tracked time.</p>
        </div>
      )}
      {error && !editing && !completionTarget && <p className="mt-3 text-xs text-danger">{error}</p>}

      <Modal open={Boolean(editing)} title={editing === "new" ? "Add Ongoing Work" : "Edit Ongoing Work"} onClose={closeModal}>
        <form onSubmit={save} className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Work Title <span className="text-danger">*</span></span>
            <input autoFocus required maxLength="200" className="input mt-0" placeholder="e.g. Homepage UI Changes" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <textarea maxLength="1000" rows="4" className="input mt-0 resize-y" placeholder="Add an optional short description" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
          </label>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={Boolean(busyId)}>{editing === "new" ? "Add Work" : "Save Changes"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(completionTarget)} title="Complete Ongoing Work" onClose={() => !busyId && setCompletionTarget(null)}>
        <form onSubmit={completeWork} className="grid gap-4">
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="font-semibold">{completionTarget?.title}</p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time Tracked</p>
            <p className="mt-0.5 font-mono text-xl font-bold tabular-nums">
              {formatDuration(Number(completionTarget?.totalTimeSpent || 0) + (completionTarget?.status === "WORKING" ? Math.floor((tick - completionTarget.receivedAt) / 1000) : 0))}
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Completion Note <span className="text-danger">*</span></span>
            <textarea autoFocus required maxLength="1000" rows="5" className="input mt-0 resize-y" placeholder="Describe what you completed..." value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">This action will stop the timer if needed and move the item to Completed Work.</p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" disabled={Boolean(busyId)} onClick={() => setCompletionTarget(null)}>Cancel</Button>
            <Button type="submit" disabled={Boolean(busyId)} className="flex items-center gap-1.5"><CheckCircle2 size={15} />{busyId ? "Completing…" : "Complete Work"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(details)} title="Completed Work Details" onClose={() => setDetails(null)}>
        {details && (
          <div className="grid gap-4 text-sm">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Title</p><p className="mt-1 font-semibold">{details.title}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p><p className="mt-1 whitespace-pre-wrap">{details.description || "No description provided."}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</p><p className="mt-1">{dateTime.format(new Date(details.createdAt))}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</p><p className="mt-1">{dateTime.format(new Date(details.completedAt || details.updatedAt))}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Time</p><p className="mt-1 font-mono font-bold">{formatDuration(details.totalTimeSpent)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sessions</p><p className="mt-1">{details.sessionCount || 0}</p></div>
            </div>
            <div className="rounded-xl bg-surface-secondary p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completion Note</p><p className="mt-2 whitespace-pre-wrap">{details.completionNote || "No completion note recorded."}</p></div>
          </div>
        )}
      </Modal>
    </section>
  );
}
