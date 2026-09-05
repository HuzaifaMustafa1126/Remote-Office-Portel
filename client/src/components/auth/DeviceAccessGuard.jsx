import { Laptop, LogOut } from "lucide-react";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";
import { useDeviceAccess } from "../../context/DeviceAccessContext";
import Button from "../common/Button";
export default function DeviceAccessGuard({ children }) {
  const { blocked } = useDeviceAccess();
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!blocked) return children;
  return <main className="grid min-h-dvh place-items-center bg-background p-4">
    <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-center shadow-xl sm:p-10" aria-labelledby="mobile-access-title">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary-text"><Laptop size={32} aria-hidden="true" /></div>
      <h1 id="mobile-access-title" className="text-2xl font-bold">Desktop Access Required</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Your account is not permitted to use the Remote Office Portal from a mobile phone. Please open the portal on a laptop or desktop computer to continue.</p>
      <p className="mt-3 text-sm text-muted-foreground">Mobile access is available only to authorized administrators.</p>
      {user?.name && <p className="mt-6 break-words text-sm">Signed in as <strong>{user.name}</strong></p>}
      <Button className="mt-6 w-full" disabled={busy} onClick={async () => { setBusy(true); try { await logout(); } finally { setBusy(false); } }}><span className="flex items-center justify-center gap-2"><LogOut size={18} />{busy ? "Signing out…" : "Sign Out"}</span></Button>
    </section>
  </main>;
}
