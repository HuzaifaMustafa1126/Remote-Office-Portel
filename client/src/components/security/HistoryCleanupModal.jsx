import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../common/Modal";
import { errorMessage } from "../../utils/helpers";

const options = [
  ["30_DAYS", "Older than 30 days"],
  ["90_DAYS", "Older than 90 days"],
  ["6_MONTHS", "Older than 6 months"],
  ["1_YEAR", "Older than 1 year"],
  ["CUSTOM", "Custom date"],
  ["ALL", "All historical records"],
];

export default function HistoryCleanupModal({
  kind,
  preview,
  remove,
  onClose,
  onDone,
}) {
  const loginSecurity = kind === "LOGIN_SECURITY";
  const [mode, setMode] = useState(loginSecurity ? "ALL" : "90_DAYS");
  const [beforeDate, setBeforeDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [stage, setStage] = useState("SELECT");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const expected = mode === "ALL" ? "DELETE ALL" : "DELETE";
  const request = {
    mode,
    ...(mode === "CUSTOM" ? { beforeDate } : {}),
  };

  useEffect(() => {
    if (mode === "CUSTOM" && !beforeDate) {
      setSummary(null);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      preview(request)
        .then((data) => {
          if (current) {
            setSummary(data);
            setError("");
          }
        })
        .catch((reason) => current && setError(errorMessage(reason)));
    }, 200);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [mode, beforeDate]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await remove({ ...request, confirmation });
      onDone(result);
    } catch (reason) {
      setError(errorMessage(reason) || "No records were deleted. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={
        stage === "SELECT"
          ? `Clean ${loginSecurity ? "Login Security" : "Audit Log"} History`
          : `Permanently Delete ${summary?.recordsToDelete || 0} ${loginSecurity ? "Records" : "Events"}?`
      }
      onClose={busy ? () => {} : onClose}
    >
      {stage === "SELECT" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Permanently remove old {loginSecurity ? "login security records" : "audit events"}.
          </p>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold">Delete records</legend>
            {options.map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <input type="radio" checked={mode === value} onChange={() => setMode(value)} />
                {loginSecurity && value === "ALL" ? "All expired history" : label}
              </label>
            ))}
          </fieldset>
          {mode === "CUSTOM" && (
            <label className="block text-sm font-semibold">
              Delete everything before
              <input type="date" value={beforeDate} onChange={(event) => setBeforeDate(event.target.value)} className="mt-2 w-full rounded-xl border border-border p-3" />
            </label>
          )}
          <div className="rounded-xl bg-surface-secondary p-4 text-sm">
            <div className="flex justify-between"><span>Records to delete</span><b>{summary?.recordsToDelete ?? "…"}</b></div>
            <div className="mt-2 flex justify-between"><span>Records to keep</span><b>{summary?.recordsToKeep ?? "…"}</b></div>
            {loginSecurity && <div className="mt-2 flex justify-between text-success"><span>Active sessions protected</span><b>{summary?.activeSessionsProtected ?? "…"}</b></div>}
          </div>
          <p className="flex gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning"><AlertTriangle className="shrink-0" size={18} />This action permanently deletes security history and cannot be undone.{loginSecurity && " Active sessions will not be removed."}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-xl bg-surface-secondary px-4 py-2.5 font-bold">Cancel</button>
            <button disabled={!summary || (mode === "CUSTOM" && !beforeDate)} onClick={() => setStage("CONFIRM")} className="rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground disabled:opacity-40">Continue</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">This action cannot be undone. Type <b className="text-foreground">{expected}</b> to confirm.</p>
          <input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={expected} className="w-full rounded-xl border border-border p-3" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button disabled={busy} onClick={() => setStage("SELECT")} className="rounded-xl bg-surface-secondary px-4 py-2.5 font-bold">Back</button>
            <button disabled={busy || confirmation !== expected} onClick={submit} className="rounded-xl bg-danger px-4 py-2.5 font-bold text-white disabled:opacity-40">{busy ? "Deleting…" : "Permanently Delete"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
