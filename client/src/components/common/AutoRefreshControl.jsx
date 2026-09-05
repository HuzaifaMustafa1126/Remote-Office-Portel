import { RefreshCw } from "lucide-react";
const options = [
  [0, "Off"],
  [15000, "15 Seconds"],
  [30000, "30 Seconds"],
  [60000, "1 Minute"],
  [120000, "2 Minutes"],
  [300000, "5 Minutes"],
];
const updated = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(value)
    : "Waiting for first update";
export default function AutoRefreshControl({
  interval,
  onIntervalChange,
  countdown,
  lastUpdated,
  refreshing,
  error,
  onRefresh,
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-sm">
      <div className="text-right">
        <p
          className={`text-xs font-medium ${error ? "text-danger" : "text-muted-foreground"}`}
        >
          {error || `Last updated: ${updated(lastUpdated)}`}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {interval
            ? `Next refresh in ${countdown}s`
            : "Automatic refresh is off"}
          {error && lastUpdated
            ? ` Last successful: ${updated(lastUpdated)}`
            : ""}
        </p>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        Auto Refresh
        <select
          value={interval}
          onChange={(e) => onIntervalChange(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary-border"
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={refreshing}
        onClick={onRefresh}
        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
