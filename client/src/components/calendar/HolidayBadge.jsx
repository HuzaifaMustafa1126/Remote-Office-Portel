const labels = {
  WORKING_DAY: "Working Day",
  WEEKLY_OFF: "Weekly Off",
  PUBLIC_HOLIDAY: "Public Holiday",
  COMPANY_HOLIDAY: "Company Holiday",
  SPECIAL_OFF_DAY: "Special Off Day",
};
export default function HolidayBadge({ type }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${type === "WORKING_DAY" ? "bg-surface-secondary text-muted-foreground" : "bg-primary-soft text-primary-text"}`}
    >
      {labels[type] || type}
    </span>
  );
}
