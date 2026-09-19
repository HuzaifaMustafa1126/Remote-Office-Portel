import { CalendarClock, Image, ShieldCheck, Users } from "lucide-react";
import PriorityBadge from "./PriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskWorkTimer from "./TaskWorkTimer";
const due = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(v))
    : "No deadline";
export default function TaskCard({
  task,
  management,
  onClick,
  onAction,
  activeTask,
  claimStatus,
  busy,
  onDragStart,
  onDragEnd,
}) {
  const assigned = task.assigneeName || task.assignee_name,
    progress =
      {
        DRAFT: 0,
        SCHEDULED: 0,
        OPEN: 0,
        TO_DO: 10,
        IN_PROGRESS: 55,
        SUBMITTED_FOR_REVIEW: 85,
        CHANGES_REQUIRED: 65,
        COMPLETED: 100,
      }[task.status] || 0,
    editable = management && ["DRAFT", "SCHEDULED"].includes(task.status),
    reviewable = management && task.status === "SUBMITTED_FOR_REVIEW",
    draggable = Boolean(
      onDragStart &&
      ["TO_DO", "IN_PROGRESS", "CHANGES_REQUIRED"].includes(task.status) &&
      !busy,
    );
  let workflow = null,
    help = "";
  if (!management && task.status === "OPEN") {
    workflow = ["claim", "Assign to Me"];
    if (claimStatus?.reached)
      help = "You have reached your Open Task claim limit.";
  } else if (!management && task.status === "TO_DO") {
    workflow = ["start", "Start Task"];
  } else if (!management && task.status === "IN_PROGRESS") {
    workflow = task.activeSessionStartedAt
      ? ["pause", "Pause"]
      : ["resume", "Resume Task"];
  } else if (!management && task.status === "CHANGES_REQUIRED") {
    workflow = ["resume", "Resume Work"];
  }
  const disabled = busy || Boolean(help);
  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(task);
      }}
      onDragEnd={onDragEnd}
      className={`w-full rounded-xl border bg-surface p-3 text-left shadow-sm transition hover:border-foreground/25 hover:shadow-md ${task.overdue ? "border-l-4 border-l-danger" : "border-border"} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <button onClick={() => onClick(task)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-5">
            {task.title}
          </h3>
          <PriorityBadge priority={task.priority} />
        </div>
        {Number(task.unreadCount) > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
            <i className="h-2 w-2 rounded-full bg-primary" />
            {task.unreadCount} new{" "}
            {Number(task.unreadCount) === 1 ? "update" : "updates"}
          </span>
        )}
        {task.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </span>
          <TaskStatusBadge status={task.status} overdue={task.overdue} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          {task.overdue && (
            <span className="rounded-full bg-danger-soft px-2 py-1 font-bold text-danger">
              OVERDUE
            </span>
          )}
          <span className="rounded-full bg-surface-secondary px-2 py-1">
            {task.assignment_type === "OPEN" ? "OPEN" : "DIRECT"}
          </span>
          {task.status === "SUBMITTED_FOR_REVIEW" && (
            <span className="rounded-full bg-primary-soft px-2 py-1 font-bold text-primary-text">
              WAITING FOR REVIEW
            </span>
          )}
          {task.status === "CHANGES_REQUIRED" && (
            <span className="rounded-full bg-warning-soft px-2 py-1 font-bold text-warning">
              ACTION REQUIRED
            </span>
          )}
          {editable && (
            <span className="rounded-full bg-warning-soft px-2 py-1 font-bold text-warning">
              {task.status}
            </span>
          )}
          {Boolean(task.review_required) && (
            <span className="flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-1">
              <ShieldCheck size={11} />
              Review
            </span>
          )}
        </div>
        {management && (
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={13} />
            {assigned || "Unassigned"}
          </p>
        )}
        {task.status === "CHANGES_REQUIRED" && task.changeReason && (
          <p className="mt-3 rounded-lg bg-warning-soft p-2 text-xs text-warning">
            <b>Changes requested:</b> {task.changeReason}
          </p>
        )}
        {task.status === "SUBMITTED_FOR_REVIEW" && task.submitted_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            Submitted {due(task.submitted_at)}
          </p>
        )}
        {task.status === "COMPLETED" && task.completed_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            Completed {due(task.completed_at)}
          </p>
        )}
        {task.status === "IN_PROGRESS" && task.activeSessionStartedAt && (
          <p className="mt-2 flex items-center justify-between rounded-lg bg-info-soft px-2.5 py-2 text-xs">
            <span className="font-semibold text-info">Working Now</span>
            <TaskWorkTimer compact timeTracking={task} />
          </p>
        )}
        {task.status === "IN_PROGRESS" && !task.activeSessionStartedAt && (
          <p className="mt-2 rounded-lg bg-warning-soft px-2.5 py-2 text-xs font-semibold text-warning">
            {task.lastSessionEndReason === "OFFLINE"
              ? "Work paused after connection was lost"
              : "Paused"}
          </p>
        )}
        <div
          className={`mt-3 flex items-center gap-1 border-t border-border pt-2 text-xs ${task.overdue ? "font-semibold text-danger" : "text-muted-foreground"}`}
        >
          <CalendarClock size={13} />
          {task.status === "SCHEDULED"
            ? `Publishes ${due(task.scheduled_publish_at)}`
            : due(task.due_at || task.dueAt)}
          {Number(task.imageCount) > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <Image size={13} />
              {task.imageCount}
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>
      {editable && (
        <div className="mt-3 flex flex-wrap gap-1 border-t border-border pt-2 text-[11px] font-bold">
          <button
            onClick={() => onAction("edit", task)}
            className="rounded-lg bg-surface-secondary px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={() => onAction("publish", task)}
            className="rounded-lg bg-primary-soft px-2 py-1 text-primary-text"
          >
            Publish Now
          </button>
          <button
            onClick={() =>
              onAction(
                task.status === "SCHEDULED" ? "cancel" : "schedule",
                task,
              )
            }
            className="rounded-lg bg-surface-secondary px-2 py-1"
          >
            {task.status === "SCHEDULED" ? "Cancel Schedule" : "Schedule"}
          </button>
          <button
            onClick={() => onAction("duplicate", task)}
            className="rounded-lg bg-surface-secondary px-2 py-1"
          >
            Duplicate
          </button>
          <button
            onClick={() => onAction("delete", task)}
            className="rounded-lg bg-danger-soft px-2 py-1 text-danger"
          >
            Delete
          </button>
        </div>
      )}
      {reviewable && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2">
          <button
            onClick={() => onAction("complete", task)}
            className="rounded-lg bg-primary px-2 py-2 text-xs font-bold text-primary-foreground"
          >
            Complete
          </button>
          <button
            onClick={() => onAction("changes", task)}
            className="rounded-lg bg-warning-soft px-2 py-2 text-xs font-bold text-warning"
          >
            Changes Required
          </button>
        </div>
      )}
      {workflow && (
        <div className="mt-3 border-t border-border pt-2">
          <button
            disabled={disabled}
            onClick={() => onAction(workflow[0], task)}
            className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Working…" : workflow[1]}
          </button>
          {help && (
            <p className="mt-2 text-[11px] leading-4 text-warning">{help}</p>
          )}
        </div>
      )}
    </article>
  );
}
