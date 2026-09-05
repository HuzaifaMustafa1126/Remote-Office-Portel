import { RefreshCw } from "lucide-react";
export default function RefreshButton({
  onClick,
  refreshing = false,
  label = "Refresh",
}) {
  return (
    <button
      disabled={refreshing}
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:border-primary-border hover:text-primary-text disabled:opacity-60"
    >
      <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
      {refreshing ? "Refreshing…" : label}
    </button>
  );
}
