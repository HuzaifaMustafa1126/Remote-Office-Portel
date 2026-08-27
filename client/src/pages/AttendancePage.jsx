import { useEffect, useState } from "react";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import AttendanceTable from "../components/attendance/AttendanceTable";
import Loader from "../components/common/Loader";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import { Users, UserCheck, Coffee, Clock3 } from "lucide-react";
import * as attendance from "../services/attendance.service";
import { listEmployees } from "../services/employee.service";
import { errorMessage } from "../utils/helpers";
const today = () => new Date().toISOString().slice(0, 10);
const hours = (m) =>
  `${Math.floor((Number(m) || 0) / 60)}h ${Math.round((Number(m) || 0) % 60)}m`;
export default function AttendancePage() {
  const [tab, setTab] = useState("records"),
    [filters, setFilters] = useState({ from: today(), to: today() }),
    [rows, setRows] = useState(null),
    [employees, setEmployees] = useState([]),
    [daily, setDaily] = useState(null),
    [monthly, setMonthly] = useState(null),
    [month, setMonth] = useState(today().slice(0, 7)),
    [error, setError] = useState("");
  useEffect(() => {
    listEmployees({})
      .then((r) => setEmployees(r.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setError("");
    if (tab === "records")
      attendance
        .getAttendance(filters)
        .then(setRows)
        .catch((e) => {
          setError(errorMessage(e));
          setRows([]);
        });
    if (tab === "daily")
      attendance
        .getDailyReport({ date: filters.from })
        .then(setDaily)
        .catch((e) => {
          setError(errorMessage(e));
          setDaily({
            date: filters.from,
            totals: {
              totalEmployees: 0,
              present: 0,
              onBreak: 0,
              totalWorkedMinutes: 0,
              totalBreakMinutes: 0,
            },
            rows: [],
          });
        });
    if (tab === "monthly")
      attendance
        .getMonthlyReport({ month })
        .then(setMonthly)
        .catch((e) => {
          setError(errorMessage(e));
          setMonthly({ rows: [] });
        });
  }, [tab, filters, month]);
  return (
    <>
      <PageHeader
        title="Attendance"
        description="Monitor daily attendance and organization-wide reports."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["records", "Attendance Records"],
          ["daily", "Daily Report"],
          ["monthly", "Payroll Period Report"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === id ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {tab === "records" && (
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <AttendanceFilters
            filters={filters}
            onChange={setFilters}
            employees={employees}
            showEmployee
          />
          {rows ? <AttendanceTable rows={rows} showEmployee /> : <Loader />}
        </section>
      )}
      {tab === "daily" && (
        <>
          {
            <div className="mb-4 max-w-xs">
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    from: e.target.value,
                    to: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </div>
          }
          {daily ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Employees"
                  value={daily.totals.totalEmployees}
                  icon={Users}
                />
                <StatCard
                  label="Present"
                  value={daily.totals.present}
                  icon={UserCheck}
                  tone="emerald"
                />
                <StatCard
                  label="On Break"
                  value={daily.totals.onBreak}
                  icon={Coffee}
                />
                <StatCard
                  label="Worked / Break"
                  value={`${hours(daily.totals.totalWorkedMinutes)} / ${hours(daily.totals.totalBreakMinutes)}`}
                  icon={Clock3}
                />
              </div>
              <section className="mt-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <AttendanceTable
                  rows={daily.rows.map((x, i) => ({
                    ...x,
                    id: `daily-${i}`,
                    attendanceDate: daily.date,
                  }))}
                  showEmployee
                />
              </section>
            </>
          ) : (
            <Loader />
          )}
        </>
      )}
      {tab === "monthly" && (
        <>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2"
          />
          {monthly ? (
            <section className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Working Days</th>
                    <th className="p-4">Present</th>
                    <th className="p-4">Absent</th>
                    <th className="p-4">Worked</th>
                    <th className="p-4">Break</th>
                    <th className="p-4">Daily Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthly.rows.map((r) => (
                    <tr key={r.employeeId}>
                      <td className="p-4">
                        <p className="font-semibold">{r.employeeName}</p>
                        <p className="text-xs text-slate-400">
                          {r.employeeCode} · {r.department}
                        </p>
                      </td>
                      <td className="p-4">{r.totalWorkingDays}</td>
                      <td className="p-4">{r.presentDays}</td>
                      <td className="p-4">{r.absentDays}</td>
                      <td className="p-4">{hours(r.totalWorkedMinutes)}</td>
                      <td className="p-4">{hours(r.totalBreakMinutes)}</td>
                      <td className="p-4">
                        {hours(r.averageDailyWorkMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <Loader />
          )}
        </>
      )}
    </>
  );
}
