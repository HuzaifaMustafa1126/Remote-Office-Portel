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
  SlidersHorizontal,
  ClipboardList,
  NotebookPen,
  Activity,
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
    label: "WORK",
    items: [
      ["Task Management", "/tasks", ClipboardList, P.TASK_VIEW_OWN],
      ["My Day-End Reports", "/my-day-end-reports", ClipboardCheck, P.DAY_END_REPORT_SUBMIT],
      [
        "Team Ongoing Work",
        "/team-ongoing-work",
        Activity,
        P.ONGOING_WORK_VIEW_TEAM,
      ],
      [
        "Day-End Reports",
        "/day-end-reports",
        ClipboardCheck,
        P.DAY_END_REPORT_VIEW_ALL,
      ],
      ["Notes", "/notes", NotebookPen, P.NOTES_VIEW_OWN],
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
    items: [
      ["Audit Logs", "/audit-logs", ScrollText, P.AUDIT_VIEW],
      ["Login Security", "/login-security", KeyRound, P.SECURITY_LOGIN_VIEW],
      [
        "Attendance Policy",
        "/settings/attendance-policy",
        SlidersHorizontal,
        P.ATTENDANCE_POLICY_VIEW,
      ],
      [
        "Notification Permissions",
        "/settings/notification-permissions",
        SlidersHorizontal,
        P.NOTIFICATION_POLICY_VIEW,
      ],
      [
        "Task Management Settings",
        "/settings/task-management",
        SlidersHorizontal,
        P.TASK_SETTINGS,
      ],
      ["Appearance", "/settings/appearance", Palette, null],
    ],
  },
];
export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggle,
}) {
  const { user, logout } = useAuth();
  const panel = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
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
      const focusable = [
        ...panel.current.querySelectorAll("a[href], button:not([disabled])"),
      ].filter((el) => el.getClientRects().length);
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[85vw] max-w-80 flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between px-5 transition-[padding] duration-300">
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={
              desktop
                ? collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
                : undefined
            }
            onClick={() => desktop && onToggle?.()}
            className={`flex min-w-0 items-center gap-3 rounded-xl text-left focus-visible:outline-offset-4 ${collapsed ? "lg:mx-auto" : ""}`}
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black">
              A
            </div>
            <div
              className={`overflow-hidden whitespace-nowrap transition-[opacity,width,transform] duration-200 ${collapsed ? "lg:w-0 lg:-translate-x-2 lg:opacity-0" : "w-40 opacity-100"}`}
            >
              <p className="font-bold">Abdali Marketing</p>
              <p className="text-xs text-sidebar-muted">Portal</p>
            </div>
          </button>
          <button
            aria-label="Close navigation"
            className="shrink-0 rounded-lg p-2 lg:hidden"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <nav
          className={`flex-1 overflow-y-auto px-3 py-4 transition-[padding] duration-300 ${collapsed ? "lg:px-2" : ""}`}
        >
          {groups.map((g) => {
            const allowed = g.items.filter(
              (i) => !i[3] || user.permissions.includes(i[3]),
            );
            return allowed.length ? (
              <div
                className={`${collapsed ? "lg:mb-3" : "mb-6"}`}
                key={g.label}
              >
                <p
                  className={`mb-2 overflow-hidden whitespace-nowrap px-3 text-[10px] font-bold tracking-widest text-sidebar-muted transition-[height,opacity] duration-200 ${collapsed ? "lg:h-0 lg:mb-0 lg:opacity-0" : ""}`}
                >
                  {g.label}
                </p>
                {allowed.map(([name, to, Icon]) => (
                  <NavLink
                    end={to === "/"}
                    onClick={onClose}
                    onMouseEnter={(event) => {
                      if (!desktop || !collapsed) return;
                      const rect = event.currentTarget.getBoundingClientRect();
                      setTooltip({ name, top: rect.top + rect.height / 2 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={(event) => {
                      if (!desktop || !collapsed) return;
                      const rect = event.currentTarget.getBoundingClientRect();
                      setTooltip({ name, top: rect.top + rect.height / 2 });
                    }}
                    onBlur={() => setTooltip(null)}
                    aria-label={name}
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `mb-1 flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-[padding,gap,background-color,color] duration-200 ${collapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""} ${isActive ? "bg-sidebar-active text-sidebar-active-foreground" : "text-sidebar-muted hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"}`
                    }
                  >
                    <Icon className="shrink-0" size={18} />
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[opacity,width,transform] duration-200 ${collapsed ? "lg:w-0 lg:-translate-x-1 lg:opacity-0" : "w-auto opacity-100"}`}
                    >
                      {name}
                    </span>
                  </NavLink>
                ))}
              </div>
            ) : null;
          })}
        </nav>
        <div
          className={`border-t border-sidebar-foreground/10 p-4 text-xs text-sidebar-muted transition-[padding] duration-300 ${collapsed ? "lg:p-2" : ""}`}
        >
          <div
            className={`overflow-hidden transition-[height,opacity] duration-200 ${collapsed ? "lg:h-0 lg:opacity-0" : ""}`}
          >
            <p className="break-words font-semibold text-sidebar-foreground">
              {user.name}
            </p>
            <p className="mt-1">{user.roles.join(", ")}</p>
          </div>
          <button
            onClick={logout}
            onMouseEnter={(event) => {
              if (!desktop || !collapsed) return;
              const rect = event.currentTarget.getBoundingClientRect();
              setTooltip({ name: "Sign Out", top: rect.top + rect.height / 2 });
            }}
            onMouseLeave={() => setTooltip(null)}
            aria-label="Sign Out"
            className={`mt-3 flex h-10 w-full items-center gap-2 rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-foreground/10 ${collapsed ? "lg:mt-0 lg:justify-center lg:gap-0 lg:p-0" : ""}`}
          >
            <LogOut className="shrink-0" size={18} />
            <span
              className={`overflow-hidden whitespace-nowrap transition-[opacity,width] duration-200 ${collapsed ? "lg:w-0 lg:opacity-0" : ""}`}
            >
              Sign Out
            </span>
          </button>
        </div>
        {tooltip && (
          <span
            role="tooltip"
            className="pointer-events-none fixed left-[88px] z-[70] -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-xl"
            style={{ top: tooltip.top }}
          >
            {tooltip.name}
          </span>
        )}
      </aside>
    </>
  );
}
