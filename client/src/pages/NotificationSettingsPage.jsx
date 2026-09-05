import { useEffect, useState } from "react";
import Button from "../components/common/Button";
import useNotifications from "../hooks/useNotifications";
const rows = [
  ["Notification sound", "soundEnabled"],
  ["Task notifications", "taskNotifications"],
  ["Leave notifications", "leaveNotifications"],
  ["Break notifications", "breakNotifications"],
  ["Attendance notifications", "attendanceNotifications"],
  ["Desktop notifications", "browserNotifications"],
];
export default function NotificationSettingsPage() {
  const { preferences, savePreferences } = useNotifications();
  const [form, setForm] = useState(null),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    if (preferences) setForm(preferences);
  }, [preferences]);
  if (!form)
    return (
      <p className="text-sm text-muted-foreground">Loading notification settings…</p>
    );
  const toggle = async (key) => {
    const next = !form[key];
    if (key === "browserNotifications" && next && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }
    setForm({ ...form, [key]: next });
  };
  const save = async () => {
    setSaving(true);
    try {
      await savePreferences(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
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
        {rows.map(([label, key]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0"
          >
            <span className="text-sm font-medium">{label}</span>
            <button
              role="switch"
              aria-checked={form[key]}
              onClick={() => toggle(key)}
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
      </div>
    </div>
  );
}
