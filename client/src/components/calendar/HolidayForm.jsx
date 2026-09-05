import { useEffect, useState } from "react";
import Button from "../common/Button";
export default function HolidayForm({ entry, onSubmit, busy }) {
  const [form, setForm] = useState({
    title: "",
    dayType: "PUBLIC_HOLIDAY",
    startDate: "",
    endDate: "",
    description: "",
  });
  useEffect(() => {
    if (entry)
      setForm({
        title: entry.title,
        dayType: entry.dayType,
        startDate: entry.calendarDate,
        endDate: entry.calendarDate,
        description: entry.description || "",
      });
  }, [entry]);
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <label className="text-sm font-semibold sm:col-span-2">
        Title
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border p-2.5 font-normal"
        />
      </label>
      <label className="text-sm font-semibold">
        Type
        <select
          value={form.dayType}
          onChange={(e) => set("dayType", e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border p-2.5 font-normal"
        >
          <option value="PUBLIC_HOLIDAY">Public Holiday</option>
          <option value="COMPANY_HOLIDAY">Company Holiday</option>
          <option value="SPECIAL_OFF_DAY">Special Off Day</option>
          <option value="WEEKLY_OFF">Weekly Off</option>
          <option value="WORKING_DAY">Working Day Override</option>
        </select>
      </label>
      <span />
      <label className="text-sm font-semibold">
        From
        <input
          required
          type="date"
          value={form.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border p-2.5 font-normal"
        />
      </label>
      <label className="text-sm font-semibold">
        To
        <input
          required
          disabled={Boolean(entry)}
          min={form.startDate}
          type="date"
          value={form.endDate}
          onChange={(e) => set("endDate", e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border p-2.5 font-normal"
        />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Description
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="mt-1.5 w-full resize-none rounded-xl border border-border p-2.5 font-normal"
        />
      </label>
      <div className="sm:col-span-2">
        <Button disabled={busy}>
          {busy ? "Saving…" : entry ? "Update Calendar Day" : "Add to Calendar"}
        </Button>
      </div>
    </form>
  );
}
