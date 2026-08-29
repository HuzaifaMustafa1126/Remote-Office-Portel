import { createContext, useCallback, useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import * as api from "../services/notification.service";
import {
  connectNotifications,
  disconnectNotifications,
} from "../services/socket.service";
export const NotificationContext = createContext(null);

const categoryFor = (type = "") =>
  type.startsWith("TASK_")
    ? "taskNotifications"
    : type.startsWith("LEAVE_")
      ? "leaveNotifications"
      : type.startsWith("BREAK_")
        ? "breakNotifications"
        : "attendanceNotifications";

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [unread, setUnread] = useState(0),
    [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(true),
    [preferences, setPreferences] = useState(null);
  const audio = useRef(null),
    preferencesRef = useRef(null);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  const reconcile = useCallback(async () => {
    const [result, count] = await Promise.all([
      api.list({ page: 1, limit: 10 }),
      api.unreadCount(),
    ]);
    setItems(result.rows);
    setUnread(count);
  }, []);
  const play = useCallback((notification) => {
    const current = preferencesRef.current;
    if (!current?.soundEnabled || !current[categoryFor(notification.type)])
      return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audio.current ||= new Ctx();
      const ctx = audio.current,
        oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        880,
        ctx.currentTime + 0.12,
      );
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.34);
    } catch {
      /* Popup delivery must never depend on audio support. */
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    const unlock = () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
          audio.current ||= new Ctx();
          audio.current.resume().catch(() => {});
        }
      } catch {
        /* Audio is optional. */
      }
    };
    addEventListener("pointerdown", unlock, { once: true });
    addEventListener("keydown", unlock, { once: true });
    return () => {
      removeEventListener("pointerdown", unlock);
      removeEventListener("keydown", unlock);
    };
  }, [user]);
  useEffect(() => {
    if (!user) {
      disconnectNotifications();
      setItems([]);
      setUnread(0);
      return;
    }
    let active = true;
    Promise.all([reconcile(), api.getPreferences().then(setPreferences)]).catch(
      () => {},
    );
    const token =
      localStorage.getItem("rop_token") || sessionStorage.getItem("rop_token");
    const socket = connectNotifications(token);
    socket.on("connect", () => {
      setConnected(true);
      reconcile().catch(() => {});
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("notification:new", (notification) => {
      if (!active) return;
      setItems((old) =>
        [notification, ...old.filter((x) => x.id !== notification.id)].slice(
          0,
          10,
        ),
      );
      setUnread((n) => n + 1);
      setToasts((old) => [...old, notification]);
      play(notification);
      setTimeout(
        () => setToasts((old) => old.filter((x) => x.id !== notification.id)),
        7000,
      );
      if (
        preferencesRef.current?.browserNotifications &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      )
        new Notification(notification.title, { body: notification.message });
    });
    return () => {
      active = false;
      disconnectNotifications();
    };
  }, [user, reconcile, play]);
  const markRead = async (id) => {
    const found = items.find((x) => x.id === id);
    await api.markRead(id);
    setItems((old) => old.map((x) => (x.id === id ? { ...x, isRead: 1 } : x)));
    if (!found || !found.isRead) setUnread((n) => Math.max(0, n - 1));
  };
  const markAll = async () => {
    await api.markAllRead();
    setUnread(0);
    setItems((old) => old.map((x) => ({ ...x, isRead: 1 })));
  };
  const savePreferences = async (next) => {
    const saved = await api.updatePreferences(next);
    setPreferences(saved);
    return saved;
  };
  return (
    <NotificationContext.Provider
      value={{
        items,
        unread,
        toasts,
        connected,
        preferences,
        reconcile,
        markRead,
        markAll,
        savePreferences,
        dismissToast: (id) =>
          setToasts((old) => old.filter((x) => x.id !== id)),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
