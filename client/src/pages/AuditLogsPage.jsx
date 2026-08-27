import { useEffect, useState } from "react";
import {
  Activity,
  CalendarClock,
  KeyRound,
  ShieldCheck,
  Search,
  X,
} from "lucide-react";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import PageHeader from "../components/common/PageHeader";
import { listAuditLogs } from "../services/audit.service";
import { errorMessage } from "../utils/helpers";
const labels = {
  LOGIN_SUCCESS: "Login Success",
  LOGIN_FAILED: "Login Failed",
  ATTENDANCE_CLOCK_IN: "Clock In",
  ATTENDANCE_CLOCK_OUT: "Clock Out",
  BREAK_STARTED: "Break Started",
  BREAK_ENDED: "Break Ended",
  ATTENDANCE_UPDATED: "Attendance Updated",
  EMPLOYEE_CREATED: "Employee Created",
  EMPLOYEE_UPDATED: "Employee Updated",
  EMPLOYEE_DEACTIVATED: "Employee Deactivated",
  ROLE_UPDATED: "Role Updated",
  ROLE_ASSIGNED: "Role Assigned",
  PERMISSION_UPDATED: "Permissions Updated",
  LEAVE_REQUESTED: "Leave Requested",
  LEAVE_APPROVED: "Leave Approved",
  LEAVE_REJECTED: "Leave Rejected",
  LEAVE_CANCELLED: "Leave Cancelled",
  LEAVE_DEDUCTION_RECALCULATED: "Leave Deductions Recalculated",
  HOLIDAY_CREATED: "Holiday Created",
  HOLIDAY_UPDATED: "Holiday Updated",
  HOLIDAY_CANCELLED: "Holiday Cancelled",
  SPECIAL_OFF_DAY_CREATED: "Special Off Day Created",
  INITIAL_ADMIN_CREATED: "Administrator Created",
};
const moduleName = (a) =>
  a.startsWith("LOGIN")
    ? "Authentication"
    : a.startsWith("ATTENDANCE")
      ? "Attendance"
      : a.startsWith("BREAK")
        ? "Breaks"
        : a.startsWith("EMPLOYEE")
          ? "Employees"
          : a.startsWith("ROLE")
            ? "Roles"
            : a.startsWith("PERMISSION")
              ? "Permissions"
              : a.startsWith("LEAVE")
                ? "Leave"
                : a.startsWith("HOLIDAY") || a.startsWith("SPECIAL_OFF")
                  ? "Company Calendar"
                  : "System";
const iso = (d) => d.toISOString().slice(0, 10);
function Summary({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xl font-black">{value || 0}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
      search: "",
      category: "",
      userId: "",
      from: "",
      to: "",
      page: 1,
      limit: 20,
    }),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    listAuditLogs(filters)
      .then((r) => {
        setResult(r.data);
        setError("");
      })
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [filters]);
  const set = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  const range = (days) => {
    const to = new Date(),
      from = new Date();
    from.setDate(to.getDate() - days + 1);
    setFilters((f) => ({ ...f, from: iso(from), to: iso(to), page: 1 }));
  };
  const reset = () =>
    setFilters({
      search: "",
      category: "",
      userId: "",
      from: "",
      to: "",
      page: 1,
      limit: 20,
    });
  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Monitor important system activity and user actions."
      />
      {result && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            icon={CalendarClock}
            label="Today’s Activity"
            value={result.summary.todayActivity}
          />
          <Summary
            icon={KeyRound}
            label="Login Events"
            value={result.summary.loginEvents}
          />
          <Summary
            icon={Activity}
            label="Attendance Events"
            value={result.summary.attendanceEvents}
          />
          <Summary
            icon={ShieldCheck}
            label="Administrative Changes"
            value={result.summary.administrativeChanges}
          />
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={17}
            />
            <input
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Search activity…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Actions</option>
            <option value="authentication">Authentication</option>
            <option value="attendance">Attendance</option>
            <option value="breaks">Breaks</option>
            <option value="employees">Employees</option>
            <option value="roles">Roles</option>
            <option value="permissions">Permissions</option>
          </select>
          <select
            value={filters.userId}
            onChange={(e) => set("userId", e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Users</option>
            {result?.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || "System"}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2 xl:col-span-6">
            <button
              onClick={() => range(1)}
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold"
            >
              Today
            </button>
            <button
              onClick={() => range(7)}
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setFilters((f) => ({
                  ...f,
                  from: iso(new Date(d.getFullYear(), d.getMonth(), 1)),
                  to: iso(d),
                  page: 1,
                }));
              }}
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold"
            >
              This Month
            </button>
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500"
            >
              <X size={14} />
              Reset Filters
            </button>
          </div>
        </div>
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        {!result ? (
          <Loader />
        ) : result.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-5 py-3">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.rows.map((l) => {
                  const d = new Date(l.createdAt);
                  return (
                    <tr className="hover:bg-slate-50/60" key={l.id}>
                      <td className="whitespace-nowrap px-5 py-3">
                        <p className="font-medium">
                          {new Intl.DateTimeFormat("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(d)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Intl.DateTimeFormat("en-PK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(d)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {l.userName || "System"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                          {labels[l.action] ||
                            l.action
                              .replaceAll("_", " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {l.description}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {moduleName(l.action)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching activity"
            description="Try changing or resetting the filters."
          />
        )}
        {result && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <p className="text-xs text-slate-400">
              Page {result.meta.page} of {result.meta.pages} ·{" "}
              {result.meta.total} events
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={result.meta.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={result.meta.page >= result.meta.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
