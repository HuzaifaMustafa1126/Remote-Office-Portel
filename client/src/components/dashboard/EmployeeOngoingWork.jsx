import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Plus, Trash2 } from "lucide-react";
import * as api from "../../services/ongoingWork.service";
import { errorMessage } from "../../utils/helpers";
import {
  publishPortalStateChanged,
  subscribePortalStateChanged,
} from "../../utils/portalSync";
export default function EmployeeOngoingWork() {
  const [rows, setRows] = useState([]),
    [form, setForm] = useState({ title: "", description: "" }),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      api
        .getMine()
        .then(setRows)
        .catch((e) => setError(errorMessage(e))),
    [],
  );
  useEffect(() => {
    load();
    return subscribePortalStateChanged(
      (e) => e?.type === "ONGOING_WORK_CHANGED" && load(),
    );
  }, [load]);
  const current = rows.find((x) => x.status !== "COMPLETED");
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      editing !== "new"
        ? await api.update(editing, form)
        : await api.create(form);
      setForm({ title: "", description: "" });
      setEditing(null);
      await load();
      publishPortalStateChanged("ONGOING_WORK_CHANGED", {
        includeCurrent: true,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      publishPortalStateChanged("ONGOING_WORK_CHANGED", {
        includeCurrent: true,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Ongoing Work</h2>
          <p className="text-xs text-muted-foreground">
            A short personal update about your current work.
          </p>
        </div>
        {!current && !editing && (
          <button
            onClick={() => setEditing("new")}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Plus size={14} className="inline" /> Add
          </button>
        )}
      </div>
      {(editing || !current) && editing && (
        <form onSubmit={save} className="mt-4 grid gap-3">
          <input
            required
            maxLength="200"
            className="input mt-0"
            placeholder="What are you working on?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            maxLength="1000"
            rows="2"
            className="input mt-0"
            placeholder="Optional description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ title: "", description: "" });
              }}
              className="rounded-lg border px-3 py-2 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {current && !editing && (
        <div className="mt-4 rounded-xl bg-surface-secondary p-4">
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-semibold">{current.title}</p>
              {current.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {current.description}
                </p>
              )}
              <p className="mt-2 text-[10px] font-bold text-primary-text">
                {current.status}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                title={current.status === "ONGOING" ? "Pause" : "Resume"}
                disabled={busy}
                onClick={() =>
                  act(() =>
                    api.setStatus(
                      current.id,
                      current.status === "ONGOING" ? "PAUSED" : "ONGOING",
                    ),
                  )
                }
              >
                {current.status === "ONGOING" ? (
                  <Pause size={17} />
                ) : (
                  <Play size={17} />
                )}
              </button>
              <button
                title="Edit"
                disabled={busy}
                onClick={() => {
                  setEditing(current.id);
                  setForm({
                    title: current.title,
                    description: current.description || "",
                  });
                }}
              >
                Edit
              </button>
              <button
                title="Delete"
                disabled={busy}
                onClick={() => act(() => api.remove(current.id))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
          <button
            disabled={busy}
            onClick={() => act(() => api.setStatus(current.id, "COMPLETED"))}
            className="mt-3 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs font-bold text-success"
          >
            Mark Completed
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
    </section>
  );
}
