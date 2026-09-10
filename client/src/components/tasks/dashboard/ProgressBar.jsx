export default function ProgressBar({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-surface-secondary"
      aria-label={`${safe}% complete`}
    >
      <div
        className="h-full rounded-full bg-foreground transition-all"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
