import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  transitionTask,
  uploadChangeImage,
  uploadSubmissionImage,
} from "../../services/task.service";
const msg = (e) => e.response?.data?.message || "Unable to update this task.";
export default function TaskWorkflowDialog({ action, task, onClose, onDone }) {
  const [reason, setReason] = useState(""),
    [note, setNote] = useState(""),
    [revision, setRevision] = useState(""),
    [files, setFiles] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    changes = action === "changes",
    review = action === "submit";
  const add = (e) => {
    const next = [...e.target.files],
      allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (files.length + next.length > 5) setError("Maximum 5 images allowed");
    else if (next.some((x) => !allowed.includes(x.type)))
      setError("Unsupported image type");
    else if (next.some((x) => x.size > 10 * 1024 * 1024))
      setError("Image exceeds allowed size (10 MB)");
    else {
      setFiles((x) => [...x, ...next]);
      setError("");
    }
    e.target.value = "";
  };
  const submit = async () => {
    if (changes && !reason.trim()) {
      setError("Reason for changes is required.");
      return;
    }
    if (revision && new Date(revision) <= new Date()) {
      setError("Revision deadline must be in the future.");
      return;
    }
    if (
      !changes &&
      task.completion_image_required &&
      !files.length &&
      !Number(task.submissionImageCount)
    ) {
      setError("At least one completion image is required for this task.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (const file of files)
        await (changes
          ? uploadChangeImage(task.id, file)
          : uploadSubmissionImage(task.id, file));
      await transitionTask(
        task.id,
        changes
          ? {
              status: "CHANGES_REQUIRED",
              reason: reason.trim(),
              revisionDueAt: revision ? new Date(revision).toISOString() : null,
            }
          : {
              status: review ? "SUBMITTED_FOR_REVIEW" : "COMPLETED",
              note: note.trim() || undefined,
            },
      );
      onDone(
        changes
          ? task.status === "COMPLETED"
            ? "Task reopened with changes required."
            : "Changes requested."
          : review
            ? "Task submitted for review."
            : "Task completed.",
      );
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        className="fixed inset-0 z-[60] bg-overlay/50"
        onClick={busy ? undefined : onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {changes
                ? "Task review"
                : review
                  ? "Submit work"
                  : "Complete task"}
            </p>
            <h2 className="mt-1 break-words text-xl font-black">
              {task.title}
            </h2>
          </div>
          <button
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-surface-secondary"
          >
            <X />
          </button>
        </div>
        {changes ? (
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold">
              Reason for Changes
              <textarea
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength="1000"
                className="input"
                placeholder="Explain what the employee needs to revise"
              />
            </label>
            <label className="block text-sm font-bold">
              Revision Deadline (optional)
              <input
                type="datetime-local"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                className="input"
              />
            </label>
            <ImagePicker files={files} setFiles={setFiles} add={add} />
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-sm text-muted-foreground">
              {review
                ? "Submit this task for CEO/Admin review?"
                : "Complete this task?"}
            </p>
            <label className="mt-4 block text-sm font-bold">
              {review ? "Submission Note" : "Approval / Completion Note"}{" "}
              (optional)
              <textarea
                rows="3"
                maxLength="1000"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input"
                placeholder={
                  review
                    ? "Tell the reviewer what was completed"
                    : "Add a note for the employee"
                }
              />
            </label>
            <ImagePicker files={files} setFiles={setFiles} add={add} />
            {task.completion_image_required ? (
              <p className="mt-2 text-xs font-bold text-warning">
                At least one completion image is required.
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Completion images are optional. Maximum 5.
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={submit}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            {busy
              ? "Saving…"
              : changes
                ? "Request Changes"
                : review
                  ? "Submit for Review"
                  : "Complete Task"}
          </button>
        </div>
      </section>
    </>
  );
}
function ImagePicker({ files, setFiles, add }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold text-muted-foreground">
        Images (optional)
      </p>
      <div className="grid grid-cols-3 gap-2">
        {files.map((file, i) => (
          <div className="relative" key={`${file.name}-${i}`}>
            <img
              src={URL.createObjectURL(file)}
              className="h-20 w-full rounded-lg object-cover"
              alt={file.name}
            />
            <button
              onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {files.length < 5 && (
          <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border text-[11px] font-bold text-muted-foreground">
            <ImagePlus size={20} />
            Add image
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={add}
            />
          </label>
        )}
      </div>
    </div>
  );
}
