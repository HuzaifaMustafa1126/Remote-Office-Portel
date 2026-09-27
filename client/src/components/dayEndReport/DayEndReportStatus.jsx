const states = {
  SUBMITTED: ["Submitted", "bg-primary-soft text-primary-text"],
  NEEDS_REVIEW: ["Needs Review", "bg-warning-soft text-warning"],
  REVIEWED: ["Reviewed", "bg-success-soft text-success"],
  REPORT_OVERDUE: ["Overdue", "bg-danger-soft text-danger"],
  REPORT_DUE_SOON: ["Due Soon", "bg-warning-soft text-warning"],
  WORKING: ["Working", "bg-info-soft text-info"],
  MISSING: ["Missing", "bg-danger-soft text-danger"],
  NOT_SUBMITTED: ["Not Submitted", "bg-surface-secondary text-muted-foreground"],
};

export const reportStatusLabel = (status) =>
  states[status]?.[0] || String(status || "Unknown").replaceAll("_", " ");

export const reportDate = (value, options = {}) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
        "en-PK",
        { month: "short", day: "numeric", year: "numeric", ...options },
      )
    : "—";

export default function DayEndReportStatus({ status, className = "" }) {
  const [label, tone] = states[status] || [reportStatusLabel(status), "bg-surface-secondary text-foreground"];
  return <span className={`inline-flex h-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone} ${className}`}>{label}</span>;
}
