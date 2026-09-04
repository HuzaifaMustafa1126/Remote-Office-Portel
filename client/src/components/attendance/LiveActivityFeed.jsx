import { useEffect, useState } from "react";
import { Coffee, LogIn, LogOut, Play } from "lucide-react";
import { Link } from "react-router-dom";
import UpcomingHolidays from "../calendar/UpcomingHolidays";
import { getUpcoming } from "../../services/companyCalendar.service";
import { getLeaves } from "../../services/leave.service";
const icons = {
  ATTENDANCE_CLOCK_IN: LogIn,
  ATTENDANCE_CLOCK_OUT: LogOut,
  BREAK_STARTED: Coffee,
  BREAK_ENDED: Play,
};
export default function LiveActivityFeed({ items = [] }) {
  const [leaves, setLeaves] = useState(null),
    [holidays, setHolidays] = useState([]),
    [holidaysLoading, setHolidaysLoading] = useState(true),
    [holidaysError, setHolidaysError] = useState("");
  useEffect(() => {
    setHolidaysLoading(true);
    setHolidaysError("");
    getUpcoming().then(setHolidays).catch(() => setHolidaysError("Unable to load upcoming holidays.")).finally(() => setHolidaysLoading(false));
    getLeaves({ status: "PENDING" }).then(setLeaves).catch(() => setLeaves(null));
  }, [items]);
  return (
    <div className="space-y-4">
      <UpcomingHolidays rows={holidays} loading={holidaysLoading} error={holidaysError} />
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold">Leave Requests</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {leaves?.summary.pending || 0} pending review
            </p>
          </div>
          <Link
            to="/leave-requests"
            className="text-xs font-semibold text-indigo-600"
          >
            View all
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {leaves?.rows.slice(0, 3).map((r) => (
            <Link
              to="/leave-requests"
              key={r.id}
              className="block rounded-xl bg-slate-50 p-2.5"
            >
              <p className="text-sm font-semibold">{r.employeeName}</p>
              <p className="text-xs text-slate-400">
                {r.leaveType} • {r.startDate}
              </p>
            </Link>
          ))}
          {leaves && !leaves.rows.length && (
            <p className="py-3 text-center text-xs text-slate-400">
              No pending leave requests.
            </p>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold">Recent Activity</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Latest attendance events
            </p>
          </div>
          <Link
            to="/audit-logs"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        </div>
        {!items.length ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No attendance activity yet today.
          </p>
        ) : (
          <div className="mt-3">
            {items.slice(0, 8).map((x, index) => {
              const Icon = icons[x.action] || LogIn;
              return (
                <div
                  className={`flex gap-3 py-2.5 ${index < Math.min(items.length, 8) - 1 ? "border-b border-slate-100" : ""}`}
                  key={x.id}
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-slate-700">
                      {x.description}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {new Intl.DateTimeFormat("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(x.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
