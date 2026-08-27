export function minutesBetween(start, end) {
  return Math.max(0, Math.floor((new Date(end) - new Date(start)) / 60000));
}

export function formatAuditTime(value) {
  return new Intl.DateTimeFormat("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function countWeekdays(start, end) {
  let count = 0;
  const day = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (day <= last) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) count += 1;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return count;
}
