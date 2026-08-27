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
        className="relative rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[75vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-semibold">Notifications</h2>
              {!connected && (
                <p className="text-xs text-amber-600">● Reconnecting…</p>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                nav("/notification-settings");
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <Settings size={17} />
            </button>
          </div>
          <div className="max-h-[55vh] divide-y divide-slate-100 overflow-y-auto">
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
              <p className="p-8 text-center text-sm text-slate-500">
                No notifications yet.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <button
              onClick={markAll}
              disabled={!unread}
              className="font-medium text-indigo-600 disabled:text-slate-400"
            >
              Mark all as read
            </button>
            <button
              onClick={() => {
                setOpen(false);
                nav("/notifications");
              }}
              className="font-semibold text-slate-700"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
