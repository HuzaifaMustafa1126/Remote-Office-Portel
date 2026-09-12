import { createContext, useCallback, useEffect, useRef, useState } from "react";
import * as auth from "../services/auth.service";
import { publishPortalStateChanged } from "../utils/portalSync";
export const AuthContext = createContext(null);
const TOKEN = "rop_token";
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [sessionNotice, setSessionNotice] = useState(""),
    [connectionLost, setConnectionLost] = useState(false),
    expiryTimer = useRef(null),
    heartbeatTimer = useRef(null),
    ending = useRef(false);
  const stop = useCallback(() => {
    clearTimeout(expiryTimer.current);
    clearInterval(heartbeatTimer.current);
    expiryTimer.current = null;
    heartbeatTimer.current = null;
  }, []);
  const clear = useCallback(
    (notice = "") => {
      stop();
      sessionStorage.removeItem(TOKEN);
      localStorage.removeItem(TOKEN);
      setUser(null);
      if (notice) setSessionNotice(notice);
    },
    [stop],
  );
  const schedule = useCallback(
    (expiresAt) => {
      stop();
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        clear("Your session has expired. Please log in again.");
        return;
      }
      expiryTimer.current = setTimeout(
        () => clear("Your session has expired. Please log in again."),
        remaining,
      );
      const beat = () =>
        auth
          .heartbeat()
          .then((data) => {
            setConnectionLost(false);
            if (data?.user)
              setUser((current) => ({
                ...data.user,
                expiresAt: current?.expiresAt || data.expiresAt,
              }));
          })
          .catch(() => setConnectionLost(true));
      beat();
      heartbeatTimer.current = setInterval(beat, 45 * 1000);
    },
    [clear, stop],
  );
  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN);
    localStorage.removeItem(TOKEN);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const current = await auth.me();
      setUser(current);
      schedule(current.expiresAt);
    } catch {
      clear("Your session has expired. Please log in again.");
    } finally {
      setLoading(false);
    }
  }, [clear, schedule]);
  useEffect(() => {
    refresh();
    const unauthorized = (e) => {
      if (ending.current) return;
      ending.current = true;
      const expired = e.detail?.code === "SESSION_EXPIRED";
      clear(
        expired
          ? "Your session has expired. Please log in again."
          : "Your session ended. Please log in again.",
      );
      queueMicrotask(() => {
        ending.current = false;
      });
    };
    addEventListener("auth:unauthorized", unauthorized);
    const offline = () => setConnectionLost(true);
    const online = () => {
      setConnectionLost(false);
      if (sessionStorage.getItem(TOKEN))
        auth
          .heartbeat()
          .then(() =>
            publishPortalStateChanged("CONNECTION_RESTORED", {
              includeCurrent: true,
            }),
          )
          .catch(() => setConnectionLost(true));
    };
    addEventListener("offline", offline);
    addEventListener("online", online);
    return () => {
      removeEventListener("auth:unauthorized", unauthorized);
      removeEventListener("offline", offline);
      removeEventListener("online", online);
      stop();
    };
  }, [refresh, clear, stop]);
  const signIn = async (credentials) => {
    const data = await auth.login(credentials);
    localStorage.removeItem(TOKEN);
    sessionStorage.setItem(TOKEN, data.token);
    const current = { ...data.user, expiresAt: data.expiresAt };
    setUser(current);
    setSessionNotice("");
    schedule(data.expiresAt);
    return current;
  };
  const logout = useCallback(async () => {
    if (ending.current) return;
    ending.current = true;
    try {
      if (sessionStorage.getItem(TOKEN)) await auth.logout();
    } catch {
    } finally {
      clear();
      ending.current = false;
    }
  }, [clear]);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        logout,
        refresh,
        sessionNotice,
        connectionLost,
        clearSessionNotice: () => setSessionNotice(""),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
