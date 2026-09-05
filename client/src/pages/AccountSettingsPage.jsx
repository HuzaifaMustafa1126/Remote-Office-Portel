import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Button from "../components/common/Button";
import PasswordInput from "../components/common/PasswordInput";
import useAuth from "../hooks/useAuth";
import * as auth from "../services/auth.service";
import { errorMessage } from "../utils/helpers";

export default function AccountSettingsPage() {
  const { user, refresh } = useAuth();
  const forced = Boolean(user?.mustChangePassword);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(""), [done, setDone] = useState(false);
  if (done) return <Navigate to="/" replace />;
  const change = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    if (form.newPassword.length < 8) { setNotice("Password must contain at least 8 characters."); setBusy(false); return; }
    if (form.newPassword !== form.confirmPassword) { setNotice("Passwords do not match."); setBusy(false); return; }
    try { const r = await auth.changePassword(form); setNotice(r.message); await refresh(); if (forced) setDone(true); setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    catch (err) { setNotice(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Account Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">{forced ? "You must create a new password before continuing." : "Manage your profile and account security."}</p>
      {!forced && <Link to="/settings/appearance" className="mt-5 inline-flex rounded-xl border border-border bg-surface px-4 py-3 font-semibold text-primary-text">Appearance →</Link>}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-bold">Change Password</h2>
        {notice && <div role="status" className={`mt-4 rounded-xl p-3 text-sm ${notice.includes("successfully") ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{notice}</div>}
        <form className="mt-5 space-y-4" onSubmit={submit}>
          {!forced && <PasswordInput required autoComplete="current-password" label="Current Password *" value={form.currentPassword} onChange={change("currentPassword")} />}
          <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" label="New Password *" value={form.newPassword} onChange={change("newPassword")} />
          <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" label="Confirm New Password *" value={form.confirmPassword} onChange={change("confirmPassword")} />
          <Button disabled={busy}>{busy ? "Saving…" : "Save Password"}</Button>
        </form>
      </section>
    </div>
  );
}
