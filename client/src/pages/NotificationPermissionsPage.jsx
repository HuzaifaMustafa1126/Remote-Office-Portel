import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  Coffee,
  NotebookPen,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import Button from "../components/common/Button";
import usePermission from "../hooks/usePermission";
import {
  listPolicies,
  savePolicies,
} from "../services/notificationPolicy.service";

const audienceLabels = {
  ALL_EMPLOYEES: "All Employees",
  CEO_ADMIN: "CEO / Admin",
  MANAGERS: "Managers",
  SAME_DEPARTMENT: "Same Department",
  SELECTED_ROLES: "Selected Roles",
  SELECTED_EMPLOYEES: "Selected Employees",
  NOBODY: "Nobody",
};
const categoryMeta = {
  Availability: {
    Icon: Users,
    description:
      "Meeting, Away, Namaz, Break, and return-to-available updates.",
  },
  Attendance: {
    Icon: CalendarClock,
    description:
      "Clock in, clock out, late arrival and attendance-related notifications.",
  },
  Break: {
    Icon: Coffee,
    description: "Break start, return and overtime break alerts.",
  },
  Leave: {
    Icon: CalendarClock,
    description:
      "Leave requests, approvals, rejection and leave-related alerts.",
  },
  Tasks: {
    Icon: ClipboardCheck,
    description:
      "Task assignments, updates, deadlines and task status notifications.",
  },
  Notes: {
    Icon: NotebookPen,
    description:
      "Visibility-based Note publications, sharing, replies, and mentions.",
  },
  "Company & Calendar": {
    Icon: Building2,
    description:
      "Holidays, company calendar changes and company announcements.",
  },
  "Payroll & Salary": {
    Icon: WalletCards,
    description: "Salary, payroll, deductions, bonuses and payslip alerts.",
  },
  Security: {
    Icon: ShieldCheck,
    description: "Login activity, device changes and account security alerts.",
  },
};
const overrides = {
  ATTENDANCE_CLOCK_IN: "Clock In",
  ATTENDANCE_CLOCK_OUT: "Clock Out",
  ATTENDANCE_LATE: "Late Arrival",
  ATTENDANCE_EARLY_CLOCK_OUT: "Early Clock Out",
  ATTENDANCE_MISSING_CLOCK_IN: "Missing Clock In",
  ATTENDANCE_MISSING_CLOCK_OUT: "Missing Clock Out",
  ATTENDANCE_ABSENT: "Absent",
  BREAK_STARTED: "Break Started",
  BREAK_ENDED: "Break Ended",
  BREAK_EXCEEDED: "Break Exceeded",
  AVAILABILITY_CHANGED: "Availability Updates",
  LEAVE_REQUESTED: "Leave Requested",
  LEAVE_APPROVED: "Leave Approved",
  LEAVE_REJECTED: "Leave Rejected",
  LEAVE_CANCELLED: "Leave Cancelled",
  LEAVE_UPCOMING: "Upcoming Leave",
  LEAVE_SALARY_DEDUCTION: "Leave Deduction",
  TASK_ASSIGNED: "New Task",
  TASK_REASSIGNED: "Task Reassigned",
  TASK_UPDATED: "Task Updated",
  TASK_DEADLINE_CHANGED: "Deadline Changed",
  TASK_PRIORITY_CHANGED: "Priority Changed",
  TASK_COMMENT: "New Comment",
  TASK_STARTED: "Task Started",
  TASK_PAUSED: "Task Paused",
  TASK_COMPLETED: "Task Completed",
  ONGOING_WORK_STARTED: "Ongoing Work Started",
  ONGOING_WORK_COMPLETED: "Ongoing Work Completed",
  ONGOING_WORK_CREATED: "Ongoing Work Created",
  ONGOING_WORK_UPDATED: "Ongoing Work Updated",
  ONGOING_WORK_PAUSED: "Ongoing Work Paused",
  ONGOING_WORK_SWITCHED: "Ongoing Work Switched",
  ONGOING_WORK_DELETED: "Ongoing Work Deleted",
  ONGOING_WORK_AUTO_PAUSED_BREAK: "Ongoing Work Paused for Break",
  ONGOING_WORK_AUTO_PAUSED_CLOCK_OUT: "Ongoing Work Paused at Clock Out",
  DAY_END_REPORT_SUBMITTED: "Day-End Report Submitted",
  DAY_END_REPORT_REVIEWED: "Day-End Report Reviewed",
  DAY_END_REPORT_REPLY: "Day-End Report Replies",
  TASK_REOPENED: "Task Reopened",
  TASK_DUE_SOON: "Task Due Soon",
  TASK_OVERDUE: "Task Overdue",
  NOTE_TEAM_PUBLISHED: "New Team Note",
  NOTE_CEO_PUBLISHED: "New Note for CEO",
  NOTE_IMPORTANT_PUBLISHED: "Important Note",
  NOTE_UPDATED: "Note Update",
  NOTE_SHARED_TEAM: "Note Shared",
  NOTE_SHARED_CEO: "Note Shared With CEO",
  NOTE_REPLY_CREATED: "Note Replies",
  NOTE_REPLY_MENTION: "Note Mentions",
  CALENDAR_HOLIDAY_CREATED: "Holiday Created",
  CALENDAR_HOLIDAY_UPDATED: "Holiday Updated",
  CALENDAR_HOLIDAY_DELETED: "Holiday Cancelled",
  CALENDAR_UPCOMING_HOLIDAY: "Upcoming Holiday",
  CALENDAR_WEEKLY_OFF_CHANGED: "Weekly Off Changed",
  ANNOUNCEMENT_CREATED: "Company Announcement",
  SALARY_DAILY_UPDATED: "Daily Salary Updated",
  SALARY_DEDUCTION_ADDED: "Deduction Added",
  SALARY_BONUS_ADDED: "Bonus Added",
  SALARY_OVERTIME_ADDED: "Overtime Added",
  PAYROLL_GENERATED: "Payroll Generated",
  PAYROLL_APPROVED: "Payroll Approved",
  PAYSLIP_AVAILABLE: "Payslip Available",
  PAYROLL_PERIOD_CLOSED: "Payroll Closed",
  SECURITY_LOGIN: "User Login",
  SECURITY_NEW_IP: "New IP Login",
  SECURITY_NEW_DEVICE: "New Device Login",
  SECURITY_FAILED_LOGIN: "Failed Login",
  SECURITY_PASSWORD_CHANGED: "Password Changed",
  SECURITY_PERMISSION_DENIED: "Unauthorized Access",
};
const categoryFor = (type) =>
  type.startsWith("AVAILABILITY_")
    ? "Availability"
    : type.startsWith("BREAK_")
      ? "Break"
      : type.startsWith("NOTE_")
        ? "Notes"
        : type.startsWith("LEAVE_")
          ? "Leave"
          : type.startsWith("TASK_") || type === "OPEN_TASK_CREATED"
            ? "Tasks"
            : type.startsWith("ONGOING_WORK_")
              ? "Tasks"
              : type.startsWith("CALENDAR_") ||
                  type.startsWith("HOLIDAY_") ||
                  type.startsWith("ANNOUNCEMENT")
                ? "Company & Calendar"
                : type.startsWith("PAYROLL_") ||
                    type.startsWith("PAYSLIP_") ||
                    type.startsWith("SALARY_")
                  ? "Payroll & Salary"
                  : type.startsWith("SECURITY_") || type.startsWith("EMPLOYEE_")
                    ? "Security"
                    : "Attendance";
const friendly = (type) =>
  overrides[type] ||
  type
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
const descriptionFor = (type) => {
  if (type === "AVAILABILITY_CHANGED")
    return "Notify employees when a team member changes availability, such as Meeting, Away, Namaz or Break.";
  const noteDescriptions = {
    NOTE_TEAM_PUBLISHED:
      "Notify employees when a new note is published for All Team Members.",
    NOTE_CEO_PUBLISHED:
      "Notify CEO when a new note is published with Only CEO visibility.",
    NOTE_IMPORTANT_PUBLISHED:
      "Notify eligible users when an important note is published.",
    NOTE_REPLY_MENTION:
      "Notify employees when they are @mentioned in a note reply.",
    NOTE_REPLY_CREATED:
      "Notify note creators when someone replies to their note.",
    NOTE_SHARED_TEAM:
      "Notify eligible employees when a note becomes visible to the team.",
    NOTE_SHARED_CEO: "Notify CEO when a note becomes visible to CEO.",
  };
  if (noteDescriptions[type]) return noteDescriptions[type];
  const name = friendly(type).toLowerCase();
  if (type.startsWith("TASK_") || type.startsWith("ONGOING_WORK_"))
    return `Controls who can receive alerts when ${name}.`;
  if (type.startsWith("NOTE_"))
    return `Controls delivery of the ${name} notification to eligible Note viewers.`;
  if (type.startsWith("LEAVE_"))
    return `Controls who can receive the ${name} update.`;
  if (type.startsWith("SECURITY_") || type.startsWith("EMPLOYEE_"))
    return `Controls access to this account and security alert.`;
  return `Controls who can receive the ${name} notification.`;
};
const Toggle = ({ label, on, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={on}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${on ? "bg-primary" : "bg-muted-foreground"}`}
  >
    <span
      className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow transition ${on ? "left-6" : "left-1"}`}
    />
  </button>
);

export default function NotificationPermissionsPage() {
  const categoryStates = useRef(new Map());
  const canManage = usePermission("notification_policy.manage"),
    [rows, setRows] = useState(),
    [saved, setSaved] = useState(),
    [open, setOpen] = useState(),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All Categories"),
    [audience, setAudience] = useState("ALL"),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    listPolicies()
      .then((data) => {
        setRows(data);
        setSaved(structuredClone(data));
      })
      .catch(() => setMessage("Unable to load notification permissions."));
  }, []);
  const set = (id, key, value) => {
    setRows((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
    setMessage("");
  };
  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase(),
      result = {};
    for (const row of rows || []) {
      const group = categoryFor(row.eventType),
        name = friendly(row.eventType),
        description = descriptionFor(row.eventType);
      if (category !== "All Categories" && group !== category) continue;
      if (audience !== "ALL" && row.audienceType !== audience) continue;
      if (
        query &&
        !`${name} ${group} ${description}`.toLowerCase().includes(query)
      )
        continue;
      (result[group] ??= []).push({ ...row, name, description });
    }
    return result;
  }, [rows, search, category, audience]);
  const categories = Object.keys(categoryMeta).filter(
    (name) => grouped[name]?.length,
  );
  const bulk = (name, value) => {
    const ids = new Set((grouped[name] || []).map((row) => row.id));
    setRows((items) =>
      items.map((item) =>
        ids.has(item.id) ? { ...item, enabled: value } : item,
      ),
    );
    setMessage("");
  };
  const toggleCategory = (name, value) => {
    const items = grouped[name] || [];
    if (!value)
      categoryStates.current.set(
        name,
        new Map(items.map((item) => [item.id, item.enabled])),
      );
    const previous = categoryStates.current.get(name),
      ids = new Set(items.map((item) => item.id));
    setRows((current) =>
      current.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              enabled: value ? (previous?.get(item.id) ?? true) : false,
            }
          : item,
      ),
    );
    setMessage("");
  };
  const enableVisible = () => {
    const ids = new Set(
      Object.values(grouped)
        .flat()
        .map((item) => item.id),
    );
    setRows((items) =>
      items.map((item) =>
        ids.has(item.id) ? { ...item, enabled: true } : item,
      ),
    );
    setMessage("");
  };
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const data = await savePolicies(rows);
      setRows(data);
      setSaved(structuredClone(data));
      setMessage("Permissions saved.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to save notification permissions.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (!rows)
    return (
      <main className="mx-auto max-w-6xl space-y-5">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-secondary" />
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
  const changed = JSON.stringify(rows) !== JSON.stringify(saved),
    enabled = rows.filter((row) => row.enabled).length;
  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notification Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control which workplace notifications are available to each role and
            employee group.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-border bg-surface px-3 py-2">
            {rows.length} events
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-2">
            {Object.keys(categoryMeta).length} categories
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-2">
            {enabled} enabled
          </span>
        </div>
      </header>
      <section className="sticky top-2 z-10 rounded-3xl border border-border bg-surface/95 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_220px]">
          <label className="relative">
            <Search
              className="absolute left-3 top-3 text-muted-foreground"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm"
              placeholder="Search notification permissions..."
            />
          </label>
          <label className="text-xs font-semibold">
            Audience
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-surface p-2 text-sm font-normal"
            >
              <option value="ALL">All audiences</option>
              {Object.entries(audienceLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-surface p-2 text-sm font-normal"
            >
              <option>All Categories</option>
              {Object.keys(categoryMeta).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Editing:{" "}
            <strong className="text-foreground">
              {audience === "ALL"
                ? "all configured audiences"
                : audienceLabels[audience]}
            </strong>
            . Change an event’s audience inside its expanded category.
          </p>
          {canManage && (
            <Button variant="secondary" onClick={enableVisible}>
              Enable All in View
            </Button>
          )}
        </div>
      </section>
      {categories.length ? (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {categories.map((name) => {
            const meta = categoryMeta[name],
              Icon = meta.Icon,
              items = grouped[name],
              isOpen = open === name,
              count = items.filter((x) => x.enabled).length;
            return (
              <section
                key={name}
                className={`overflow-hidden rounded-3xl border border-border bg-surface shadow-sm ${isOpen ? "md:col-span-2" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-secondary">
                    <Icon size={20} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : name)}
                    className="min-w-48 flex-1 text-left"
                  >
                    <span className="font-semibold">{name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {meta.description}
                    </span>
                    <span className="mt-2 block text-xs font-medium">
                      {items.length} events · {count} enabled
                    </span>
                  </button>
                  <Toggle
                    label={`Allow ${name} notifications`}
                    on={count > 0}
                    disabled={!canManage}
                    onChange={(value) => toggleCategory(name, value)}
                  />
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : name)}
                    className="flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-semibold"
                  >
                    Manage{" "}
                    <ChevronDown
                      size={15}
                      className={`transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-border bg-surface-secondary/40 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{name} Notifications</h2>
                        <p className="text-xs text-muted-foreground">
                          Permission and audience rules for this category.
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => bulk(name, true)}
                          >
                            Enable All
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              confirm(`Disable all ${name} notifications?`) &&
                              bulk(name, false)
                            }
                          >
                            Disable All
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                      {items.map((item) => (
                        <div key={item.id} className="p-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="min-w-52 flex-1">
                              <p className="text-sm font-semibold">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                            <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs">
                              {audienceLabels[item.audienceType]}
                            </span>
                            <span className="text-xs font-semibold">
                              Allowed
                            </span>
                            <Toggle
                              label={`${item.name} allowed`}
                              on={item.enabled}
                              disabled={!canManage}
                              onChange={(value) =>
                                set(item.id, "enabled", value)
                              }
                            />
                          </div>
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                              Audience and delivery options
                            </summary>
                            <div className="mt-3 grid gap-3 rounded-xl bg-surface-secondary p-3 sm:grid-cols-2 lg:grid-cols-4">
                              <label className="text-xs font-semibold">
                                Available to
                                <select
                                  disabled={!canManage}
                                  value={item.audienceType}
                                  onChange={(e) =>
                                    set(item.id, "audienceType", e.target.value)
                                  }
                                  className="mt-1 block w-full rounded-lg border border-border bg-surface p-2 font-normal"
                                >
                                  {Object.entries(audienceLabels).map(
                                    ([key, label]) => (
                                      <option key={key} value={key}>
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                              {[
                                ["inAppEnabled", "In-app"],
                                ["desktopEnabled", "Desktop"],
                                ["soundEnabled", "Sound"],
                                ["pushEnabled", "Push"],
                                ["mandatory", "Required"],
                                [
                                  "notifyActor",
                                  "Include person who triggered it",
                                ],
                              ].map(([key, label]) => (
                                <label
                                  key={key}
                                  className="flex items-center justify-between gap-2 text-xs font-medium"
                                >
                                  {label}
                                  <Toggle
                                    label={`${item.name} ${label}`}
                                    on={item[key]}
                                    disabled={!canManage || !item.enabled}
                                    onChange={(value) =>
                                      set(item.id, key, value)
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="rounded-3xl border border-border bg-surface p-8 text-center">
          <h2 className="font-semibold">No permissions found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search, audience, or category.
          </p>
        </section>
      )}
      {canManage && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
          <span className="mr-auto text-sm text-muted-foreground">
            {message ||
              (!changed ? "All changes saved." : "You have unsaved changes.")}
          </span>
          <Button
            variant="secondary"
            disabled={!changed || saving}
            onClick={() => {
              setRows(structuredClone(saved));
              setMessage("Changes discarded.");
            }}
          >
            Discard Changes
          </Button>
          <Button disabled={!changed || saving} onClick={save}>
            {saving ? "Saving…" : "Save Permissions"}
          </Button>
        </div>
      )}
      {!canManage && (
        <p className="text-sm text-muted-foreground">
          You can review these policies, but your role cannot edit them.
        </p>
      )}
    </main>
  );
}
