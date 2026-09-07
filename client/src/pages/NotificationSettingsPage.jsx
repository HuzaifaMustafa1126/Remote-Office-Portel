import { useEffect, useState } from "react";
import Button from "../components/common/Button";
import useNotifications from "../hooks/useNotifications";
const rows = [
  ["Notification sound", "soundEnabled"],
  ["Task notifications", "taskEnabled"],
  ["Leave notifications", "leaveEnabled"],
  ["Break notifications", "breakEnabled"],
  ["Attendance notifications", "attendanceEnabled"],
  ["Announcements", "announcementEnabled"],
];
export default function NotificationSettingsPage() {
  const { preferences, savePreferences } = useNotifications();
  const [form, setForm] = useState(null),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false), [error,setError]=useState("");
  useEffect(() => {
    if (preferences)
      setForm(
        Object.fromEntries(
          Object.entries(preferences).map(([key, value]) => [key, Boolean(value)]),
        ),
      );
  }, [preferences]);
  if (!form)
    return (
      <p className="text-sm text-muted-foreground">Loading notification settings…</p>
    );
  const permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  const toggle = async (key) => {
    const next = !form[key];
    if (key === "desktopEnabled" && next && "Notification" in window) {
      if (Notification.permission === "denied") return;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }
    setForm({ ...form, [key]: next });
  };
  const save = async () => {
    setSaving(true);
    setError(""); setSaved(false);
    try {
      await savePreferences(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save notification settings.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which alerts may play a sound on this account.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-sm font-medium">Desktop notifications</p>
              <p className={`mt-1 text-xs ${permission === "denied" ? "text-danger" : "text-muted-foreground"}`}>
                {permission === "granted" ? "Enabled — browser permission granted." : permission === "denied" ? "Blocked — enable notifications in your browser settings." : permission === "unsupported" ? "Not supported by this browser." : "Not enabled — use the switch to ask this browser once."}
              </p>
              {permission === "denied" && <p className="mt-1 text-xs text-muted-foreground">The portal will keep using in-app alerts.</p>}
            </div>
            <button role="switch" aria-label="Desktop notifications" aria-checked={form.desktopEnabled} onClick={()=>toggle("desktopEnabled")} disabled={permission === "denied" || permission === "unsupported"} className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.desktopEnabled ? "bg-primary" : "bg-muted-foreground"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-surface transition ${form.desktopEnabled ? "left-6" : "left-1"}`}/></button>
          </div>
        </div>
        {rows.map(([label, key]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0"
          >
            <span className="text-sm font-medium">{label}</span>
            <button
              role="switch"
              aria-checked={form[key]}
              onClick={() => toggle(key)} disabled={key === "desktopEnabled" && permission === "denied"}
              className={`relative h-6 w-11 rounded-full transition ${form[key] ? "bg-primary" : "bg-muted-foreground"}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-surface transition ${form[key] ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        {saved && (
          <span className="text-sm text-success">Settings saved.</span>
        )}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}
