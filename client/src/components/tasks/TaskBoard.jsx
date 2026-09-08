import { useState } from "react";
import TaskColumn from "./TaskColumn";
const definitions = [
  ["DRAFT", "Drafts"],
  ["SCHEDULED", "Scheduled"],
  ["OPEN", "Open Tasks"],
  ["TO_DO", "To Do"],
  ["IN_PROGRESS", "In Progress"],
  ["SUBMITTED_FOR_REVIEW", "Submitted for Review"],
  ["CHANGES_REQUIRED", "Changes Required"],
  ["COMPLETED", "Completed"],
];
export default function TaskBoard({
  tasks,
  management,
  activeTab,
  onSelect,
  onAction,
  activeTask,
  claimStatus,
  busyTask,
}) {
  const [dragging, setDragging] = useState(null);
  const visible = definitions
    .filter(
      ([status]) => management || !["DRAFT", "SCHEDULED"].includes(status),
    )
    .filter(([status]) => activeTab === "ALL" || activeTab === status);
  return (
    <div className="min-w-0 overflow-x-auto pb-4">
      <div className="flex min-w-max items-start gap-3">
        {visible.map(([status, label]) => (
          <TaskColumn
            key={status}
            status={status}
            label={label}
            tasks={tasks.filter((t) => t.status === status)}
            management={management}
            onSelect={onSelect}
            onAction={onAction}
            activeTask={activeTask}
            claimStatus={claimStatus}
            busyTask={busyTask}
            dragging={dragging}
            onDragStart={management ? undefined : setDragging}
            onDragEnd={() => setDragging(null)}
            onDropTask={(target) => {
              if (!dragging || dragging.status === target) return;
              if (dragging.status === "TO_DO" && target === "IN_PROGRESS")
                onAction("start", dragging);
              else if (
                dragging.status === "CHANGES_REQUIRED" &&
                target === "IN_PROGRESS"
              )
                onAction("resume", dragging);
              else if (
                dragging.status === "IN_PROGRESS" &&
                target === "COMPLETED" &&
                !dragging.review_required
              )
                onAction("complete", dragging);
              else if (
                dragging.status === "IN_PROGRESS" &&
                target === "SUBMITTED_FOR_REVIEW" &&
                dragging.review_required
              )
                onAction("submit", dragging);
              else
                window.alert(
                  "That task cannot move to this status. The current status has been kept.",
                );
              setDragging(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}
