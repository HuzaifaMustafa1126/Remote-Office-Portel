import Modal from "../common/Modal";

export default function SwitchActiveTaskDialog({
  currentTask,
  nextTask,
  onCancel,
  onConfirm,
  busy,
}) {
  if (!currentTask || !nextTask) return null;
  const resuming = nextTask.status === "IN_PROGRESS";
  return (
    <Modal open title="Switch Active Task?" onClose={onCancel}>
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">You are currently working on:</p>
        <p className="rounded-xl bg-surface-secondary p-3 font-bold">
          {currentTask.title}
        </p>
        <p className="text-muted-foreground">
          {resuming ? "Resuming" : "Starting"}:
        </p>
        <p className="rounded-xl bg-surface-secondary p-3 font-bold">
          {nextTask.title}
        </p>
        <p className="leading-6 text-muted-foreground">
          This will pause your current task timer. The current task will remain
          <strong className="text-foreground"> In Progress</strong> and can be
          resumed later.
        </p>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl bg-surface-secondary px-4 py-2.5 font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy
              ? "Switching…"
              : resuming
                ? "Pause Current & Resume Task"
                : "Pause Current & Start New"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
