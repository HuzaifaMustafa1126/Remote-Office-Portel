import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import HolidayBadge from "./HolidayBadge";
const upcomingDate = (value) => new Intl.DateTimeFormat("en-PK", {
  weekday: "short",
  day: "2-digit",
  month: "short",
}).format(new Date(`${String(value).slice(0, 10)}T00:00:00`));
export default function UpcomingHolidays({ rows = [], loading = false, error = "" }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex justify-between">
        <div>
          <h2 className="font-bold">Upcoming Holidays</h2>
          <p className="text-xs text-muted-foreground">Official company off-days</p>
        </div>
        <Link
          to="/company-calendar"
          className="text-xs font-semibold text-primary-text"
        >
          View Calendar
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {loading && Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl bg-surface-secondary p-2.5"><div className="h-9 w-9 rounded-lg bg-border"/><div className="flex-1"><div className="h-3 w-32 rounded bg-border"/><div className="mt-2 h-2 w-20 rounded bg-border"/></div></div>
        ))}
        {!loading && !error && rows.slice(0, 4).map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl bg-surface-secondary p-2.5"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary-text">
              <CalendarDays size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {upcomingDate(r.calendarDate)}
              </p>
            </div>
            <HolidayBadge type={r.dayType} />
          </div>
        ))}
        {!loading && error && <p className="py-4 text-center text-xs text-danger">Unable to load upcoming holidays.</p>}
        {!loading && !error && !rows.length && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No upcoming holidays.
          </p>
        )}
      </div>
    </section>
  );
}
