import { useState } from "react";
import { LogOut, Menu, CalendarDays, RefreshCw, Settings, UserRound, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { initials } from "../utils/helpers";
import NotificationBell from "../components/notifications/NotificationBell";
export default function Header({ onMenu, onRefresh }) {
  const { user, logout } = useAuth(),
    [refreshing, setRefreshing] = useState(false),
    [accountOpen, setAccountOpen] = useState(false);
  const date = new Intl.DateTimeFormat("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-7">
      <button className="rounded-lg p-2 lg:hidden" onClick={onMenu}>
        <Menu />
      </button>
      <div className="hidden sm:block">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <p className="font-semibold">Remote Office Portal</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 border-r border-slate-200 pr-4 text-sm text-slate-500 md:flex">
          <CalendarDays size={16} />
          {date}
        </div>
        <button
          title="Refresh current screen"
          disabled={refreshing}
          onClick={refresh}
          className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
        <NotificationBell />
        <div className="relative">
          <button className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initials(user.name)}</div>
            <div className="hidden text-left sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.roles.join(", ")}</p></div>
          </button>
          {accountOpen && <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 text-sm shadow-xl">
            <Link to="/account-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"><UserRound size={16}/> Profile</Link>
            <Link to="/account-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"><Settings size={16}/> Account Settings</Link>
            <Link to="/account-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"><KeyRound size={16}/> Change Password</Link>
            <button onClick={logout} className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 pt-3 text-red-600 hover:bg-red-50"><LogOut size={16}/> Logout</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
