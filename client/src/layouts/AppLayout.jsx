import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationToasts from "../components/notifications/NotificationToasts";
export default function AppLayout() {
  const [open, setOpen] = useState(false),
    [refreshKey, setRefreshKey] = useState(0);
  return (
    <div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-h-screen min-w-0 lg:pl-64">
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
