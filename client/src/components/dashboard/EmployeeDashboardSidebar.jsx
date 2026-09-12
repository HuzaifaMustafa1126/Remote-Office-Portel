import { useEffect, useState } from "react";
import { Coffee, LogIn, LogOut, Play } from "lucide-react";
import EmployeeLeavePanel from "../leave/EmployeeLeavePanel";
import UpcomingHolidays from "../calendar/UpcomingHolidays";
import { getMyLeaves, getSummary } from "../../services/leave.service";
import { getUpcoming } from "../../services/companyCalendar.service";

const icons = { CLOCK_IN: LogIn, BREAK_START: Coffee, BREAK_END: Play, CLOCK_OUT: LogOut };
const labels = { CLOCK_IN: "Clocked In", BREAK_START: "Break Started", BREAK_END: "Break Ended", CLOCK_OUT: "Clocked Out" };
const time = (value) => new Intl.DateTimeFormat("en-PK", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function EmployeeDashboardSidebar({ items = [], showRecent = true }) {
  const [leave, setLeave] = useState({ summary: {}, requests: [] }), [holidays, setHolidays] = useState([]), [holidaysLoading, setHolidaysLoading] = useState(true), [holidaysError, setHolidaysError] = useState("");
  useEffect(() => {
    let active = true;
    setHolidaysLoading(true); setHolidaysError("");
    getUpcoming().then((days) => { if (active) setHolidays(days || []); }).catch(() => { if (active) setHolidaysError("Unable to load upcoming holidays."); }).finally(() => { if (active) setHolidaysLoading(false); });
    Promise.all([getSummary(), getMyLeaves()]).then(([summary, requests]) => { if (active) setLeave({ summary: summary || {}, requests: requests || [] }); }).catch(() => {});
    return () => { active = false; };
  }, [items]);
  return <div className="grid gap-5 md:grid-cols-2">
    {showRecent && <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm md:col-span-2"><h2 className="font-bold">Recent Activity</h2><p className="text-xs text-muted-foreground">Today&apos;s attendance timeline</p><div className="mt-4">{items.length ? items.slice().reverse().map((item, index) => { const Icon = icons[item.type] || LogIn; return <div key={`${item.type}-${item.at}-${index}`} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary-text"><Icon size={15}/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{labels[item.type] || item.type}</p><p className="text-xs text-muted-foreground">{time(item.at)}</p></div></div>; }) : <p className="py-5 text-center text-xs text-muted-foreground">No attendance activity yet today.</p>}</div></section>}
    <EmployeeLeavePanel summary={leave.summary} requests={leave.requests}/>
    <UpcomingHolidays rows={holidays} loading={holidaysLoading} error={holidaysError}/>
  </div>;
}
