import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import NotificationItem from "../components/notifications/NotificationItem";
import useNotifications from "../hooks/useNotifications";
import * as service from "../services/notification.service";
const filters = [
  ["All", {}],
  ["Unread", { unread: "true" }],
  ["Tasks", { category: "TASK" }],
  ["Leave", { category: "LEAVE" }],
  ["Attendance", { category: "ATTENDANCE" }],
  ["Breaks", { category: "BREAK" }],
];
export default function NotificationsPage() {
  const [selected, setSelected] = useState("All"),
    [data, setData] = useState({ rows: [], pagination: {} }),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true);
  const { markRead, markAll } = useNotifications();
  const nav = useNavigate();
  const load = async (replace = false) => {
    setLoading(true);
    try {
      const params = filters.find(([x]) => x === selected)[1];
      const next = await service.list({ ...params, page, limit: 20 });
      setData((old) => ({
        ...next,
        rows: replace ? next.rows : [...old.rows, ...next.rows],
      }));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setPage(1);
  }, [selected]);
  useEffect(() => {
    load(page === 1);
  }, [selected, page]);
  const choose = async (item) => {
    if (!item.isRead) await markRead(item.id);
    if (item.actionUrl) nav(item.actionUrl);
  };
  const readAll = async () => {
    await markAll();
    setData((old) => ({
      ...old,
      rows: old.rows.map((x) => ({ ...x, isRead: 1 })),
    }));
  };
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your activity updates and alerts.
          </p>
        </div>
        <Button variant="secondary" onClick={readAll}>
          Mark all as read
        </Button>
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map(([name]) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${selected === name ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-muted-foreground"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {data.rows.map((x) => (
          <NotificationItem key={x.id} item={x} onClick={choose} />
        ))}
        {!loading && !data.rows.length && (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center text-muted-foreground">
            No notifications in this category.
          </div>
        )}
      </div>
      {loading && (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      )}
      {page < data.pagination.pages && !loading && (
        <div className="py-6 text-center">
          <Button variant="secondary" onClick={() => setPage((x) => x + 1)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
