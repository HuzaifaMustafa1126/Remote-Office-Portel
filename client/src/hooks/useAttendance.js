import { useCallback, useEffect, useState } from "react";
import * as attendance from "../services/attendance.service";
import { errorMessage } from "../utils/helpers";
import {
  publishPortalStateChanged,
  subscribePortalStateChanged,
} from "../utils/portalSync";

export default function useAttendance({ enabled = true } = {}) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const latest = await attendance.getToday();
      setData(latest);
      setError("");
      return latest;
    } catch (e) {
      const message = errorMessage(e);
      await refresh().catch(() => {});
      publishPortalStateChanged(eventType, { includeCurrent: true });
      if (["BREAK_CHANGED", "ATTENDANCE_CHANGED"].includes(eventType))
        publishPortalStateChanged("ONGOING_WORK_CHANGED", {
          includeCurrent: true,
        });
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const reconcile = () => refresh().catch(() => {});
    const unsubscribe = subscribePortalStateChanged((event) => {
      if (
        ["ATTENDANCE_CHANGED", "BREAK_CHANGED", "CONNECTION_RESTORED"].includes(
          event?.type,
        )
      )
        reconcile();
    });
    const focus = () => reconcile();
    const visible = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [enabled, refresh]);
  const act = async (fn, eventType) => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fn();
      setData(response.data);
      setNotice(
        response.data?.previousOngoingWork && response.data?.status === "WORKING"
          ? `${response.message} ${response.data.previousOngoingWork.title} remains paused until you resume it.`
          : response.data?.ongoingWorkSessionPaused
          ? `${response.message} Your active ongoing work was paused.`
          : response.data?.taskSessionResumed
          ? `${response.message} Your task has resumed automatically.`
          : response.data?.taskSessionPaused
            ? `${response.message} Your active task has been paused.`
            : response.message,
      );
      publishPortalStateChanged(eventType, { includeCurrent: true });
      if (response.data?.ongoingWorkSessionPaused)
        publishPortalStateChanged("ONGOING_WORK_CHANGED", {
          includeCurrent: true,
        });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return {
    data,
    loading,
    busy,
    notice,
    error,
    refresh,
    clockIn: () => act(attendance.clockIn, "ATTENDANCE_CHANGED"),
    startBreak: () => act(attendance.startBreak, "BREAK_CHANGED"),
    endBreak: () => act(attendance.endBreak, "BREAK_CHANGED"),
    clockOut: () => act(attendance.clockOut, "ATTENDANCE_CHANGED"),
  };
}
