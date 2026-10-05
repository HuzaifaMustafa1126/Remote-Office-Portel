import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { publishPortalStateChanged } from "../../utils/portalSync";
import {
  getOverview,
  completeScheduledWork,
  startWork,
  snoozeScheduledWork,
  completeOccurrence,
  startOccurrenceWork,
  snoozeOccurrence,
} from "../../services/scheduledWork.service";
export default function TodayScheduledWork() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]),
    [counts, setCounts] = useState({ dueNow: 0, today: 0, overdue: 0 }),
    [loading, setLoading] = useState(true);
  const load = () =>
    getOverview()
      .then((x) => {
        setCounts(x.counts);
        const combined = [...x.dueNow, ...x.today.filter((item) => !x.dueNow.some((due) => due.id === item.id && due.occurrenceId === item.occurrenceId)), ...x.overduePreview];
        setItems(combined.slice(0, 5));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  useEffect(load, []);
  const completeItem = (item) => {
    let data = {};
    if (item.ongoingWorkId) {
      if (window.confirm("Complete both the active Ongoing Work and this schedule?")) data = { executionHandling: "COMPLETE_BOTH" };
      else if (window.confirm("Complete the schedule only? Ongoing Work will remain open.")) data = { executionHandling: "SCHEDULE_ONLY" };
      else return;
    }
    (item.isOccurrence ? completeOccurrence(item.id, item.occurrenceId, data) : completeScheduledWork(item.id, data)).then(load);
  };
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Today’s Scheduled Work</h2>
        <Link
          to="/scheduled-work"
          className="text-xs font-bold text-primary-text"
        >
          View all
        </Link>
      </div>
      {!loading && <div className="mt-3 grid grid-cols-3 gap-2">{[["Due Now",counts.dueNow],["Today",counts.today],["Overdue",counts.overdue]].map(([label,value])=><div key={label} className="rounded-xl bg-surface-secondary p-2"><p className="text-lg font-black">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>)}</div>}
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((x) => (
            <div
              key={`${x.id}-${x.occurrenceId || "parent"}`}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-secondary p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{x.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(x.scheduledAt).toLocaleTimeString("en-PK", {
                    timeZone: "Asia/Karachi",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className={`text-[10px] font-bold ${x.displayStatus === "OVERDUE" ? "text-danger" : "text-muted-foreground"}`}>{x.displayStatus.replaceAll("_", " ")}</p>
                {x.activeSnooze && (
                  <p className="text-[11px] font-semibold text-primary-text">
                    Reminding again at{" "}
                    {new Date(x.activeSnooze.snoozedUntil).toLocaleTimeString(
                      "en-PK",
                      {
                        timeZone: "Asia/Karachi",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={() => (x.isOccurrence ? startOccurrenceWork(x.id, x.occurrenceId) : startWork(x.id)).then((result) => { publishPortalStateChanged("ONGOING_WORK_CHANGED", { includeCurrent: true }); return result.executionType === "TASK" ? navigate(`/tasks?task=${result.task.id}`) : navigate("/dashboard"); }).then(load)}
                className="text-xs font-bold text-primary-text"
              >
                {x.ongoingWorkId ? "Open Work" : x.linkedTaskId ? "Open Task" : "Start Work"}
              </button>
              <button
                onClick={() =>
                  (x.isOccurrence ? snoozeOccurrence(x.id, x.occurrenceId, {
                    value: 20,
                    unit: "MINUTES",
                  }) : snoozeScheduledWork(x.id, {
                    value: 20,
                    unit: "MINUTES",
                  })).then(load)
                }
                className="text-xs font-bold text-primary-text"
              >
                Snooze 20m
              </button>
              <button
                onClick={() => completeItem(x)}
                className="text-xs font-bold text-primary-text"
              >
                Complete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No scheduled work remaining today.
        </p>
      )}
    </section>
  );
}
