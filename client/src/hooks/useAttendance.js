import { useCallback, useState } from "react";
import * as attendance from "../services/attendance.service";
import { errorMessage } from "../utils/helpers";

export default function useAttendance() {
  const [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const latest = await attendance.getToday();
      setData(latest);
      setError("");
      return latest;
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    }
  }, []);
  const act = async (fn) => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fn();
      setData(response.data);
      setNotice(response.message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return {
    data,
    busy,
    notice,
    error,
    refresh,
    clockIn: () => act(attendance.clockIn),
    startBreak: () => act(attendance.startBreak),
    endBreak: () => act(attendance.endBreak),
    clockOut: () => act(attendance.clockOut),
  };
}
