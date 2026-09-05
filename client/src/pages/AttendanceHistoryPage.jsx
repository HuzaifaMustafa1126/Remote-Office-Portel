import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AttendanceTable from "../components/attendance/AttendanceTable";
import Loader from "../components/common/Loader";
import PageHeader from "../components/common/PageHeader";
import RefreshButton from "../components/common/RefreshButton";
import * as attendance from "../services/attendance.service";
import { errorMessage } from "../utils/helpers";
const iso = (d) => d.toISOString().slice(0, 10);
const ranges = {
  today: () => {
    const d = new Date();
    return { from: iso(d), to: iso(d) };
  },
  week: () => {
    const d = new Date(),
      from = new Date(d);
    from.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return { from: iso(from), to: iso(d) };
  },
  month: () => {
    const d = new Date();
    return {
      from: iso(new Date(d.getFullYear(), d.getMonth(), 1)),
      to: iso(d),
    };
  },
};
export default function AttendanceHistoryPage() {
  const [preset, setPreset] = useState("month"),
    [filters, setFilters] = useState(ranges.month()),
    [rows, setRows] = useState(null),
    [error, setError] = useState(""),
    [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setRows(await attendance.getHistory(filters));
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [filters]);
  useEffect(() => {
    const timer = setTimeout(load, 150);
    return () => clearTimeout(timer);
  }, [load]);
  const choose = (key) => {
    setPreset(key);
    setFilters(ranges[key]());
  };
  return (
    <>
      <PageHeader
        title="Attendance History"
        description="Review your daily working time and break duration."
        action={<RefreshButton refreshing={refreshing} onClick={load} />}
      />
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries({
              today: "Today",
              week: "This Week",
              month: "This Month",
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => choose(key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${preset === key ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-muted-foreground hover:bg-primary-soft hover:text-primary-text"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-muted-foreground">
              From
              <input
                type="date"
                className="mt-1 block rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                value={filters.from}
                onChange={(e) => {
                  setPreset("");
                  setFilters({ ...filters, from: e.target.value });
                }}
              />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              To
              <input
                type="date"
                className="mt-1 block rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                value={filters.to}
                onChange={(e) => {
                  setPreset("");
                  setFilters({ ...filters, to: e.target.value });
                }}
              />
            </label>
            <button
              onClick={() => choose("month")}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-secondary"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
        {error && (
          <div className="m-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </div>
        )}
        {rows ? <AttendanceTable rows={rows} /> : <Loader />}
      </section>
    </>
  );
}
