export function requiredWorkMinutes(startTime, endTime, breakAllowanceMinutes) {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(startTime) || !timePattern.test(endTime)) return "";
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  let span = endHour * 60 + endMinute - startHour * 60 - startMinute;
  // Match the server: an end at or before the start falls on the next day.
  if (span <= 0) span += 1440;
  return Math.max(0, span - Number(breakAllowanceMinutes));
}
