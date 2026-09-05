import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  Palette,
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
  Clock4,
  WalletCards,
  ChartNoAxesCombined,
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
    label: "PAYROLL",
    items: [
      ["Salary Management", "/salary", WalletCards, P.SALARY_VIEW_ALL],
      ["Payroll", "/payroll", WalletCards, P.PAYROLL_VIEW_ALL],
      ["My Salary", "/my-salary", WalletCards, P.SALARY_VIEW_OWN],
    ],
  },
  {
    label: "REPORTS",
    items: [
      ["Reports & Analytics", "/reports", ChartNoAxesCombined, P.REPORTS_VIEW],
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      ["Company Calendar", "/company-calendar", CalendarDays, P.CALENDAR_VIEW],
      ["Shift Templates", "/shifts", Clock4, P.SHIFT_VIEW],
      ["Roles", "/roles", Shield, P.ROLES_VIEW],
      ["Permissions", "/permissions", KeyRound, P.PERMISSIONS_VIEW],
    ],
  },
  {
    label: "SYSTEM",
    items: [["Audit Logs", "/audit-logs", ScrollText, P.AUDIT_VIEW], ["Appearance", "/settings/appearance", Palette, null]],
  },
];
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const panel = useRef(null);
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || desktop) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const focusable = [...panel.current.querySelectorAll("a[href], button:not([disabled])")].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [open, desktop]);
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-overlay/40 lg:hidden ${open ? "block" : "hidden"}`}
      />
      <aside
        ref={panel}
        inert={!open && !desktop ? true : undefined}
        role={!desktop ? "dialog" : undefined}
        aria-modal={!desktop && open ? true : undefined}
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-[85vw] max-w-80 lg:w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black">
              A
            </div>
            <div>
              <p className="font-bold">Abdali Marketing</p>
              <p className="text-xs text-sidebar-muted">Portel</p>
            </div>
          </div>
          <button aria-label="Close navigation" className="shrink-0 rounded-lg p-2 lg:hidden" onClick={onClose}>
            <X />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => {
            const allowed = g.items.filter((i) =>
              !i[3] || user.permissions.includes(i[3]),
            );
            return allowed.length ? (
              <div className="mb-6" key={g.label}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-sidebar-muted">
                  {g.label}
                </p>
                {allowed.map(([name, to, Icon]) => (
                  <NavLink
                    end
                    onClick={onClose}
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-sidebar-active text-sidebar-active-foreground" : "text-sidebar-muted hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"}`
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
        <div className="border-t border-sidebar-foreground/10 p-4 text-xs text-sidebar-muted">
          <p className="break-words font-semibold text-sidebar-foreground">{user.name}</p>
          <p className="mt-1">{user.roles.join(", ")}</p>
          <button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-foreground/10"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>
    </>
  );
}
