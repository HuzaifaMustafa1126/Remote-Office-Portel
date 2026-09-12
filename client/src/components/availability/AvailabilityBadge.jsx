const styles = {
  ONLINE: "bg-success-soft text-success",
  OFFLINE: "bg-surface-secondary text-muted-foreground",
  ON_BREAK: "bg-warning-soft text-warning",
  AWAY: "bg-warning-soft text-warning",
  DO_NOT_DISTURB: "bg-danger-soft text-danger",
  IN_MEETING: "bg-primary-soft text-primary-text",
};
export const availabilityLabels = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  ON_BREAK: "On Break",
  AWAY: "Away",
  DO_NOT_DISTURB: "Do Not Disturb",
  IN_MEETING: "In a Meeting",
};

export default function AvailabilityBadge({ status = "OFFLINE" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] || styles.OFFLINE}`}
    >
      <i className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {availabilityLabels[status] || status}
    </span>
  );
}
