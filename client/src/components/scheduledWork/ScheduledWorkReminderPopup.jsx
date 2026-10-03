import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../services/scheduledWork.service";

const ACK = "rop_scheduled_popup_ack_";
const CLAIM = "rop_scheduled_popup_claim_";
const time = (value) =>
  new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function ScheduledWorkReminderPopup({
  notifications,
  markRead,
  reconcile,
}) {
  const navigate = useNavigate(),
    dialog = useRef(null),
    tabId = useRef(
      sessionStorage.getItem("rop_scheduled_popup_tab") || crypto.randomUUID(),
    ),
    [queue, setQueue] = useState([]),
    [index, setIndex] = useState(0),
    [snoozing, setSnoozing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [custom, setCustom] = useState({ value: 45, unit: "MINUTES" }),
    [tomorrowTime, setTomorrowTime] = useState("19:00");
  sessionStorage.setItem("rop_scheduled_popup_tab", tabId.current);
  const candidates = useMemo(
    () =>
      notifications.filter(
        (n) =>
          ["SCHEDULED_WORK", "SCHEDULED_WORK_OCCURRENCE"].includes(n.referenceType) &&
          n.referenceId &&
          n.type.startsWith("SCHEDULED_WORK_") &&
          !localStorage.getItem(`${ACK}${n.id}`),
      ),
    [notifications],
  );
  useEffect(() => {
    let active = true;
    const claimed = [];
    for (const n of candidates) {
      const key = `${CLAIM}${n.id}`,
        existing = localStorage.getItem(key) || "",
        [owner, stamp] = existing.split(":");
      if (
        existing &&
        owner !== tabId.current &&
        Date.now() - Number(stamp) < 300000
      )
        continue;
      localStorage.setItem(key, `${tabId.current}:${Date.now()}`);
      if (localStorage.getItem(key)?.startsWith(`${tabId.current}:`))
        claimed.push(n);
    }
    Promise.all(
      claimed.map(async (n) => {
        try {
          const recurring = n.referenceType === "SCHEDULED_WORK_OCCURRENCE";
          const parentId = recurring
            ? new URL(n.actionUrl || "", window.location.origin).searchParams.get("work")
            : n.referenceId;
          return {
            notification: n,
            work: recurring
              ? await api.getOccurrence(parentId, n.referenceId)
              : await api.getScheduledWork(parentId),
          };
        } catch {
          return null;
        }
      }),
    ).then((rows) => {
      if (active) setQueue(rows.filter(Boolean));
    });
    return () => {
      active = false;
    };
  }, [candidates]);
  const current = queue[index];
  useEffect(() => {
    if (!current) return;
    const previous = document.activeElement;
    dialog.current?.focus();
    return () => previous?.focus?.();
  }, [current]);
  if (!current) return null;
  const acknowledge = async () => {
    localStorage.setItem(
      `${ACK}${current.notification.id}`,
      new Date().toISOString(),
    );
    localStorage.removeItem(`${CLAIM}${current.notification.id}`);
    await markRead(current.notification.id).catch(() => {});
    const next = queue.filter((_, i) => i !== index);
    setQueue(next);
    setIndex(Math.min(index, Math.max(0, next.length - 1)));
    setSnoozing(false);
    setError("");
  };
  const perform = async (fn, message) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      window.dispatchEvent(new CustomEvent("scheduled-work:changed"));
      await acknowledge();
      await reconcile();
      if (message)
        window.dispatchEvent(
          new CustomEvent("portal:feedback", { detail: { message } }),
        );
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update scheduled work.");
    } finally {
      setBusy(false);
    }
  };
  const snooze = (data) =>
    perform(
      () => current.work.isOccurrence
        ? api.snoozeOccurrence(current.work.id, current.work.occurrenceId, data)
        : api.snoozeScheduledWork(current.work.id, data),
      "Reminder scheduled.",
    );
  const overdue = new Date(current.work.scheduledAt) < new Date(),
    due = current.notification.type === "SCHEDULED_WORK_DUE" || overdue;
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-overlay/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) acknowledge();
      }}
    >
      <section
        ref={dialog}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduled-reminder-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") acknowledge();
        }}
        className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">
              Scheduled Work
            </p>
            <h2
              id="scheduled-reminder-title"
              className="mt-2 text-xl font-black"
            >
              {current.work.title}
            </h2>
          </div>
          <button
            aria-label="Dismiss reminder popup"
            onClick={acknowledge}
            className="rounded-lg px-2 py-1 text-muted-foreground"
          >
            ✕
          </button>
        </div>
        <div
          className={`mt-5 rounded-2xl p-4 text-center ${due ? "bg-danger-soft" : "bg-primary-soft"}`}
        >
          <p
            className={`text-sm font-black ${due ? "text-danger" : "text-primary-text"}`}
          >
            {overdue ? "OVERDUE" : due ? "DUE NOW" : "UPCOMING"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled {time(current.work.scheduledAt)}
          </p>
          {current.work.activeSnooze && (
            <p className="mt-2 text-xs font-semibold">
              Reminding again {time(current.work.activeSnooze.snoozedUntil)}
            </p>
          )}
        </div>
        {queue.length > 1 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {index + 1} of {queue.length} items requiring attention
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        {!snoozing ? (
          <div className="mt-5 grid gap-2">
            <button
              disabled={busy}
              onClick={() =>
                perform(
                  () => current.work.isOccurrence
                    ? api.startOccurrence(current.work.id, current.work.occurrenceId)
                    : api.startScheduledWork(current.work.id),
                  "Work started.",
                ).then(() =>
                  navigate(`/scheduled-work?work=${current.work.id}`),
                )
              }
              className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              Do Now
            </button>
            <button
              disabled={busy}
              onClick={() => setSnoozing(true)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              Remind Me Later
            </button>
            {due && (
              <button
                disabled={busy}
                onClick={() =>
                  perform(
                    () => current.work.isOccurrence
                      ? api.completeOccurrence(current.work.id, current.work.occurrenceId)
                      : api.completeScheduledWork(current.work.id),
                    "Scheduled work marked complete.",
                  )
                }
                className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-bold text-success disabled:opacity-50"
              >
                Mark Complete
              </button>
            )}
            {!due && (
              <button
                onClick={() => {
                  acknowledge();
                  navigate(`/scheduled-work?work=${current.work.id}`);
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-text"
              >
                View Scheduled Work
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-sm font-bold">Remind me again in:</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                [10, "MINUTES", "10 Minutes"],
                [20, "MINUTES", "20 Minutes"],
                [30, "MINUTES", "30 Minutes"],
                [1, "HOURS", "1 Hour"],
                [2, "HOURS", "2 Hours"],
              ].map(([value, unit, label]) => (
                <button
                  disabled={busy}
                  key={label}
                  onClick={() => snooze({ value, unit })}
                  className="rounded-xl border border-border p-3 text-sm font-semibold disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
              <button
                disabled={busy}
                onClick={() => snooze({ unit: "TOMORROW", time: tomorrowTime })}
                className="rounded-xl border border-border p-3 text-sm font-semibold disabled:opacity-50"
              >
                Tomorrow
              </button>
            </div>
            <label className="mt-3 block text-xs font-semibold">
              Tomorrow at
            </label>
            <input
              type="time"
              value={tomorrowTime}
              onChange={(e) => setTomorrowTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
            />
            <div className="mt-3 flex gap-2">
              <input
                aria-label="Custom snooze value"
                type="number"
                min="1"
                value={custom.value}
                onChange={(e) =>
                  setCustom((x) => ({ ...x, value: e.target.value }))
                }
                className="w-24 rounded-xl border border-border bg-background px-3 py-2"
              />
              <select
                value={custom.unit}
                onChange={(e) =>
                  setCustom((x) => ({ ...x, unit: e.target.value }))
                }
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2"
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
              </select>
              <button
                disabled={busy}
                onClick={() =>
                  snooze({ value: Number(custom.value), unit: custom.unit })
                }
                className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Custom
              </button>
            </div>
            <button
              onClick={() => setSnoozing(false)}
              className="mt-3 w-full py-2 text-sm font-semibold text-muted-foreground"
            >
              Back
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
