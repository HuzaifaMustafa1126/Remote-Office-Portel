const styles = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-indigo-50 text-indigo-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};
export default function LeaveStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] || styles.CANCELLED}`}
    >
      {status?.[0] + status?.slice(1).toLowerCase()}
    </span>
  );
}
