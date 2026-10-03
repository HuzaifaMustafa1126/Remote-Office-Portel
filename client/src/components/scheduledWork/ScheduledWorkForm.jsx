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
  repeatType: "NONE",
  repeatInterval: 2,
  repeatUnit: "DAYS",
  repeatWeekdays: [1],
  repeatMonthDay: 1,
  repeatEndType: "NEVER",
  repeatEndAt: "",
  repeatMaxOccurrences: 10,
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
const pkParts = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(date).filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
const pkDate = (year, month, day, time) => new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${time}+05:00`);
const previewNext = (previous, form) => {
  const parts = pkParts(previous), time = `${parts.hour}:${parts.minute}:${parts.second}`, interval = form.repeatType === "CUSTOM_INTERVAL" ? Number(form.repeatInterval) : 1;
  if (form.repeatType === "CUSTOM_INTERVAL" && form.repeatUnit === "HOURS") return new Date(previous.getTime() + interval * 36e5);
  if (form.repeatType === "WEEKLY") {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], current = names.indexOf(parts.weekday), selected = [...form.repeatWeekdays].sort((a, b) => a - b), later = selected.find((day) => day > current), delta = later !== undefined ? later - current : 7 - current + selected[0];
    return new Date(previous.getTime() + delta * 864e5);
  }
  const months = form.repeatType === "MONTHLY" ? 1 : form.repeatType === "CUSTOM_INTERVAL" && form.repeatUnit === "MONTHS" ? interval : 0;
  if (months) { let year = Number(parts.year), month = Number(parts.month) + months; year += Math.floor((month - 1) / 12); month = ((month - 1) % 12) + 1; const last = new Date(Date.UTC(year, month, 0)).getUTCDate(); return pkDate(year, month, Math.min(Number(form.repeatMonthDay || parts.day), last), time); }
  const days = form.repeatType === "DAILY" ? 1 : interval * (form.repeatUnit === "WEEKS" ? 7 : 1);
  return new Date(previous.getTime() + days * 864e5);
};
export default function ScheduledWorkForm({
  open,
  onClose,
  onSave,
  initial = null,
  rescheduleOnly = false,
  recurrenceOnly = false,
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...blank,
          ...initial,
          repeatType: initial.recurrenceType || blank.repeatType,
          repeatInterval: initial.recurrenceInterval || blank.repeatInterval,
          repeatUnit: initial.recurrenceUnit || blank.repeatUnit,
          repeatWeekdays: initial.recurrenceConfig?.weekdays || blank.repeatWeekdays,
          repeatMonthDay: initial.recurrenceConfig?.monthDay || blank.repeatMonthDay,
          repeatEndType: initial.recurrenceEndType || blank.repeatEndType,
          repeatEndAt: initial.recurrenceEndAt?.slice(0, 10) || blank.repeatEndAt,
          repeatMaxOccurrences: initial.recurrenceMaxOccurrences || blank.repeatMaxOccurrences,
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
  const recurrencePreview = useMemo(() => {
    if (!preview || form.repeatType === "NONE" || (form.repeatType === "WEEKLY" && !form.repeatWeekdays.length)) return [];
    const dates = [preview];
    while (dates.length < 4) dates.push(previewNext(dates.at(-1), form));
    return dates;
  }, [preview, form]);
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
      if (!rescheduleOnly && (!initial || recurrenceOnly) && form.repeatType !== "NONE") {
        payload.repeat = {
          type: form.repeatType,
          interval:
            form.repeatType === "CUSTOM_INTERVAL"
              ? Number(form.repeatInterval)
              : 1,
          ...(form.repeatType === "CUSTOM_INTERVAL" && {
            unit: form.repeatUnit,
          }),
          ...(form.repeatType === "WEEKLY" && {
            weekdays: form.repeatWeekdays,
          }),
          ...(form.repeatType === "MONTHLY" && {
            monthDay: Number(form.repeatMonthDay),
          }),
          endType: form.repeatEndType,
          ...(form.repeatEndType === "ON_DATE" && {
            endAt: form.repeatEndAt,
          }),
          ...(form.repeatEndType === "AFTER_OCCURRENCES" && {
            maxOccurrences: Number(form.repeatMaxOccurrences),
          }),
        };
      }
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
            {recurrenceOnly ? "Edit Recurrence" : rescheduleOnly ? "Reschedule Work" : "Schedule Work"}
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
        {!rescheduleOnly && !recurrenceOnly && (
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
        {!recurrenceOnly && <><p className="mt-5 text-sm font-semibold">Schedule Type *</p>
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
        )}</>}
        {!rescheduleOnly && (!initial || recurrenceOnly) && (
          <div className="mt-5 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Repeat</p>
            <select
              value={form.repeatType}
              onChange={(e) => set("repeatType", e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM_INTERVAL">Custom interval</option>
            </select>
            {form.repeatType === "WEEKLY" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[[1,"Mon"],[2,"Tue"],[3,"Wed"],[4,"Thu"],[5,"Fri"],[6,"Sat"],[0,"Sun"]].map(([day,label]) => {
                  const selected = form.repeatWeekdays.includes(day);
                  return <button type="button" key={day} onClick={() => set("repeatWeekdays", selected ? form.repeatWeekdays.filter((x) => x !== day) : [...form.repeatWeekdays, day])} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${selected ? "border-primary bg-primary-soft text-primary-text" : "border-border"}`}>{label}</button>;
                })}
              </div>
            )}
            {form.repeatType === "MONTHLY" && (
              <label className="mt-3 block text-sm">Day of month
                <input required type="number" min="1" max="31" value={form.repeatMonthDay} onChange={(e) => set("repeatMonthDay", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5" />
              </label>
            )}
            {form.repeatType === "CUSTOM_INTERVAL" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input required type="number" min="1" max="365" value={form.repeatInterval} onChange={(e) => set("repeatInterval", e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5" />
                <select value={form.repeatUnit} onChange={(e) => set("repeatUnit", e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5">
                  {['HOURS','DAYS','WEEKS','MONTHS'].map((x) => <option key={x}>{x[0] + x.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            )}
            {form.repeatType !== "NONE" && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select value={form.repeatEndType} onChange={(e) => set("repeatEndType", e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5">
                  <option value="NEVER">Never ends</option>
                  <option value="ON_DATE">End on date</option>
                  <option value="AFTER_OCCURRENCES">After occurrences</option>
                </select>
                {form.repeatEndType === "ON_DATE" && <input required type="date" value={form.repeatEndAt} onChange={(e) => set("repeatEndAt", e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5" />}
                {form.repeatEndType === "AFTER_OCCURRENCES" && <input required type="number" min="1" max="10000" value={form.repeatMaxOccurrences} onChange={(e) => set("repeatMaxOccurrences", e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5" />}
              </div>
            )}
            {recurrencePreview.length > 0 && <div className="mt-4 rounded-xl bg-surface-secondary p-3"><p className="text-xs font-bold">Next occurrences</p>{recurrencePreview.map((date) => <p key={date.toISOString()} className="mt-1 text-xs text-muted-foreground">{date.toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}</p>)}</div>}
          </div>
        )}
        {!rescheduleOnly && !initial && !recurrenceOnly && (
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
            {busy ? "Saving…" : recurrenceOnly ? "Save Recurrence" : rescheduleOnly ? "Reschedule" : "Schedule Work"}
          </button>
        </div>
      </form>
    </div>
  );
}
