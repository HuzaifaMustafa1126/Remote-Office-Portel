import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import useAuth from "../hooks/useAuth";
import { errorMessage } from "../utils/helpers";
export default function LoginPage() {
  const { user, signIn, sessionNotice, clearSessionNotice } = useAuth(),
    [form, setForm] = useState({ email: "", password: "" }),
    [show, setShow] = useState(false),
    [remember, setRemember] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const nav = useNavigate(),
    loc = useLocation();
  if (user) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(form, remember);
      nav(loc.state?.from?.pathname || "/", { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-2">
      <section className="hidden bg-sidebar p-16 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground text-xl font-black">
            A
          </div>
          <b className="text-xl">Abdali Marketing Portel</b>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold tracking-widest text-sidebar-muted">
            ONE SECURE WORKSPACE
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight">
            Your people, roles, and operations—beautifully organized.
          </h1>
          <p className="mt-5 max-w-lg text-sidebar-muted">
            A focused foundation for managing your remote team securely and
            efficiently.
          </p>
        </div>
        <p className="text-sm text-sidebar-muted">
          Protected by role-based access control
        </p>
      </section>
      <section className="grid place-items-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground text-xl font-black">
              A
            </div>
            <b className="text-lg">Abdali Marketing Portel</b>
          </div>
          <LockKeyhole className="mb-5 text-primary-text" />
          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue to your workspace.
          </p>
          {sessionNotice && (
            <div
              role="status"
              className="notification-toast fixed right-5 top-5 z-50 max-w-sm rounded-2xl border border-primary-border bg-surface p-4 text-sm text-foreground shadow-xl"
            >
              <b className="block text-primary-text">Session ended</b>
              {sessionNotice}
              <button
                onClick={clearSessionNotice}
                className="ml-2 font-bold text-primary-text"
              >
                Dismiss
              </button>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger"
            >
              {error}
            </div>
          )}
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <Input
              autoComplete="email"
              required
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="relative">
              <Input
                autoComplete="current-password"
                required
                label="Password"
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                aria-label="Show password"
                className="absolute right-3 top-9 text-muted-foreground"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{" "}
              Remember me
            </label>
            <Button className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
