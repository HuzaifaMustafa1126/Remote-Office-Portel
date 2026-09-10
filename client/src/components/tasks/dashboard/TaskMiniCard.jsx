import TaskStatusBadge from "../TaskStatusBadge";
import PriorityBadge from "../PriorityBadge";
const when = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(v))
    : "No deadline";
export default function TaskMiniCard({ task, onClick, showAssignee = false }) {
  return (
    <button
      onClick={() => onClick?.(task)}
      className="flex w-full items-start justify-between gap-3 rounded-lg border border-border p-3 text-left transition hover:bg-surface-secondary"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{task.title}</p>
        {showAssignee && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {task.assigneeName || task.assignee_name || "Unassigned"}
          </p>
        )}
        <p
          className={`mt-1 text-xs ${task.overdue ? "font-semibold text-danger" : "text-muted-foreground"}`}
        >
          {when(task.due_at || task.dueAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <PriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.status} overdue={task.overdue} />
      </div>
    </button>
  );
}
