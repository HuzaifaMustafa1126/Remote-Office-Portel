import { createContext, useContext, useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import useDeviceType from "../hooks/useDeviceType";
import { canAccessDevice } from "../utils/device";
const DeviceAccessContext = createContext(null);
export const useDeviceAccess = () => useContext(DeviceAccessContext);
export function DeviceAccessProvider({ children }) {
  const { user } = useAuth();
  const device = useDeviceType();
  const [deniedFor, setDeniedFor] = useState(null);
  const key = `${user?.id}:${device}:${user?.permissions?.join(",")}`;
  useEffect(() => {
    const denied = (event) => {
      if (!event.detail?.device || event.detail.device === device) setDeniedFor(key);
    };
    // The guard handles this specific authorization error centrally, including
    // concurrent requests from a page that has just been unmounted.
    const handledDenial = (event) => {
      if (event.reason?.response?.data?.code === "MOBILE_ACCESS_DENIED") event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handledDenial);
    window.addEventListener("device:denied", denied);
    return () => { window.removeEventListener("device:denied", denied); window.removeEventListener("unhandledrejection", handledDenial); };
  }, [key, device]);
  const blocked = Boolean(user && (!canAccessDevice(user, device) || deniedFor === key));
  return <DeviceAccessContext.Provider value={{ device, blocked }}>{children}</DeviceAccessContext.Provider>;
}
