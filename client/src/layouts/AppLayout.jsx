import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationToasts from "../components/notifications/NotificationToasts";
import useAuth from "../hooks/useAuth";
export default function AppLayout() {
  const { connectionLost, user } = useAuth();
  const [open, setOpen] = useState(false),
    [refreshKey, setRefreshKey] = useState(0),
    [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
      localStorage.getItem(`remoteOffice.sidebarCollapsed.${user?.id || "account"}`) === "true",
    );
  const toggleSidebar = () =>
    setSidebarCollapsed((value) => {
      const next = !value;
      localStorage.setItem(
        `remoteOffice.sidebarCollapsed.${user?.id || "account"}`,
        String(next),
      );
      return next;
    });
  return (
    <div>
      <Sidebar open={open} onClose={() => setOpen(false)} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`min-h-screen min-w-0 transition-[padding] duration-300 ease-out ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {connectionLost && (
          <div
            role="status"
            className="bg-warning-soft px-4 py-2 text-center text-xs font-semibold text-warning"
          >
            Connection lost — attempting to reconnect
          </div>
        )}
        <NotificationToasts />
        <Header
          onMenu={() => setOpen(true)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <main className="portal-content min-w-0 p-3 sm:p-7">
          <Outlet key={refreshKey} />
        </main>
      </div>
    </div>
  );
}
