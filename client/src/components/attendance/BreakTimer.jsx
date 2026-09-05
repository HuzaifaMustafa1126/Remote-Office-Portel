import LiveWorkTimer from "./LiveWorkTimer";
export default function BreakTimer({
  seconds = 0,
  running = false,
  className = "font-mono font-bold text-warning",
}) {
  return (
    <LiveWorkTimer seconds={seconds} running={running} className={className} />
  );
}
