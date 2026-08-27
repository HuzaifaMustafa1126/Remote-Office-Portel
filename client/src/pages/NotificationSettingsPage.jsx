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
      <p className="text-sm text-slate-500">Loading notification settings…</p>
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
        <p className="mt-1 text-sm text-slate-500">
          Choose which alerts may play a sound on this account.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {rows.map(([label, key]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-0"
          >
            <span className="text-sm font-medium">{label}</span>
            <button
              role="switch"
              aria-checked={form[key]}
              onClick={() => toggle(key)}
              className={`relative h-6 w-11 rounded-full transition ${form[key] ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${form[key] ? "left-6" : "left-1"}`}
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
          <span className="text-sm text-emerald-600">Settings saved.</span>
        )}
      </div>
    </div>
  );
}
