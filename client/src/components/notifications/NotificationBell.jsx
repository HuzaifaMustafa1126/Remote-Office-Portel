import { useEffect, useRef, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
import NotificationItem from "./NotificationItem";
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const box = useRef();
  const nav = useNavigate();
  const { items, unread, markRead, markAll, connected } = useNotifications();
  useEffect(() => {
    const close = (e) => !box.current?.contains(e.target) && setOpen(false);
    addEventListener("mousedown", close);
    return () => removeEventListener("mousedown", close);
  }, []);
  const choose = async (item) => {
    if (!item.isRead) await markRead(item.id);
    setOpen(false);
    if (item.actionUrl) nav(item.actionUrl);
  };
  return (
    <div className="relative" ref={box}>
      <button
        title="Notifications"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary-text"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-5 text-danger-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[75vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-semibold">Notifications</h2>
              {!connected && (
                <p className="text-xs text-warning">● Reconnecting…</p>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                nav("/notification-settings");
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-surface-secondary"
            >
              <Settings size={17} />
            </button>
          </div>
          <div className="max-h-[55vh] divide-y divide-border overflow-y-auto">
            {items.length ? (
              items.map((x) => (
                <NotificationItem
                  compact
                  key={x.id}
                  item={x}
                  onClick={choose}
                />
              ))
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <button
              onClick={markAll}
              disabled={!unread}
              className="font-medium text-primary-text disabled:text-muted-foreground"
            >
              Mark all as read
            </button>
            <button
              onClick={() => {
                setOpen(false);
                nav("/notifications");
              }}
              className="font-semibold text-foreground"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
