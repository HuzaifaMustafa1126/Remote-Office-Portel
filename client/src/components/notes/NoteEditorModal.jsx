import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  Image,
  Info,
  Lock,
  Send,
  ShieldCheck,
  Star,
  Upload,
  Users,
  X,
} from "lucide-react";
import Button from "../common/Button";
import { errorMessage, initials } from "../../utils/helpers";
import * as notes from "../../services/note.service";
import {
  finalizeTaskWithNote,
  uploadSubmissionImage,
} from "../../services/task.service";

const base = {
  title: "",
  summary: "",
  content: "",
  visibility: "TEAM",
  isImportant: false,
};
export default function NoteEditorModal({
  note = {},
  author,
  mode = "standalone",
  task = null,
  onClose,
  onSaved,
  onConflict,
}) {
  const taskMode = mode !== "standalone",
    initial = useRef({
      ...base,
      ...note,
      ...(taskMode && !note.id
        ? { title: task?.title || "", relatedTaskId: task?.id }
        : {}),
    }),
    fileInput = useRef(null),
    evidenceInput = useRef(null);
  const [form, setForm] = useState(initial.current),
    [files, setFiles] = useState([]),
    [evidence, setEvidence] = useState([]),
    [removed, setRemoved] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dragging, setDragging] = useState(false);
  const dirty =
    files.length ||
    evidence.length ||
    removed.length ||
    JSON.stringify(form) !== JSON.stringify(initial.current);
  const requestClose = useCallback(() => {
    if (
      !busy &&
      (!dirty || window.confirm("Discard your unsaved Note changes?"))
    )
      onClose();
  }, [busy, dirty, onClose]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
    };
  }, [requestClose]);
  const addFiles = (list, setter, limit = 8) => {
    const incoming = [...list];
    if (
      incoming.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 5242880,
      )
    ) {
      setError("Use JPG, PNG, or WEBP images up to 5MB each.");
      return;
    }
    setter((current) => [...current, ...incoming].slice(0, limit));
    setError("");
  };
  const save = async (e) => {
    e.preventDefault();
    if (
      taskMode &&
      task.completion_image_required &&
      !Number(task.submissionImageCount) &&
      !evidence.length
    ) {
      setError(
        "At least one task submission image is required. Note images do not count as task evidence.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      let saved;
      if (taskMode) {
        for (const file of evidence) await uploadSubmissionImage(task.id, file);
        const result = await finalizeTaskWithNote(task.id, {
          action: mode === "task_submission" ? "SUBMIT_FOR_REVIEW" : "COMPLETE",
          note: {
            title: form.title.trim(),
            summary: form.summary.trim(),
            content: form.content.trim(),
            visibility: form.visibility,
            isImportant: Boolean(form.isImportant),
          },
        });
        for (const file of files) await notes.uploadImage(result.noteId, file);
        saved = {
          ...form,
          id: result.noteId,
          relatedTaskId: task.id,
          relatedTaskTitle: task.title,
        };
      } else {
        const payload = {
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          visibility: form.visibility,
          isImportant: Boolean(form.isImportant),
          relatedTaskId: form.relatedTaskId || null,
          ...(note.id ? { notifyViewers: Boolean(form.notifyViewers) } : {}),
        };
        const initialSaved = note.id
          ? await notes.updateNote(note.id, payload)
          : await notes.createNote(payload);
        for (const id of removed) await notes.removeImage(initialSaved.id, id);
        for (const file of files)
          await notes.uploadImage(initialSaved.id, file);
        saved = note.id
          ? initialSaved
          : await notes.publishNoteNotifications(initialSaved.id);
      }
      onSaved(saved);
    } catch (err) {
      const message = errorMessage(err);
      if (err.response?.status === 409 && onConflict) onConflict(message);
      else setError(message);
    } finally {
      setBusy(false);
    }
  };
  const visibility = [
    {
      value: "TEAM",
      title: "All Team Members",
      detail: "Visible to all team members",
      Icon: Users,
    },
    {
      value: "PRIVATE",
      title: "Private",
      detail: "Only you can see this note",
      Icon: Lock,
    },
    {
      value: "CEO_ONLY",
      title: "Only CEO",
      detail: "Visible to you and CEO only",
      Icon: ShieldCheck,
    },
  ];
  const heading = taskMode
      ? "Add Work Note"
      : note.id
        ? "Edit Note"
        : "Add New Note",
    sub = taskMode
      ? "Document the work completed before finishing this task."
      : "Write and save important information about your work.",
    submit =
      mode === "task_completion"
        ? "Complete Task & Publish Note"
        : mode === "task_submission"
          ? "Publish Note & Submit for Review"
          : note.id
            ? "Save Changes"
            : "Publish Note";
  return (
    <div
      className="note-editor-backdrop fixed inset-0 z-[70] grid place-items-center bg-[rgba(15,23,42,.45)] p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
    >
      <form
        onSubmit={save}
        className="note-editor-modal flex max-h-[92vh] w-full max-w-[930px] flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success-soft text-success">
              <FileText size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold sm:text-xl">{heading}</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">{sub}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={requestClose}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-surface-secondary"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {taskMode && (
            <section className="rounded-xl border border-primary/20 bg-primary-soft p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary-text">
                Linked Task
              </p>
              <p className="mt-1 font-bold">{task.title}</p>
            </section>
          )}
          <Field label="Note Title" count={form.title.length} max={200}>
            <input
              required
              autoFocus
              minLength="2"
              maxLength="200"
              className="input mt-1.5 h-11"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Summary" count={form.summary.length} max={300}>
            <textarea
              required
              maxLength="300"
              rows="2"
              className="input mt-1.5 min-h-[70px] resize-none"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </Field>
          <label className="block text-xs font-semibold">
            Note Content <span className="text-danger">*</span>
            <textarea
              required
              maxLength="50000"
              rows="5"
              className="input mt-1.5 min-h-[140px] resize-y"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </label>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <fieldset>
              <legend className="text-xs font-semibold">
                Visibility <span className="text-danger">*</span>
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {visibility.map(({ value, title, detail, Icon }) => (
                  <label
                    key={value}
                    className={`relative flex min-h-[78px] cursor-pointer items-center gap-2.5 rounded-xl border p-3 ${form.visibility === value ? "border-success bg-success-soft" : "border-border"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      checked={form.visibility === value}
                      onChange={() => setForm({ ...form, visibility: value })}
                    />
                    <Icon size={17} />
                    <span>
                      <b className="block text-xs">{title}</b>
                      <small className="text-[10px] text-muted-foreground">
                        {detail}
                      </small>
                    </span>
                    {form.visibility === value && (
                      <Check
                        size={13}
                        className="absolute right-2 top-2 text-success"
                      />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
            <section>
              <h3 className="text-xs font-semibold">Important Note</h3>
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(e) =>
                    setForm({ ...form, isImportant: e.target.checked })
                  }
                />
                <Star
                  size={16}
                  className={
                    form.isImportant ? "fill-warning text-warning" : ""
                  }
                />
                <span className="text-sm font-semibold">Mark as Important</span>
              </label>
            </section>
          </div>
          {taskMode && task.completion_image_required && (
            <ImageSection
              title="Task submission evidence"
              detail="Required by this task. These images remain Task evidence, separate from the Note."
              files={evidence}
              setFiles={setEvidence}
              input={evidenceInput}
              add={(list) => addFiles(list, setEvidence, 5)}
            />
          )}
          <ImageSection
            title="Note Images"
            detail="Stored with this Work Note."
            files={files}
            setFiles={setFiles}
            input={fileInput}
            dragging={dragging}
            setDragging={setDragging}
            add={(list) => addFiles(list, setFiles, 8)}
            existing={note.images || []}
            removed={removed}
            setRemoved={setRemoved}
            noteId={note.id}
          />
          {note.id && (
            <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold">
              <input
                type="checkbox"
                checked={Boolean(form.notifyViewers)}
                onChange={(e) =>
                  setForm({ ...form, notifyViewers: e.target.checked })
                }
              />
              Notify viewers about this update
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-xs font-bold">
              {initials(author)}
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Created by</p>
              <p className="text-sm font-bold">{author}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              disabled={busy}
              className="inline-flex items-center gap-2 !bg-success"
            >
              <Send size={15} />
              {busy
                ? mode === "task_completion"
                  ? "Completing..."
                  : mode === "task_submission"
                    ? "Submitting..."
                    : "Saving..."
                : submit}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
function Field({ label, count, max, children }) {
  return (
    <label className="block text-xs font-semibold">
      {label} <span className="text-danger">*</span>
      {children}
      <span className="mt-1 block text-right text-[10px] font-normal text-muted-foreground">
        {count}/{max}
      </span>
    </label>
  );
}
function ImageSection({
  title,
  detail,
  files,
  setFiles,
  input,
  add,
  existing = [],
  removed = [],
  setRemoved,
  noteId,
  dragging,
  setDragging,
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold">{title}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging?.(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging?.(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging?.(false);
          add(e.dataTransfer.files);
        }}
        className={`mt-2 grid min-h-[100px] w-full place-items-center rounded-xl border border-dashed p-4 text-center ${dragging ? "border-success bg-success-soft" : "border-border"}`}
      >
        <span>
          <Upload size={22} className="mx-auto text-success" />
          <b className="mt-1 block text-sm">Upload images</b>
          <small className="text-muted-foreground">
            JPG, PNG, WEBP · max 5MB
          </small>
        </span>
      </button>
      <input
        ref={input}
        hidden
        multiple
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length || existing.some((x) => !removed.includes(x.id)) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {existing
            .filter((x) => !removed.includes(x.id))
            .map((x) => (
              <Preview
                key={x.id}
                name={x.originalFilename}
                onRemove={() => setRemoved([...removed, x.id])}
              >
                <RemoteImage noteId={noteId} imageId={x.id} />
              </Preview>
            ))}
          {files.map((f, i) => (
            <Preview
              key={`${f.name}-${i}`}
              name={f.name}
              onRemove={() => setFiles(files.filter((_, j) => j !== i))}
            >
              <LocalImage file={f} />
            </Preview>
          ))}
        </div>
      ) : null}
    </section>
  );
}
function Preview({ name, onRemove, children }) {
  return (
    <span className="relative w-28 overflow-hidden rounded-xl border border-border p-1.5 text-xs">
      <span className="block aspect-video overflow-hidden rounded-lg">
        {children}
      </span>
      <span className="mt-1 block truncate">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
      >
        <X size={11} />
      </button>
    </span>
  );
}
function LocalImage({ file }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    <img src={url} alt={file.name} className="h-full w-full object-cover" />
  ) : null;
}
function RemoteImage({ noteId, imageId }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true,
      current;
    notes.imageBlob(noteId, imageId).then((blob) => {
      if (active) {
        current = URL.createObjectURL(blob);
        setUrl(current);
      }
    });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [noteId, imageId]);
  return url ? (
    <img src={url} alt="Note" className="h-full w-full object-cover" />
  ) : (
    <span className="grid h-full place-items-center">
      <Image size={18} />
    </span>
  );
}
