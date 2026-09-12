import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import { getTaskSettings, saveTaskSettings } from "../services/task.service";

const options = [3, 5, 10, 15];

export default function TaskSettingsPage() {
  const [settings, setSettings] = useState(null),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    getTaskSettings()
      .then(setSettings)
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load task settings."),
      );
  }, []);
  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await saveTaskSettings(settings);
      setSettings(saved);
      setNotice("Task settings saved.");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save task settings.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="mx-auto max-w-3xl">
      <PageHeader
        title="Task Management Settings"
        description="Configure task workflow safeguards for your company."
      />
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <label className="block text-sm font-bold" htmlFor="offline-timeout">
          Offline Auto-Pause Timeout
        </label>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Automatically pause active task work when an employee is no longer connected to the portal for this amount of time.
        </p>
        {settings ? (
          <select
            id="offline-timeout"
            className="input mt-4 max-w-xs"
            value={settings.offlineTimeoutMinutes}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                offlineTimeoutMinutes: Number(event.target.value),
              }))
            }
          >
            {options.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        ) : error ? null : (
          <div className="mt-4 h-11 max-w-xs animate-pulse rounded-xl bg-surface-secondary" />
        )}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-success">{notice}</p>}
        <button
          disabled={!settings || saving}
          onClick={save}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </section>
    </main>
  );
}
