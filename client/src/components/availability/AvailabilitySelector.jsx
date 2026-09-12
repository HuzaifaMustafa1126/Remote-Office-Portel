import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import * as availability from "../../services/availability.service";
import { errorMessage } from "../../utils/helpers";
import {
  publishPortalStateChanged,
  subscribePortalStateChanged,
} from "../../utils/portalSync";
import AvailabilityBadge from "./AvailabilityBadge";

const choices = [
  ["AWAY", "Away", ["Until I turn it off", 0]],
  [
    "DO_NOT_DISTURB",
    "Do Not Disturb",
    ["30 minutes", 30],
    ["1 hour", 60],
    ["2 hours", 120],
    ["Until I turn it off", 0],
  ],
  [
    "IN_MEETING",
    "In a Meeting",
    ["15 minutes", 15],
    ["30 minutes", 30],
    ["45 minutes", 45],
    ["1 hour", 60],
    ["Custom end time", "custom"],
    ["Until I turn it off", 0],
  ],
];

export default function AvailabilitySelector({ onDone }) {
  const [mine, setMine] = useState(null),
    [selected, setSelected] = useState(null),
    [duration, setDuration] = useState(0),
    [custom, setCustom] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      availability
        .getMine()
        .then(setMine)
        .catch((e) => setError(errorMessage(e))),
    [],
  );
  useEffect(() => {
    load();
    return subscribePortalStateChanged(
      (event) => event?.type === "AVAILABILITY_CHANGED" && load(),
    );
  }, [load]);
  const choose = (entry) => {
    setSelected(entry);
    setDuration(entry[2][1]);
    setNote(mine?.statusNote || "");
    setError("");
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      let until;
      if (duration === "custom") {
        if (!custom) throw new Error("Choose a meeting end time");
        until = new Date(custom).toISOString();
      } else if (Number(duration) > 0)
        until = new Date(Date.now() + Number(duration) * 60_000).toISOString();
      const response = await availability.setMine({
        status: selected[0],
        until,
        note: note.trim() || undefined,
      });
      setMine(response.data);
      setSelected(null);
      publishPortalStateChanged("AVAILABILITY_CHANGED", {
        includeCurrent: true,
      });
      onDone?.();
    } catch (e) {
      setError(
        errorMessage(e) === "Something went wrong"
          ? e.message
          : errorMessage(e),
      );
    } finally {
      setBusy(false);
    }
  };
  const clear = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await availability.clearMine();
      setMine(response.data);
      publishPortalStateChanged("AVAILABILITY_CHANGED", {
        includeCurrent: true,
      });
      onDone?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (selected)
    return (
      <div className="space-y-3 p-2">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"
        >
          <ChevronLeft size={14} /> Availability
        </button>
        <p className="font-semibold">{selected[1]}</p>
        <select
          aria-label="Status duration"
          value={duration}
          onChange={(e) =>
            setDuration(
              e.target.value === "custom" ? "custom" : Number(e.target.value),
            )
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {selected.slice(2).map(([label, value]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
        {duration === "custom" && (
          <input
            aria-label="Meeting end time"
            type="datetime-local"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        )}
        <input
          aria-label="Optional status note"
          maxLength={80}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (80 characters)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          onClick={save}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Set availability"}
        </button>
      </div>
    );
  return (
    <div className="p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Set availability
        </span>
        {mine && <AvailabilityBadge status={mine.availability} />}
      </div>
      <button
        disabled={busy}
        onClick={clear}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-surface-secondary"
      >
        <Check size={16} /> Available
      </button>
      {choices.map((entry) => (
        <button
          key={entry[0]}
          onClick={() => choose(entry)}
          className="flex w-full items-center rounded-lg px-3 py-2 text-left hover:bg-surface-secondary"
        >
          {entry[1]}
        </button>
      ))}
      {error && (
        <p role="alert" className="px-3 py-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
