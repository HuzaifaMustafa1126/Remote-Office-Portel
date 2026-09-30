import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  todayScheduledWork,
  completeScheduledWork,
} from "../../services/scheduledWork.service";
export default function TodayScheduledWork() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true);
  const load = () =>
    todayScheduledWork({ limit: 5 })
      .then((x) => setItems(x.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  useEffect(load, []);
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
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((x) => (
            <div
              key={x.id}
              className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3"
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
              </div>
              <button
                onClick={() => completeScheduledWork(x.id).then(load)}
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
