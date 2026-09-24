import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import * as api from "../services/dayEndReport.service";
import { errorMessage } from "../utils/helpers";

const Select = ({ label, value, options, onChange }) => <label className="block"><span className="text-sm font-bold">{label}</span><select className="mt-2 w-full rounded-xl border border-border bg-surface p-3" value={value} onChange={(e) => onChange(Number(e.target.value))}>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>;
const Toggle = ({ label, checked, onChange }) => <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-secondary p-4"><span className="font-bold">{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" /></label>;

export default function DayEndReportSettingsPage() {
  const [data, setData] = useState(null), [saving, setSaving] = useState(false), [notice, setNotice] = useState(""), [error, setError] = useState("");
  useEffect(() => { api.getFollowupSettings().then(setData).catch((e) => setError(errorMessage(e))); }, []);
  const set = (key, value) => setData((old) => ({ ...old, [key]: value }));
  const save = async () => { setSaving(true); setError(""); setNotice(""); try { const { updatedAt: _updatedAt, ...payload } = data; setData(await api.saveFollowupSettings(payload)); setNotice("Day-End Report settings saved."); } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); } };
  return <main className="mx-auto max-w-3xl"><PageHeader title="Day-End Report Settings" description="Configure shift-aware reminders and management follow-up safeguards."/><section className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
    {!data ? <div className="h-64 animate-pulse rounded-xl bg-surface-secondary"/> : <>
      <div className="rounded-xl border border-border p-4"><b>Day-End Report Required</b><p className="mt-1 text-sm text-muted-foreground">Always enabled. Employees must submit before normal Clock Out.</p></div>
      <Toggle label="Due-soon reminders" checked={data.reminderEnabled} onChange={(v) => set("reminderEnabled", v)}/>
      <Select label="Remind before shift end" value={data.reminderBeforeMinutes} options={[[15,"15 minutes"],[30,"30 minutes"],[45,"45 minutes"],[60,"1 hour"]]} onChange={(v) => set("reminderBeforeMinutes", v)}/>
      <Select label="Overdue grace period" value={data.overdueGraceMinutes} options={[[5,"5 minutes"],[10,"10 minutes"],[15,"15 minutes"],[30,"30 minutes"],[60,"1 hour"]]} onChange={(v) => set("overdueGraceMinutes", v)}/>
      <Toggle label="Overdue notifications" checked={data.overdueNotificationsEnabled} onChange={(v) => set("overdueNotificationsEnabled", v)}/>
      <Toggle label="Management review reminders" checked={data.reviewRemindersEnabled} onChange={(v) => set("reviewRemindersEnabled", v)}/>
      <Select label="Remind management after" value={data.reviewReminderAfterMinutes} options={[[240,"4 hours"],[480,"8 hours"],[720,"12 hours"],[1440,"24 hours"]]} onChange={(v) => set("reviewReminderAfterMinutes", v)}/>
      <Select label="Manual reminder cooldown" value={data.manualReminderCooldownMinutes} options={[[5,"5 minutes"],[10,"10 minutes"],[15,"15 minutes"],[30,"30 minutes"]]} onChange={(v) => set("manualReminderCooldownMinutes", v)}/>
      <Button disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Settings"}</Button>
    </>}{error && <p className="text-sm text-danger">{error}</p>}{notice && <p className="text-sm text-success">{notice}</p>}
  </section></main>;
}
