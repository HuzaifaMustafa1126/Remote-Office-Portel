export default function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-success-soft text-success" : "bg-surface-secondary text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
