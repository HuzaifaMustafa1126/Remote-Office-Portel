import { useEffect, useState } from "react";
import * as api from "../../services/scheduledWork.service";

const label = (row) =>
  row.reminderType === "AT_TIME"
    ? "At scheduled time"
    : `${row.value} ${row.unit.toLowerCase()} before`;

export default function ReminderManager({ work, onClose, onChanged }) {
  const [rows, setRows] = useState([]),
    [value, setValue] = useState(20),
    [unit, setUnit] = useState("MINUTES"),
    [error, setError] = useState("");
  const load = () =>
    api
      .listReminders(work.id)
      .then(setRows)
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load reminders."),
      );
  useEffect(load, [work.id]);
  const add = async () => {
    setError("");
    try {
      await api.addReminder(work.id, { value: Number(value), unit });
      await load();
      onChanged?.();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to add reminder.");
    }
  };
  const remove = async (id) => {
    setError("");
    try {
      await api.removeReminder(work.id, id);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to remove reminder.");
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/50 p-4">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Reminder History</h2>
            <p className="text-sm text-muted-foreground">{work.title}</p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        {error && (
          <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{label(row)}</p>
                <p className="text-xs text-muted-foreground">
                  {row.status}
                  {row.triggeredAt
                    ? ` · Sent ${new Date(row.triggeredAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}`
                    : ` · ${new Date(row.remindAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}`}
                </p>
              </div>
              {row.status === "PENDING" && row.reminderType !== "AT_TIME" && (
                <button
                  onClick={() => remove(row.id)}
                  className="text-xs font-semibold text-danger"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {work.status === "UPCOMING" && (
          <div className="mt-4 flex gap-2 border-t border-border pt-4">
            <input
              type="number"
              min="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24 rounded-lg border border-border bg-background px-3 py-2"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="MINUTES">Minutes before</option>
              <option value="HOURS">Hours before</option>
              <option value="DAYS">Days before</option>
            </select>
            <button
              onClick={add}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Add
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
