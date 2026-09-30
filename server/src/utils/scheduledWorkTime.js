export const APP_TIME_ZONE = "Asia/Karachi";
export const APP_OFFSET = "+05:00";

const parts = (date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((x) => x.type !== "literal")
      .map((x) => [x.type, x.value]),
  );

export function toSqlDateTime(value = new Date()) {
  const p = parts(value instanceof Date ? value : new Date(value));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export function sqlToIso(value) {
  if (!value) return null;
  return `${String(value).replace(" ", "T")}${APP_OFFSET}`;
}

export function parseExact(value) {
  if (typeof value !== "string" || !/(Z|[+-]\d\d:\d\d)$/.test(value))
    return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function relativeDate(value, unit, now = new Date()) {
  const multipliers = {
    MINUTES: 60000,
    HOURS: 3600000,
    DAYS: 86400000,
    WEEKS: 604800000,
  };
  return new Date(now.getTime() + value * multipliers[unit]);
}

export function displayStatus(work, now = new Date()) {
  if (work.status === "COMPLETED" || work.status === "CANCELLED")
    return work.status;
  const scheduled = new Date(sqlToIso(work.scheduledAt ?? work.scheduled_at));
  if (scheduled <= now) return "OVERDUE";
  if (scheduled.getTime() - now.getTime() < 60000) return "DUE_NOW";
  const a = parts(scheduled),
    b = parts(now);
  if (`${a.year}-${a.month}-${a.day}` === `${b.year}-${b.month}-${b.day}`)
    return "DUE_TODAY";
  return "UPCOMING";
}
