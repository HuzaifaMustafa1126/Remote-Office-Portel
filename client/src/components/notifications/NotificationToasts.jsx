import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
export default function NotificationToasts() {
  const { toasts, dismissToast, markRead } = useNotifications();
  const nav = useNavigate();
  const open = async (x) => {
    await markRead(x.id);
    dismissToast(x.id);
    if (x.actionUrl) nav(x.actionUrl);
  };
  return (
    <div className="pointer-events-none fixed inset-x-3 top-24 z-[70] flex flex-col items-center gap-3 sm:left-auto sm:right-5 sm:w-96 sm:items-stretch">
      {toasts.map((x) => (
        <div
          key={x.id}
          className="notification-toast pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        >
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-600">
              🔔
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{x.title}</p>
              <p className="mt-1 text-sm text-slate-600">{x.message}</p>
              {x.actionUrl && (
                <button
                  onClick={() => open(x)}
                  className="mt-2 text-sm font-semibold text-indigo-600"
                >
                  View details
                </button>
              )}
            </div>
            <button
              onClick={() => dismissToast(x.id)}
              className="self-start text-slate-400"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
