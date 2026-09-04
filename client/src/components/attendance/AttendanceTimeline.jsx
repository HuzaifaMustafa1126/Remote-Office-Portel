import { useEffect, useState } from "react";
import { Coffee, LogIn, LogOut, Play } from "lucide-react";
import UpcomingHolidays from "../calendar/UpcomingHolidays";
import { getUpcoming } from "../../services/companyCalendar.service";

const icons = {
  CLOCK_IN: LogIn,
  BREAK_START: Coffee,
  BREAK_END: Play,
  CLOCK_OUT: LogOut,
};
const labels = {
  CLOCK_IN: "Clocked In",
  BREAK_START: "Break Started",
  BREAK_END: "Break Ended",
  CLOCK_OUT: "Clocked Out",
};
const time = (value) =>
  new Intl.DateTimeFormat("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function AttendanceTimeline({ items = [] }) {
  const [holidays, setHolidays] = useState([]), [holidaysLoading, setHolidaysLoading] = useState(true), [holidaysError, setHolidaysError] = useState("");
  useEffect(() => {
    let active = true;
    setHolidaysLoading(true);
    setHolidaysError("");
    getUpcoming()
      .then((rows) => {
        if (active) { setHolidays(rows || []); setHolidaysLoading(false); }
      })
      .catch(() => {
        if (active) { setHolidaysError("Unable to load upcoming holidays."); setHolidaysLoading(false); }
      });
    return () => {
      active = false;
    };
  }, [items]);
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold">Today’s Timeline</h2>
        <div className="mt-4">
          {items.length ? (
            items.map((item, index) => {
              const Icon = icons[item.type] || LogIn;
              return (
                <div
                  key={`${item.type}-${item.at}-${index}`}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < items.length - 1 && (
                    <span className="absolute left-4 top-8 h-full w-px bg-slate-100" />
                  )}
                  <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {labels[item.type] || item.type}
                    </p>
                    <p className="text-xs text-slate-400">{time(item.at)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-5 text-center text-xs text-slate-400">
              No attendance activity yet today.
            </p>
          )}
        </div>
      </section>
      <UpcomingHolidays rows={holidays} loading={holidaysLoading} error={holidaysError} />
    </div>
  );
}
