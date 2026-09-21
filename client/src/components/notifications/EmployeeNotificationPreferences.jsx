import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Coffee,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import Button from "../common/Button";
import useNotifications from "../../hooks/useNotifications";
import NotificationSoundManager from "./NotificationSoundManager";
const groups = [
  [
    "Availability Updates",
    "Updates when a team member changes availability.",
    ["availabilityEnabled"],
    Users,
    [["Availability Updates", "AVAILABILITY_CHANGED", "Notify employees when a team member changes availability, such as Meeting, Away, Namaz or Break."]],
  ],
  [
    "Notes",
    "Control notifications for accessible Notes, important Notes, replies, and mentions.",
    ["noteEnabled"],
    ClipboardCheck,
    [
      ["New Team Notes", "NOTE_TEAM_PUBLISHED", "Notify employees when a new note is published for All Team Members."],
      ["CEO Notes", "NOTE_CEO_PUBLISHED", "Notify CEO when a new note is published with Only CEO visibility."],
      ["Important Notes", "NOTE_IMPORTANT_PUBLISHED", "Notify eligible users when an important note is published."],
      ["Note Update", "NOTE_UPDATED"],
      ["Note Shared", "NOTE_SHARED_TEAM"],
      ["Note Shared With CEO", "NOTE_SHARED_CEO"],
      ["Note Replies", "NOTE_REPLY_CREATED", "Notify note creators when someone replies to their note."],
      ["Note Mentions", "NOTE_REPLY_MENTION", "Notify employees when they are @mentioned in a note reply."],
    ],
  ],
  [
    "Attendance Updates",
    "Updates about your attendance and work schedule.",
    ["attendanceEnabled"],
    Clock3,
    [
      ["Clock In", "ATTENDANCE_CLOCK_IN"],
      ["Clock Out", "ATTENDANCE_CLOCK_OUT"],
      ["Late Arrival", "ATTENDANCE_LATE"],
      ["Early Clock Out", "ATTENDANCE_EARLY_CLOCK_OUT"],
      ["Missing Clock In", "ATTENDANCE_MISSING_CLOCK_IN"],
      ["Missing Clock Out", "ATTENDANCE_MISSING_CLOCK_OUT"],
    ],
  ],
  [
    "Break Updates",
    "Alerts when a break exceeds its allowed duration.",
    ["breakEnabled"],
    Coffee,
    [
      ["Break Running Too Long", "BREAK_EXCEEDED"],
    ],
  ],
  [
    "Leave Updates",
    "Updates about your leave requests and approvals.",
    ["leaveEnabled"],
    CalendarCheck,
    [
      ["Leave Submitted", "LEAVE_REQUESTED"],
      ["Leave Approved", "LEAVE_APPROVED"],
      ["Leave Rejected", "LEAVE_REJECTED"],
      ["Leave Cancelled", "LEAVE_CANCELLED"],
      ["Upcoming Leave", "LEAVE_UPCOMING"],
      ["Leave Deduction", "LEAVE_SALARY_DEDUCTION"],
    ],
  ],
  [
    "Task Updates",
    "Updates about tasks assigned to you.",
    ["taskEnabled"],
    ClipboardCheck,
    [
      ["New Task", "TASK_ASSIGNED"],
      ["Task Updated", "TASK_UPDATED"],
      ["Deadline Changed", "TASK_DEADLINE_CHANGED"],
      ["Priority Changed", "TASK_PRIORITY_CHANGED"],
      ["New Comment", "TASK_COMMENT"],
      ["Task Due Soon", "TASK_DUE_SOON"],
      ["Task Overdue", "TASK_OVERDUE"],
      ["Task Completed", "TASK_COMPLETED"],
      ["Ongoing Work Started", "ONGOING_WORK_STARTED"],
      ["Ongoing Work Completed", "ONGOING_WORK_COMPLETED"],
    ],
  ],
  [
    "Company Updates",
    "Holidays, announcements and company calendar changes.",
    ["calendarEnabled", "announcementEnabled"],
    Building2,
    [
      ["New Holiday", "CALENDAR_HOLIDAY_CREATED"],
      ["Holiday Updated", "CALENDAR_HOLIDAY_UPDATED"],
      ["Holiday Cancelled", "CALENDAR_HOLIDAY_DELETED"],
      ["Weekly Off Changed", "CALENDAR_WEEKLY_OFF_CHANGED"],
      ["Company Announcement", "ANNOUNCEMENT_CREATED"],
      ["Special Off Day", "CALENDAR_SPECIAL_OFF_CREATED"],
    ],
  ],
  [
    "Salary Updates",
    "Updates about your salary and payslips.",
    ["payrollEnabled"],
    WalletCards,
    [
      ["Salary Updated", "SALARY_DAILY_UPDATED"],
      ["Deduction Added", "SALARY_DEDUCTION_ADDED"],
      ["Bonus Added", "SALARY_BONUS_ADDED"],
      ["Payroll Generated", "PAYROLL_GENERATED"],
      ["Payroll Approved", "PAYROLL_APPROVED"],
      ["Payslip Available", "PAYSLIP_AVAILABLE"],
    ],
  ],
  [
    "Security Updates",
    "Important updates about your account and login activity.",
    ["securityEnabled", "employeeEnabled"],
    ShieldCheck,
    [
      ["New Login", "SECURITY_LOGIN"],
      ["New Device", "SECURITY_NEW_DEVICE"],
      ["Password Changed", "SECURITY_PASSWORD_CHANGED"],
      ["Mobile Access Changed", "EMPLOYEE_MOBILE_ACCESS_CHANGED"],
    ],
  ],
];
const Toggle = ({ label, on, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={on}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${on ? "bg-primary" : "bg-muted-foreground"}`}
  >
    <span
      className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition ${on ? "left-6" : "left-1"}`}
    />
  </button>
);
export default function EmployeeNotificationPreferences() {
  const { preferences, savePreferences } = useNotifications(),
    [form, setForm] = useState(),
    [open, setOpen] = useState(),
    [soundOpen, setSoundOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (preferences) setForm(structuredClone(preferences));
  }, [preferences]);
  const eventMap = useMemo(
    () => new Map((form?.eventPreferences || []).map((x) => [x.eventType, x])),
    [form],
  );
  if (!form)
    return (
      <main
        className="mx-auto max-w-5xl space-y-5"
        aria-label="Loading notification preferences"
      >
        <div className="h-16 animate-pulse rounded-2xl bg-surface-secondary" />
        <div className="h-40 animate-pulse rounded-3xl bg-surface-secondary" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((x) => (
            <div
              key={x}
              className="h-32 animate-pulse rounded-3xl bg-surface-secondary"
            />
          ))}
        </div>
      </main>
    );
  const set = (key, value, label) => {
      setForm((x) => ({ ...x, [key]: value }));
      setFeedback(`${label} turned ${value ? "on" : "off"}.`);
    },
    setGroup = (keys, name, value) => {
      setForm((x) => ({
        ...x,
        ...Object.fromEntries(keys.map((k) => [k, value])),
      }));
      setFeedback(`${name} turned ${value ? "on" : "off"}.`);
    },
    setEvent = (type, key, value) =>
      setForm((old) => {
        const rows = [...(old.eventPreferences || [])],
          i = rows.findIndex((x) => x.eventType === type),
          row =
            i < 0
              ? {
                  eventType: type,
                  inAppEnabled: true,
                  desktopEnabled: true,
                  soundEnabled: true,
                }
              : { ...rows[i] };
        row[key] = value;
        i < 0 ? rows.push(row) : (rows[i] = row);
        return { ...old, eventPreferences: rows };
      });
  const desktop = async (value) => {
      if (
        value &&
        "Notification" in window &&
        Notification.permission !== "granted"
      ) {
        if (Notification.permission === "denied")
          return setFeedback(
            "Desktop alerts are blocked. Enable them in your browser settings.",
          );
        if ((await Notification.requestPermission()) !== "granted") return;
      }
      set("desktopEnabled", value, "Desktop alerts");
    },
    save = async (next) => {
      const payload =
        next && typeof next.notificationsEnabled === "boolean" ? next : form;
      setSaving(true);
      try {
        const saved = await savePreferences(payload);
        setForm(structuredClone(saved));
        setFeedback("✓ Preferences saved");
      } catch {
        setFeedback("We could not save your preferences. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    reset = async () => {
      if (
        !confirm(
          "Reset notification preferences?\n\nYour custom notification choices will be restored to the company defaults.",
        )
      )
        return;
      const defaults = {
        ...form,
        notificationsEnabled: true,
        inAppEnabled: true,
        desktopEnabled: true,
        soundEnabled: true,
        doNotDisturb: false,
        volume: 70,
        taskEnabled: true,
        noteEnabled: true,
        leaveEnabled: true,
        breakEnabled: true,
        attendanceEnabled: true,
        availabilityEnabled: true,
        announcementEnabled: true,
        calendarEnabled: true,
        payrollEnabled: true,
        securityEnabled: true,
        employeeEnabled: true,
        shiftEnabled: true,
        eventPreferences: (form.eventPreferences || []).map((event) => ({
          ...event,
          inAppEnabled: null,
          desktopEnabled: null,
          soundEnabled: null,
        })),
      };
      setForm(defaults);
      await save(defaults);
    };
  const permission =
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission;
  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notification Preferences</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which workplace updates you want to receive.
          </p>
        </div>
        <ShieldCheck className="text-muted-foreground" aria-hidden="true" />
      </header>
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Quick Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control your overall notification experience.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Notifications",
              "Receive workplace updates.",
              "notificationsEnabled",
            ],
            ["Desktop Alerts", "Show browser notifications.", "desktopEnabled"],
            [
              "Notification Sounds",
              "Play sounds with notifications.",
              "soundEnabled",
            ],
            ["Do Not Disturb", "Temporarily pause alerts.", "doNotDisturb"],
          ].map(([label, help, key]) => (
            <div
              key={key}
              className="flex min-h-14 items-center justify-between rounded-2xl border border-border px-4 py-3"
            >
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {help}
                </span>
              </span>
              <Toggle
                label={label}
                on={Boolean(form[key])}
                disabled={
                  key !== "notificationsEnabled" && !form.notificationsEnabled
                }
                onChange={(v) =>
                  key === "desktopEnabled" ? desktop(v) : set(key, v, label)
                }
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSoundOpen((x) => !x)}
          className="mt-4 text-sm font-semibold"
        >
          Sound Settings {soundOpen ? "↑" : "→"}
        </button>
        {soundOpen && (
          <div className="mt-4">
            <NotificationSoundManager volume={form.volume} />
            <label className="mt-3 block rounded-2xl border border-border px-4 py-3 text-sm font-medium">
              Volume{" "}
              <span className="ml-2 text-muted-foreground">{form.volume}%</span>
              <input
                aria-label="Notification volume"
                className="mt-3 w-full"
                type="range"
                min="0"
                max="100"
                value={form.volume}
                disabled={!form.notificationsEnabled || !form.soundEnabled}
                onChange={(e) =>
                  set("volume", Number(e.target.value), "Notification volume")
                }
              />
            </label>
          </div>
        )}
        {permission === "denied" && (
          <div className="mt-4 rounded-2xl bg-warning-soft p-4">
            <p className="text-sm font-semibold">Desktop alerts are blocked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enable notifications in your browser settings to receive desktop
              alerts.
            </p>
            <button
              onClick={() => location.reload()}
              className="mt-2 text-xs font-semibold"
            >
              Check Again
            </button>
          </div>
        )}
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Choose Your Updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage notifications by category. Click a category to customize
              it.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold"
          >
            Reset to Default
          </button>
        </div>
        <div className="mt-3 grid items-start gap-4 md:grid-cols-2">
          {groups.map(([name, description, keys, Icon, events]) => {
            const on = keys.every((k) => form[k]),
              expanded = open === name;
            return (
              <article
                key={name}
                className={`overflow-hidden rounded-3xl border border-border bg-surface shadow-sm ${expanded ? "md:col-span-2" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-secondary">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-48 flex-1">
                    <h3 className="font-semibold">{name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {description}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {events.length} update types
                    </p>
                  </div>
                  <Toggle
                    label={name}
                    on={on}
                    disabled={!form.notificationsEnabled}
                    onChange={(v) => setGroup(keys, name, v)}
                  />
                  <button
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : name)}
                    className="flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-semibold"
                  >
                    Manage{" "}
                    <ChevronDown
                      size={15}
                      className={expanded ? "rotate-180" : ""}
                    />
                  </button>
                </div>
                {expanded && (
                  <div className="border-t border-border bg-surface-secondary/40 p-4">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Advanced options
                    </p>
                    <div className="space-y-3">
                      {events.map(([label, type, help]) => {
                        const row = eventMap.get(type) || {};
                        return (
                          <div
                            key={type}
                            className="rounded-2xl border border-border bg-surface p-4"
                          >
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {help || "Choose how you receive this update."}
                            </p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              {[
                                ["Notify me", "inAppEnabled"],
                                ["Desktop alert", "desktopEnabled"],
                                ["Play sound", "soundEnabled"],
                              ].map(([text, key]) => (
                                <label
                                  key={key}
                                  className="flex items-center justify-between gap-2 text-xs font-medium"
                                >
                                  {text}
                                  <Toggle
                                    label={`${label} ${text}`}
                                    on={
                                      (row[key] ?? true) &&
                                      (key !== "desktopEnabled" ||
                                        form.desktopEnabled) &&
                                      (key !== "soundEnabled" ||
                                        form.soundEnabled) &&
                                      ((row.inAppEnabled ?? true) ||
                                        key === "inAppEnabled")
                                    }
                                    disabled={
                                      !on ||
                                      !form.notificationsEnabled ||
                                      (key !== "inAppEnabled" &&
                                        (row.inAppEnabled ?? true) === false) ||
                                      (key === "desktopEnabled" &&
                                        !form.desktopEnabled) ||
                                      (key === "soundEnabled" &&
                                        !form.soundEnabled)
                                    }
                                    onChange={(v) => setEvent(type, key, v)}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <NotificationSoundManager volume={form.volume} />
      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Preferences"}
        </Button>
        {feedback && (
          <span className="text-sm text-muted-foreground">{feedback}</span>
        )}
      </div>
    </main>
  );
}
