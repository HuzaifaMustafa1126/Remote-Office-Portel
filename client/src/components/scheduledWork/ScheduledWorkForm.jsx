import { useMemo, useState } from "react";
const blank = {
  title: "",
  description: "",
  scheduleType: "EXACT",
  scheduledAt: "",
  relativeValue: 48,
  relativeUnit: "HOURS",
  priority: "NORMAL",
  reminders: [],
  customReminderValue: 45,
  customReminderUnit: "MINUTES",
};
const pakistanInputNow = () => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(Date.now() + 60000))
      .filter((x) => x.type !== "literal")
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
export default function ScheduledWorkForm({
  open,
  onClose,
  onSave,
  initial = null,
  rescheduleOnly = false,
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...blank,
          ...initial,
          scheduledAt: initial.scheduledAt?.slice(0, 16) || "",
        }
      : blank,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(() => {
    if (form.scheduleType === "EXACT")
      return form.scheduledAt ? new Date(`${form.scheduledAt}:00+05:00`) : null;
    const ms = { MINUTES: 6e4, HOURS: 36e5, DAYS: 864e5, WEEKS: 6048e5 }[
      form.relativeUnit
    ];
    return new Date(Date.now() + Number(form.relativeValue || 0) * ms);
  }, [form]);
  if (!open) return null;
  const set = (key, value) => setForm((x) => ({ ...x, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload =
        form.scheduleType === "EXACT"
          ? {
              scheduleType: "EXACT",
              scheduledAt: `${form.scheduledAt}:00+05:00`,
            }
          : {
              scheduleType: "RELATIVE",
              relativeValue: Number(form.relativeValue),
              relativeUnit: form.relativeUnit,
            };
      if (!rescheduleOnly)
        Object.assign(payload, {
          title: form.title,
          description: form.description || null,
          priority: form.priority,
        });
      if (!rescheduleOnly && !initial)
        payload.reminders = form.reminders.map(([value, unit]) => ({
          value,
          unit,
        }));
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to schedule work.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/50 p-4">
      <form
        onSubmit={submit}
        className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {rescheduleOnly ? "Reschedule Work" : "Schedule Work"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-muted-foreground"
          >
            ✕
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        {!rescheduleOnly && (
          <>
            <label className="mt-5 block text-sm font-semibold">
              Work Title *
            </label>
            <input
              required
              minLength="2"
              maxLength="255"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            />
            <label className="mt-4 block text-sm font-semibold">
              Description
            </label>
            <textarea
              rows="3"
              maxLength="10000"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            />
            <label className="mt-4 block text-sm font-semibold">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            >
              {["LOW", "NORMAL", "HIGH", "URGENT"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </>
        )}
        <p className="mt-5 text-sm font-semibold">Schedule Type *</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            ["EXACT", "Specific Date & Time"],
            ["RELATIVE", "After Some Time"],
          ].map(([v, l]) => (
            <button
              type="button"
              key={v}
              onClick={() => set("scheduleType", v)}
              className={`rounded-xl border p-3 text-sm font-semibold ${form.scheduleType === v ? "border-primary bg-primary-soft text-primary-text" : "border-border"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {form.scheduleType === "EXACT" ? (
          <div className="mt-4">
            <label className="text-sm font-semibold">
              Date & Time (Pakistan time)
            </label>
            <input
              required
              type="datetime-local"
              min={pakistanInputNow()}
              value={form.scheduledAt}
              onChange={(e) => set("scheduledAt", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            />
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                [24, "HOURS", "24 Hours"],
                [48, "HOURS", "48 Hours"],
                [3, "DAYS", "3 Days"],
                [7, "DAYS", "7 Days"],
              ].map(([n, u, l]) => (
                <button
                  type="button"
                  key={l}
                  onClick={() =>
                    setForm((x) => ({
                      ...x,
                      relativeValue: n,
                      relativeUnit: u,
                    }))
                  }
                  className="rounded-lg bg-surface-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                min="1"
                value={form.relativeValue}
                onChange={(e) => set("relativeValue", e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5"
              />
              <select
                value={form.relativeUnit}
                onChange={(e) => set("relativeUnit", e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5"
              >
                {["MINUTES", "HOURS", "DAYS", "WEEKS"].map((x) => (
                  <option key={x}>{x[0] + x.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {preview && !Number.isNaN(preview.getTime()) && (
          <div className="mt-4 rounded-xl bg-surface-secondary p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {form.scheduleType === "RELATIVE"
                ? "Approximately scheduled for"
                : "Scheduled for"}
            </p>
            <p className="font-semibold">
              {preview.toLocaleString("en-PK", {
                timeZone: "Asia/Karachi",
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
          </div>
        )}
        {!rescheduleOnly && !initial && (
          <div className="mt-5 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Remind Me</p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked disabled /> At Scheduled Time
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                [10, "MINUTES", "10 Minutes Before"],
                [20, "MINUTES", "20 Minutes Before"],
                [30, "MINUTES", "30 Minutes Before"],
                [1, "HOURS", "1 Hour Before"],
                [2, "HOURS", "2 Hours Before"],
                [1, "DAYS", "1 Day Before"],
              ].map(([value, unit, label]) => {
                const checked = form.reminders.some(
                  (x) => x[0] === value && x[1] === unit,
                );
                return (
                  <label key={label} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        set(
                          "reminders",
                          checked
                            ? form.reminders.filter(
                                (x) => !(x[0] === value && x[1] === unit),
                              )
                            : [...form.reminders, [value, unit]],
                        )
                      }
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                aria-label="Custom reminder value"
                type="number"
                min="1"
                value={form.customReminderValue}
                onChange={(e) => set("customReminderValue", e.target.value)}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={form.customReminderUnit}
                onChange={(e) => set("customReminderUnit", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const next = [
                    Number(form.customReminderValue),
                    form.customReminderUnit,
                  ];
                  if (
                    next[0] > 0 &&
                    !form.reminders.some(
                      (x) => x[0] === next[0] && x[1] === next[1],
                    )
                  )
                    set("reminders", [...form.reminders, next]);
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
              >
                + Add Custom Reminder
              </button>
            </div>
            {preview && (
              <div className="mt-4 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">You'll be reminded:</p>
                {form.reminders.map(([value, unit]) => {
                  const ms = { MINUTES: 6e4, HOURS: 36e5, DAYS: 864e5 }[unit];
                  const at = new Date(preview.getTime() - value * ms);
                  return <p key={`${value}-${unit}`}>{at.toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}</p>;
                })}
                <p>{preview.toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })} · At scheduled time</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Saving…" : rescheduleOnly ? "Reschedule" : "Schedule Work"}
          </button>
        </div>
      </form>
    </div>
  );
}
