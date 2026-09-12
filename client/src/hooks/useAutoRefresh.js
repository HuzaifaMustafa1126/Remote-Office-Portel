import { useCallback, useEffect, useRef, useState } from "react";
import { refreshErrorMessage } from "../utils/refreshError.js";

export default function useAutoRefresh({ interval = 0, enabled = true, onRefresh }) {
  const callbackRef = useRef(onRefresh), runningRef = useRef(false), intervalRef = useRef(interval), deadlineRef = useRef(0);
  const [refreshing, setRefreshing] = useState(false), [lastUpdated, setLastUpdated] = useState(null), [error, setError] = useState(""), [countdown, setCountdown] = useState(Math.ceil(interval / 1000));

  useEffect(() => { callbackRef.current = onRefresh; }, [onRefresh]);
  const reset = useCallback(() => {
    const seconds = Math.ceil(intervalRef.current / 1000);
    deadlineRef.current = intervalRef.current ? Date.now() + intervalRef.current : 0;
    setCountdown(seconds);
  }, []);
  const refresh = useCallback(async () => {
    if (runningRef.current) return false;
    if (navigator.onLine === false) {
      setError("You are offline. Dashboard data could not be refreshed.");
      return false;
    }
    runningRef.current = true;
    setRefreshing(true);
    setError("");
    try {
      await callbackRef.current();
      setLastUpdated(new Date());
      return true;
    } catch (refreshError) {
      setError(refreshErrorMessage(refreshError));
      return false;
    } finally {
      runningRef.current = false;
      setRefreshing(false);
      reset();
    }
  }, [reset]);

  useEffect(() => {
    intervalRef.current = interval;
    reset();
  }, [interval, reset]);
  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);
  useEffect(() => {
    if (!enabled || !interval) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) refresh();
    };
    const timer = window.setInterval(tick, 1000);
    const visible = () => {
      if (document.visibilityState !== "visible") return;
      if (deadlineRef.current && Date.now() >= deadlineRef.current) refresh();
      else tick();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [enabled, interval, refresh]);

  return { refresh, refreshing, lastUpdated, error, countdown };
}
