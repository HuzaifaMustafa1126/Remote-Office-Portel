import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
export default function AppLayout() {
  const [open, setOpen] = useState(false),
    [refreshKey, setRefreshKey] = useState(0);
  return (
    <div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-h-screen lg:pl-64">
        <Header
          onMenu={() => setOpen(true)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <main className="p-4 sm:p-7">
          <Outlet key={refreshKey} />
        </main>
      </div>
    </div>
  );
}
