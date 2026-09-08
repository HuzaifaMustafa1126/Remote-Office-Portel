import TaskCard from "./TaskCard";
const empty = {
  DRAFT: "No draft tasks.",
  SCHEDULED: "No scheduled tasks.",
  OPEN: "No open tasks available.",
  TO_DO: "No tasks waiting to be started.",
  IN_PROGRESS: "No tasks currently in progress.",
  SUBMITTED_FOR_REVIEW: "No tasks awaiting review.",
  CHANGES_REQUIRED: "No tasks require changes.",
  COMPLETED: "No completed tasks yet.",
};
export default function TaskColumn({
  status,
  label,
  tasks,
  management,
  onSelect,
  onAction,
  activeTask,
  claimStatus,
  busyTask,
  dragging,
  onDragStart,
  onDragEnd,
  onDropTask,
}) {
  return (
    <section
      onDragOver={(e) => {
        if (dragging) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropTask?.(status);
      }}
      className={`w-[285px] shrink-0 rounded-2xl border bg-surface-secondary/50 p-3 transition ${dragging ? "border-primary/50" : "border-border"}`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold">{label}</h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold">
          {tasks.length}
        </span>
      </header>
      <div className="max-h-[calc(100vh-260px)] min-h-20 space-y-2 overflow-y-auto pr-1">
        {tasks.length ? (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              management={management}
              onClick={onSelect}
              onAction={onAction}
              activeTask={activeTask}
              claimStatus={claimStatus}
              busy={busyTask === t.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/60 p-5 text-center text-xs leading-5 text-muted-foreground">
            {empty[status]}
          </div>
        )}
      </div>
    </section>
  );
}
