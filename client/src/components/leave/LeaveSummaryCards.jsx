import {
  CalendarCheck,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  XCircle,
} from "lucide-react";
const items = [
  ["Pending Requests", "pendingRequests", CalendarClock],
  ["Approved Days", "approvedDays", CalendarCheck],
  ["Free Leave Used", "freeDays", Clock3],
  ["Deductible Days", "deductibleDays", CircleDollarSign],
  ["Rejected Requests", "rejectedRequests", XCircle],
];
export default function LeaveSummaryCards({ summary = {} }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(([label, key, Icon]) => (
        <div
          key={key}
          className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-black">{summary[key] || 0}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary-text">
              <Icon size={17} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
