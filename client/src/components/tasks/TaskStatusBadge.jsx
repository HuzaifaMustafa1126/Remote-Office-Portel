const labels = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  TO_DO: "Pending",
  IN_PROGRESS: "In Progress",
  SUBMITTED_FOR_REVIEW: "Pending Approval",
  CHANGES_REQUIRED: "Changes Required",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};
const tones = {
  COMPLETED: "bg-success-soft text-success",
  IN_PROGRESS: "bg-info-soft text-info",
  SUBMITTED_FOR_REVIEW: "bg-warning-soft text-warning",
  CHANGES_REQUIRED: "bg-danger-soft text-danger",
  OPEN: "bg-surface-secondary text-foreground",
  TO_DO: "bg-surface-secondary text-muted-foreground",
  DRAFT: "bg-surface-secondary text-muted-foreground",
  SCHEDULED: "bg-primary-soft text-primary-text",
  ARCHIVED: "bg-surface-secondary text-muted-foreground",
};
export default function TaskStatusBadge({ status, overdue = false }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${overdue ? "bg-danger-soft text-danger" : tones[status] || tones.TO_DO}`}
    >
      {overdue
        ? "Overdue"
        : labels[status] || String(status || "Pending").replaceAll("_", " ")}
    </span>
  );
}
