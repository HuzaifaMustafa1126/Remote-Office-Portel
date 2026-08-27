import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  ScrollText,
  X,
  CalendarCheck,
  History,
  CalendarPlus,
  ClipboardCheck,
  CalendarDays,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { PERMISSIONS as P } from "../utils/permissions";
const groups = [
  { label: "", items: [["Dashboard", "/", LayoutDashboard, P.DASHBOARD]] },
  {
    label: "WORKFORCE",
    items: [
      ["Attendance", "/attendance", CalendarCheck, P.ATTENDANCE_ALL],
      ["Attendance History", "/attendance/history", History, P.ATTENDANCE_OWN],
      ["Leave", "/leave", CalendarPlus, P.LEAVE_OWN],
      ["Employees", "/employees", Users, P.EMPLOYEES_ALL],
      ["Leave Requests", "/leave-requests", ClipboardCheck, P.LEAVE_ALL],
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      ["Company Calendar", "/company-calendar", CalendarDays, P.CALENDAR_VIEW],
      ["Roles", "/roles", Shield, P.ROLES_VIEW],
      ["Permissions", "/permissions", KeyRound, P.PERMISSIONS_VIEW],
    ],
  },
  {
    label: "SYSTEM",
    items: [["Audit Logs", "/audit-logs", ScrollText, P.AUDIT_VIEW]],
  },
];
export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? "block" : "hidden"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#111827] text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-black">
              R
            </div>
            <div>
              <p className="font-bold">Remote Office</p>
              <p className="text-xs text-slate-400">Portal</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={onClose}>
            <X />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => {
            const allowed = g.items.filter((i) =>
              user.permissions.includes(i[3]),
            );
            return allowed.length ? (
              <div className="mb-6" key={g.label}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-slate-500">
                  {g.label}
                </p>
                {allowed.map(([name, to, Icon]) => (
                  <NavLink
                    end
                    onClick={onClose}
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`
                    }
                  >
                    <Icon size={18} />
                    {name}
                  </NavLink>
                ))}
              </div>
            ) : null;
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-slate-400">
          Secure workspace • Phase 1.2
        </div>
      </aside>
    </>
  );
}
