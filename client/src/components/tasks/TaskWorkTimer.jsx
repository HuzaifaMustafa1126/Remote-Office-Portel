import { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";

const formatDuration = (seconds) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  return [hours, minutes, remaining]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

export default function TaskWorkTimer({ timeTracking, compact = false }) {
  const initial = Number(
    timeTracking?.totalSeconds ?? timeTracking?.timeSpentSeconds ?? 0,
  );
  const running = Boolean(
    timeTracking?.isRunning ?? timeTracking?.activeSessionStartedAt,
  );
  const serverTime = timeTracking?.serverTime;
  const loadedAt = useMemo(() => Date.now(), [initial, running, serverTime]);
  const [elapsed, setElapsed] = useState(initial);

  useEffect(() => {
    setElapsed(initial);
    if (!running) return undefined;
    const serverLoadedAt = serverTime
      ? new Date(serverTime).getTime()
      : loadedAt;
    const startedAt = timeTracking?.activeSessionStartedAt
      ? new Date(timeTracking.activeSessionStartedAt).getTime()
      : null;
    const completed = Number(timeTracking?.completedSeconds);
    const tick = () => {
      if (startedAt != null && Number.isFinite(completed)) {
        const adjustedNow = Date.now() + (serverLoadedAt - loadedAt);
        setElapsed(
          completed + Math.max(0, Math.floor((adjustedNow - startedAt) / 1000)),
        );
      } else {
        setElapsed(
          initial + Math.max(0, Math.floor((Date.now() - loadedAt) / 1000)),
        );
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [initial, running, serverTime, loadedAt]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold tabular-nums ${running ? "text-info" : "text-foreground"}`}
    >
      <Timer size={compact ? 12 : 15} />
      {formatDuration(elapsed)}
    </span>
  );
}

export { formatDuration };
