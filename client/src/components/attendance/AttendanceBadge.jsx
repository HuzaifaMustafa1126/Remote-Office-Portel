const styles = {
  WORKING: "bg-success-soft text-success",
  ON_BREAK: "bg-warning-soft text-warning",
  CLOCKED_OUT: "bg-primary-soft text-primary-text",
  NOT_CLOCKED_IN: "bg-surface-secondary text-muted-foreground",
  LEAVE: "bg-accent-soft text-accent-text",
  ABSENT: "bg-danger-soft text-danger",
  OFF_DAY: "bg-surface-secondary text-muted-foreground",
  WORKED_HOLIDAY: "bg-primary-soft text-primary-text",
};
const labels = {
  WORKING: "Working",
  ON_BREAK: "On Break",
  CLOCKED_OUT: "Clocked Out",
  NOT_CLOCKED_IN: "Not Clocked In",
  LEAVE: "Leave",
  ABSENT: "Unauthorized Absence",
  OFF_DAY: "Official Off Day",
  WORKED_HOLIDAY: "Worked on Holiday",
};
export default function AttendanceBadge({ status = "NOT_CLOCKED_IN" }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] || styles.NOT_CLOCKED_IN}`}
    >
      <span aria-hidden="true" className="mr-1">{["WORKING", "CLOCKED_OUT", "WORKED_HOLIDAY"].includes(status) ? "✓" : status === "ABSENT" ? "×" : status === "ON_BREAK" ? "Ⅱ" : "○"}</span>
      {labels[status] || status}
    </span>
  );
}
