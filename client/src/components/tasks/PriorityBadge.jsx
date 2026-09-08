const styles = {
  LOW: "bg-surface-secondary text-muted-foreground",
  MEDIUM: "bg-primary-soft text-primary-text",
  HIGH: "border border-foreground/30 text-foreground",
  URGENT: "bg-danger-soft text-danger",
};
export default function PriorityBadge({ priority = "MEDIUM" }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}
