import {
  Bell,
  CalendarCheck,
  ClipboardCheck,
  Coffee,
  DollarSign,
  NotebookPen,
  ShieldCheck,
  Users,
} from "lucide-react";
const icon = (type, category) =>
  category === "CALENDAR"
    ? CalendarCheck
    : category === "NOTE"
      ? NotebookPen
      : category === "PAYROLL"
        ? DollarSign
        : category === "SECURITY"
          ? ShieldCheck
          : ["EMPLOYEE", "SHIFT"].includes(category)
            ? Users
            : type.startsWith("LEAVE")
              ? CalendarCheck
              : type.startsWith("BREAK")
                ? Coffee
                : type.startsWith("TASK")
                  ? ClipboardCheck
                  : Bell;
export default function NotificationItem({ item, onClick, compact = false }) {
  const Icon = icon(item.type, item.category);
  return (
    <button
      onClick={() => onClick(item)}
      className={`flex w-full gap-3 text-left hover:bg-surface-secondary ${compact ? "px-4 py-3" : "rounded-xl border border-border bg-surface p-4"}`}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-text">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <strong className="text-sm text-foreground">{item.title}</strong>
          {!item.isRead && (
            <i className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {item.message}
        </span>
        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.category}</span>
          <span>•</span>
          <span>
            {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.min(
                0,
                Math.round((new Date(item.createdAt) - Date.now()) / 60000),
              ),
              "minute",
            )}
          </span>
        </span>
      </span>
    </button>
  );
}
