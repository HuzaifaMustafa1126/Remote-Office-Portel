import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ImagePlus, X } from "lucide-react";
import {
  createTask,
  getTask,
  getTaskImageBlob,
  listTaskAssignees,
  publishTask,
  removeTaskImage,
  scheduleTask,
  updateTask,
  uploadReferenceImage,
} from "../../services/task.service";

const initial = {
  title: "",
  description: "",
  instructions: "",
  priority: "MEDIUM",
  assignmentType: "DIRECT",
  assigneeEmployeeId: "",
  startAt: "",
  dueAt: "",
  scheduledPublishAt: "",
  reviewRequired: false,
  completionImageRequired: false,
};
const local = (v) => (v ? String(v).replace(" ", "T").slice(0, 16) : "");
const iso = (v) => (v ? new Date(v).toISOString() : null);
const message = (e) =>
  e.response?.data?.message || "Unable to save the task. Please try again.";

export default function TaskFormDrawer({ task, onClose, onSaved }) {
  const [form, setForm] = useState(initial),
    [baseline, setBaseline] = useState(""),
    [employees, setEmployees] = useState([]),
    [existing, setExisting] = useState([]),
    [files, setFiles] = useState([]),
    [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(""),
    [loading, setLoading] = useState(Boolean(task));
  const editing = Boolean(task),
    dirty = (baseline && JSON.stringify(form) !== baseline) || files.length > 0;
  useEffect(() => {
    listTaskAssignees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
    if (task)
      getTask(task.id)
        .then((data) => {
          const next = {
            title: data.title || "",
            description: data.description || "",
            instructions: data.instructions || "",
            priority: data.priority || "MEDIUM",
            assignmentType: data.assignment_type || "DIRECT",
            assigneeEmployeeId: data.assignee_employee_id
              ? String(data.assignee_employee_id)
              : "",
            startAt: local(data.start_at),
            dueAt: local(data.due_at),
            scheduledPublishAt: local(data.scheduled_publish_at),
            reviewRequired: Boolean(data.review_required),
            completionImageRequired: Boolean(data.completion_image_required),
          };
          setForm(next);
          setBaseline(JSON.stringify(next));
          setExisting(
            (data.images || []).filter((x) => x.context === "TASK_REFERENCE"),
          );
        })
        .catch((e) => setErrors({ form: message(e) }))
        .finally(() => setLoading(false));
    else setBaseline(JSON.stringify(initial));
  }, [task]);
  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const employee = useMemo(
    () =>
      employees.find((x) => String(x.id) === String(form.assigneeEmployeeId)),
    [employees, form.assigneeEmployeeId],
  );
  const set = (key, value) => {
    setForm((x) => ({ ...x, [key]: value }));
    setErrors((x) => ({ ...x, [key]: "", form: "" }));
  };
  const close = () => {
    if (!dirty || window.confirm("You have unsaved changes. Discard changes?"))
      onClose();
  };
  const chooseFiles = (e) => {
    const next = [...e.target.files],
      allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    let error = "";
    if (existing.length + files.length + next.length > 5)
      error = "Maximum 5 images allowed";
    else if (next.some((x) => !allowed.includes(x.type)))
      error = "Unsupported image type";
    else if (next.some((x) => x.size > 10 * 1024 * 1024))
      error = "Image exceeds allowed size (10 MB)";
    if (error) setErrors((x) => ({ ...x, images: error }));
    else {
      setFiles((x) => [...x, ...next]);
      setErrors((x) => ({ ...x, images: "" }));
    }
    e.target.value = "";
  };
  const validate = (mode) => {
    const out = {};
    if (form.title.trim().length < 2) out.title = "Task title is required";
    if (
      mode !== "DRAFT" &&
      form.assignmentType === "DIRECT" &&
      !form.assigneeEmployeeId
    )
      out.assigneeEmployeeId = "Employee is required for Direct Assignment";
    if (
      form.startAt &&
      form.dueAt &&
      new Date(form.dueAt) <= new Date(form.startAt)
    )
      out.dueAt = "Due time must be after start time";
    if (
      mode === "SCHEDULED" &&
      (!form.scheduledPublishAt ||
        new Date(form.scheduledPublishAt) <= new Date())
    )
      out.scheduledPublishAt = "Scheduled publish time must be in the future";
    else if (
      mode === "SCHEDULED" &&
      form.dueAt &&
      new Date(form.scheduledPublishAt) >= new Date(form.dueAt)
    )
      out.scheduledPublishAt =
        "Scheduled publish time must be before the task due time";
    setErrors(out);
    return !Object.keys(out).length;
  };
  const definition = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    instructions: form.instructions.trim() || null,
    priority: form.priority,
    assignmentType: form.assignmentType,
    assigneeEmployeeId:
      form.assignmentType === "DIRECT" && form.assigneeEmployeeId
        ? Number(form.assigneeEmployeeId)
        : null,
    startAt: iso(form.startAt),
    dueAt: iso(form.dueAt),
    reviewRequired: form.reviewRequired,
    completionImageRequired: form.completionImageRequired,
  });
  const submit = async (mode) => {
    if (!validate(mode)) return;
    setBusy(mode);
    setErrors({});
    try {
      let id;
      if (editing) {
        id = task.id;
        await updateTask(id, definition());
        if (mode === "NOW") await publishTask(id);
        else if (mode === "SCHEDULED")
          await scheduleTask(id, iso(form.scheduledPublishAt));
      } else {
        const created = await createTask({
          ...definition(),
          publishMode: mode,
          scheduledPublishAt:
            mode === "SCHEDULED" ? iso(form.scheduledPublishAt) : null,
        });
        id = created.id;
      }
      for (const file of files) await uploadReferenceImage(id, file);
      onSaved(
        mode === "SAVE"
          ? "Task changes saved."
          : mode === "DRAFT"
            ? "Task saved as draft."
            : mode === "SCHEDULED"
              ? "Task scheduled."
              : "Task published.",
      );
    } catch (e) {
      setErrors({ form: message(e) });
    } finally {
      setBusy("");
    }
  };
  const removeExisting = async (image) => {
    if (!window.confirm("Remove this reference image?")) return;
    try {
      await removeTaskImage(task.id, image.id);
      setExisting((x) => x.filter((y) => y.id !== image.id));
    } catch (e) {
      setErrors({ form: message(e) });
    }
  };
  if (loading)
    return (
      <Shell close={close}>
        <p className="p-8 text-sm text-muted-foreground">Loading task…</p>
      </Shell>
    );
  return (
    <Shell close={close}>
      <form
        className="flex min-h-full flex-col"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex-1 space-y-7 p-5 sm:p-7">
          <header>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {editing ? "Edit task" : "New task"}
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {editing ? task.title : "Create Task"}
            </h2>
          </header>
          {errors.form && (
            <div className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
              {errors.form}
            </div>
          )}
          <Section title="Task Information">
            <Field label="Task Title" error={errors.title}>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength="200"
                className="input"
                placeholder="What needs to be done?"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows="3"
                className="input"
              />
            </Field>
            <Field label="Instructions / Notes">
              <textarea
                value={form.instructions}
                onChange={(e) => set("instructions", e.target.value)}
                rows="3"
                className="input"
              />
            </Field>
          </Section>
          <Section title="Assignment">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["DIRECT", "Direct Assignment"],
                ["OPEN", "Open Task"],
              ].map(([v, label]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => {
                    set("assignmentType", v);
                    if (v === "OPEN") set("assigneeEmployeeId", "");
                  }}
                  className={`rounded-xl border p-3 text-left text-sm font-bold ${form.assignmentType === v ? "border-primary bg-primary-soft text-primary-text" : "border-border"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.assignmentType === "DIRECT" ? (
              <Field label="Employee" error={errors.assigneeEmployeeId}>
                <select
                  className="input"
                  value={form.assigneeEmployeeId}
                  onChange={(e) => set("assigneeEmployeeId", e.target.value)}
                >
                  <option value="">Select an active employee</option>
                  {employees.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                      {x.department ? ` — ${x.department}` : ""}
                    </option>
                  ))}
                </select>
                {employee && <Availability value={employee.availability} />}
              </Field>
            ) : (
              <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted-foreground">
                This task will be available to all active employees. The first
                eligible employee who claims it will become the assignee.
              </p>
            )}
          </Section>
          <Section title="Priority & Deadline">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Priority">
                <select
                  className="input"
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                >
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Start Date & Time">
                <input
                  type="datetime-local"
                  className="input"
                  value={form.startAt}
                  onChange={(e) => set("startAt", e.target.value)}
                />
              </Field>
              <Field label="Due Date & Time" error={errors.dueAt}>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.dueAt}
                  onChange={(e) => set("dueAt", e.target.value)}
                />
              </Field>
            </div>
          </Section>
          <Section title="Requirements">
            <Toggle
              label="Review Required"
              help="When enabled, the employee must submit the task for CEO/Admin review before completion."
              checked={form.reviewRequired}
              onChange={(v) => set("reviewRequired", v)}
            />
            <Toggle
              label="Completion Image Required"
              help="Require at least one completion image when this task is submitted or completed."
              checked={form.completionImageRequired}
              onChange={(v) => set("completionImageRequired", v)}
            />
          </Section>
          <Section title="Reference Images">
            <p className="mb-3 text-xs text-muted-foreground">
              JPEG, PNG, WebP or GIF · up to 10 MB each · maximum 5
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {existing.map((x) => (
                <ExistingPreview
                  key={x.id}
                  taskId={task.id}
                  image={x}
                  remove={() => removeExisting(x)}
                />
              ))}
              {files.map((x, i) => (
                <Preview
                  key={`${x.name}-${i}`}
                  src={URL.createObjectURL(x)}
                  name={x.name}
                  remove={() => setFiles((y) => y.filter((_, j) => j !== i))}
                />
              ))}
              {existing.length + files.length < 5 && (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border text-xs font-bold text-muted-foreground hover:bg-surface-secondary">
                  <ImagePlus />
                  <span className="mt-2">Add images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={chooseFiles}
                  />
                </label>
              )}
            </div>
            {errors.images && (
              <p className="mt-2 text-xs text-danger">{errors.images}</p>
            )}
          </Section>
          <Section title="Publishing">
            <Field
              label="Publish Date & Time"
              error={errors.scheduledPublishAt}
            >
              <input
                type="datetime-local"
                className="input"
                value={form.scheduledPublishAt}
                onChange={(e) => set("scheduledPublishAt", e.target.value)}
              />
            </Field>
          </Section>
        </div>
        <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-surface p-4">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
          >
            Cancel
          </button>
          {editing && ["OPEN", "TO_DO"].includes(task.status) && (
            <button
              type="button"
              onClick={() => submit("SAVE")}
              disabled={busy}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              {busy === "SAVE" ? "Saving…" : "Save Changes"}
            </button>
          )}
          {(!editing || task.status === "DRAFT") && (
            <button
              type="button"
              onClick={() => submit("DRAFT")}
              disabled={busy}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
            >
              {busy === "DRAFT" ? "Saving…" : "Save as Draft"}
            </button>
          )}
          {(!editing || ["DRAFT", "SCHEDULED"].includes(task.status)) && (
            <>
              <button
                type="button"
                onClick={() => submit("SCHEDULED")}
                disabled={busy}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
              >
                {busy === "SCHEDULED"
                  ? "Scheduling…"
                  : task?.status === "SCHEDULED"
                    ? "Save & Reschedule"
                    : "Schedule"}
              </button>
              <button
                type="button"
                onClick={() => submit("NOW")}
                disabled={busy}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
              >
                {busy === "NOW" ? "Publishing…" : "Publish Now"}
              </button>
            </>
          )}
        </footer>
      </form>
    </Shell>
  );
}
function Shell({ close, children }) {
  return (
    <>
      <button
        aria-label="Close task form"
        onClick={close}
        className="fixed inset-0 z-40 bg-overlay/40"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-surface shadow-2xl sm:left-auto sm:w-[min(760px,94vw)]"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="fixed right-4 top-4 z-10 rounded-xl border border-border bg-surface p-2 shadow-sm"
        >
          <X />
        </button>
        {children}
      </aside>
    </>
  );
}
function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-black uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
function Toggle({ label, help, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-4">
      <span>
        <b className="text-sm">{label}</b>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {help}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-primary"
      />
    </label>
  );
}
function Availability({ value }) {
  const warnings = [
    value?.onLeave && "This employee is currently on approved leave.",
    !value?.online && "This employee is currently offline.",
    value?.withinShift === false &&
      "This employee is currently outside their assigned shift.",
  ].filter(Boolean);
  return warnings.length ? (
    <div className="mt-2 space-y-1 rounded-xl bg-warning-soft p-3 text-xs font-normal text-warning">
      {warnings.map((x) => (
        <p key={x} className="flex gap-2">
          <AlertTriangle size={14} />
          {x}
        </p>
      ))}
    </div>
  ) : (
    <p className="mt-2 text-xs font-normal text-success">
      Available{value?.onBreak ? " · On break" : " · Clocked in"}
    </p>
  );
}
function ExistingPreview({ taskId, image, remove }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let url;
    getTaskImageBlob(taskId, image.id).then((x) => {
      url = x;
      setSrc(x);
    });
    return () => url && URL.revokeObjectURL(url);
  }, [taskId, image.id]);
  return <Preview src={src} name={image.originalFilename} remove={remove} />;
}
function Preview({ src, name, remove }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      {src ? (
        <img src={src} alt={name} className="h-28 w-full object-cover" />
      ) : (
        <div className="h-28 animate-pulse bg-surface-secondary" />
      )}
      <button
        type="button"
        onClick={remove}
        aria-label={`Remove ${name}`}
        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
      >
        <X size={14} />
      </button>
      <p className="truncate px-2 py-1 text-[10px] text-muted-foreground">
        {name}
      </p>
    </div>
  );
}
