const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateTimeWithYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatNotificationTime(createdAt, now = Date.now()) {
  const created = new Date(createdAt);
  const current = new Date(now);
  if (!createdAt || !Number.isFinite(created.getTime()) || !Number.isFinite(current.getTime()))
    return "Time unavailable";

  const elapsed = current.getTime() - created.getTime();
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
  }

  const yesterday = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate() - 1,
  );
  if (
    created.getFullYear() === yesterday.getFullYear() &&
    created.getMonth() === yesterday.getMonth() &&
    created.getDate() === yesterday.getDate()
  )
    return `Yesterday, ${timeFormatter.format(created)}`;

  const formatter =
    created.getFullYear() === current.getFullYear()
      ? dateTimeFormatter
      : dateTimeWithYearFormatter;
  return formatter.format(created);
}
