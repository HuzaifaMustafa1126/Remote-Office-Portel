import EmptyState from "../common/EmptyState";
import AttendanceBadge from "./AttendanceBadge";
import { formatDate } from "../../utils/helpers";
const time = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";
const stamp = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";
const mins = (v) =>
  `${Math.floor((Number(v) || 0) / 60)}h ${Math.round((Number(v) || 0) % 60)}m`;
export default function AttendanceTable({ rows = [], showEmployee = false }) {
  if (!rows.length)
    return (
      <EmptyState
        title="No attendance records"
        description="No records match the selected filters."
      />
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            {showEmployee && <th className="px-5 py-3">Employee</th>}
            <th className="px-4 py-3">Work Date</th>
            <th className="px-4 py-3">Clock In</th>
            <th className="px-4 py-3">Clock Out</th>
            <th className="px-4 py-3">Break Duration</th>
            <th className="px-4 py-3">Worked Time</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r.id || `${r.employeeId}-${r.attendanceDate}`}
              className="hover:bg-slate-50/60"
            >
              <>
                {showEmployee && (
                  <td className="px-5 py-3">
                    <p className="font-semibold">{r.employeeName}</p>
                    <p className="text-xs text-slate-400">
                      {r.employeeCode} · {r.department}
                    </p>
                  </td>
                )}
              </>
              <td className="whitespace-nowrap px-4 py-3">
                {formatDate(r.workDate || r.attendanceDate)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {stamp(r.clockInAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {stamp(r.clockOutAt)}
              </td>
              <td className="px-4 py-3">{mins(r.totalBreakMinutes)}</td>
              <td className="px-4 py-3">{mins(r.totalWorkMinutes)}</td>
              <td className="px-5 py-3">
                <AttendanceBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
