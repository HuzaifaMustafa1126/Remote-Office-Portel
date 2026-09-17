import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useDeviceAccess } from "./DeviceAccessContext";
import useAuth from "../hooks/useAuth";
import * as api from "../services/notification.service";
import {
  connectNotifications,
  disconnectNotifications,
} from "../services/socket.service";
import {
  installAudioUnlockListeners,
  isAudioUnlocked,
  playNotificationSound,
  setSoundConfiguration,
} from "../services/notificationSound.service";
export const NotificationContext = createContext(null);

const categoryFor = (type = "", category = "") =>
  category === "TASK" || type.startsWith("TASK_")
    ? "taskEnabled"
    : category === "NOTE" || type.startsWith("NOTE_")
      ? "noteEnabled"
      : category === "LEAVE" || type.startsWith("LEAVE_")
        ? "leaveEnabled"
        : category === "BREAK" || type.startsWith("BREAK_")
          ? "breakEnabled"
          : category === "CALENDAR"
            ? "calendarEnabled"
            : category === "PAYROLL"
              ? "payrollEnabled"
              : category === "SECURITY"
                ? "securityEnabled"
                : category === "EMPLOYEE"
                  ? "employeeEnabled"
                  : category === "SHIFT"
                    ? "shiftEnabled"
                    : category === "ANNOUNCEMENT" ||
                        type.startsWith("ANNOUNCEMENT")
                      ? "announcementEnabled"
                      : "attendanceEnabled";

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { blocked } = useDeviceAccess();
  const [items, setItems] = useState([]),
    [unread, setUnread] = useState(0),
    [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(true),
    [preferences, setPreferences] = useState(null);
  const preferencesRef = useRef(null),
    seen = useRef(new Set()),
    audioWarningShown = useRef(false);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  const reconcile = useCallback(async () => {
    const [result, count] = await Promise.all([
      api.list({ page: 1, limit: 10 }),
      api.unreadCount(),
    ]);
    setItems(result.rows);
    seen.current = new Set(result.rows.map((item) => Number(item.id)));
    setUnread(count);
  }, []);
  const play = useCallback((notification) => {
    const current = preferencesRef.current;
    if (
      !current?.notificationsEnabled ||
      !current?.soundEnabled ||
      current?.doNotDisturb ||
      notification.soundAllowed === 0 ||
      !current[categoryFor(notification.type, notification.category)]
    )
      return;
    playNotificationSound(notification, current.volume).catch((error) => {
      if (error?.code !== "AUDIO_BLOCKED" || audioWarningShown.current) return;
      audioWarningShown.current = true;
      if (import.meta.env.DEV)
        console.debug("[AUDIO] playback blocked", { error: error.code });
      window.dispatchEvent(new CustomEvent("notification:audio-blocked"));
    });
  }, []);
  useEffect(() => {
    if (!user || blocked) return;
    return installAudioUnlockListeners();
  }, [user, blocked]);
  useEffect(() => {
    if (!user || blocked) {
      disconnectNotifications();
      setItems([]);
      setToasts([]);
      setUnread(0);
      return;
    }
    let active = true;
    Promise.all([
      reconcile(),
      api.getPreferences().then(setPreferences),
      api.getSounds().then(setSoundConfiguration),
    ]).catch(() => {});
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
      const id = Number(notification.id);
      if (seen.current.has(id)) return;
      seen.current.add(id);
      const showInApp = notification.inAppAllowed !== 0;
      if (
        [
          "CLOCK_IN",
          "CLOCK_OUT",
          "BREAK_STARTED",
          "BREAK_ENDED",
          "ON_LEAVE",
        ].includes(notification.type)
      )
        window.dispatchEvent(new CustomEvent("office:activity"));
      if (showInApp)
        setItems((old) =>
          [notification, ...old.filter((x) => x.id !== notification.id)].slice(
            0,
            10,
          ),
        );
      if (showInApp && !notification.isRead) setUnread((n) => n + 1);
      let ownsAttention = true;
      if (!isAudioUnlocked()) ownsAttention = false;
      try {
        if (ownsAttention) {
          const key = `rop_notification_attention_${id}`,
            now = Date.now();
          const previous = Number(localStorage.getItem(key) || 0);
          if (previous && now - previous < 15000) ownsAttention = false;
          else {
            localStorage.setItem(key, String(now));
            setTimeout(() => localStorage.removeItem(key), 16000);
          }
        }
      } catch {}
      if (showInApp && !document.hidden)
        setToasts((old) => [...old, notification]);
      if (ownsAttention) play(notification);
      if (showInApp && !document.hidden)
        setTimeout(
          () => setToasts((old) => old.filter((x) => x.id !== notification.id)),
          7000,
        );
      if (
        preferencesRef.current?.desktopEnabled &&
        notification.desktopAllowed !== 0 &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      )
        if (ownsAttention) {
          const desktop = new Notification(notification.title, {
            body: notification.message,
            tag: `notification-${id}`,
          });
          desktop.onclick = () => {
            window.focus();
            if (notification.actionUrl)
              window.location.assign(notification.actionUrl);
            desktop.close();
          };
        }
    });
    return () => {
      active = false;
      disconnectNotifications();
    };
  }, [user, blocked, reconcile, play]);
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
