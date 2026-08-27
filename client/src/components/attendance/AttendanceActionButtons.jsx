import { Coffee, LogIn, LogOut, Play } from "lucide-react";
import Button from "../common/Button";
export default function AttendanceActionButtons({
  status,
  busy,
  onClockIn,
  onStartBreak,
  onEndBreak,
  onClockOut,
}) {
  if (status === "NOT_CLOCKED_IN")
    return (
      <Button disabled={busy} onClick={onClockIn}>
        <span className="flex items-center gap-2">
          <LogIn size={18} />
          Clock In
        </span>
      </Button>
    );
  if (status === "WORKING")
    return (
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={onStartBreak}>
          <span className="flex items-center gap-2">
            <Coffee size={18} />
            Start Break
          </span>
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onClockOut}>
          <span className="flex items-center gap-2">
            <LogOut size={18} />
            Clock Out
          </span>
        </Button>
      </div>
    );
  if (status === "ON_BREAK")
    return (
      <Button disabled={busy} onClick={onEndBreak}>
        <span className="flex items-center gap-2">
          <Play size={18} />
          End Break
        </span>
      </Button>
    );
  return (
    <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
      Workday Completed
    </p>
  );
}
