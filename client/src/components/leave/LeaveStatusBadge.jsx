const styles = {
  PENDING: "bg-warning-soft text-warning",
  APPROVED: "bg-primary-soft text-primary-text",
  REJECTED: "bg-danger-soft text-danger",
  CANCELLED: "bg-surface-secondary text-muted-foreground",
};
export default function LeaveStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] || styles.CANCELLED}`}
    >
      <span aria-hidden="true" className="mr-1">{status === "APPROVED" ? "✓" : status === "REJECTED" ? "×" : "○"}</span>
      {status?.[0] + status?.slice(1).toLowerCase()}
    </span>
  );
}
