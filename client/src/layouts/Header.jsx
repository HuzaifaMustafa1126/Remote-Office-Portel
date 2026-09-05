import { useEffect, useState } from "react";
import { Palette, LogOut, Menu, CalendarDays, RefreshCw, Settings, UserRound, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { initials } from "../utils/helpers";
import NotificationBell from "../components/notifications/NotificationBell";
export default function Header({ onMenu, onRefresh }) {
  const { user, logout } = useAuth(),
    [refreshing, setRefreshing] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const date = new Intl.DateTimeFormat("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);
  const liveTime = new Intl.DateTimeFormat("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-7">
      <button aria-label="Open navigation" className="rounded-lg p-2 lg:hidden" onClick={onMenu}>
        <Menu />
      </button>
      <div className="min-w-0 flex-1 px-2 sm:px-0">
        <p className="hidden sm:block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <p className="text-sm font-semibold sm:text-base">Remote Office Portal</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="hidden md:flex items-center gap-2 border-r border-border pr-3 text-sm text-muted-foreground">
          <CalendarDays size={16} className="hidden md:block" />
          <div>
            <p className="hidden text-xs md:block">{date}</p>
            <time dateTime={now.toISOString()} className="whitespace-nowrap font-semibold tabular-nums" aria-label={`Current device time: ${liveTime}`}>
              {liveTime}
            </time>
          </div>
        </div>
        <button
          title="Refresh current screen"
          disabled={refreshing}
          onClick={refresh}
          className="hidden sm:block rounded-lg p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary-text"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
        <NotificationBell />
        <div className="relative">
          <button aria-label="Open account menu" className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-surface-secondary" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-text">{initials(user.name)}</div>
            <div className="hidden text-left sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">{user.roles.join(", ")}</p></div>
          </button>
          {accountOpen && <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-2 text-sm shadow-xl">
            <button onClick={() => { refresh(); setAccountOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-secondary sm:hidden"><RefreshCw size={16}/> Refresh page</button>
            <Link to="/account-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-secondary"><UserRound size={16}/> Profile</Link>
            <Link to="/settings/appearance" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-secondary"><Palette size={16}/> Appearance</Link>
            <Link to="/account-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-secondary"><Settings size={16}/> Account Settings</Link>
            <Link to="/account-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-secondary"><KeyRound size={16}/> Change Password</Link>
            <button onClick={logout} className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2 pt-3 text-danger hover:bg-danger-soft"><LogOut size={16}/> Logout</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
