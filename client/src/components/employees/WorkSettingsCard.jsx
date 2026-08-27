import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import {
  getWorkSettings,
  saveWorkSettings,
} from "../../services/employee.service";
import { errorMessage, formatDate } from "../../utils/helpers";

const minutes = (value) =>
  `${Math.floor(Number(value || 0) / 60)}h ${Number(value || 0) % 60}m`;
const displayTime = (value) =>
  value
    ? new Date(`2000-01-01T${value}`).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const blank = {
  shiftId: "",
  monthlySalary: "",
  salaryDivisor: 30,
  effectiveFrom: new Date().toISOString().slice(0, 10),
};
export default function WorkSettingsCard({
  employeeId,
  canEdit,
  initialOpen = false,
}) {
  const [data, setData] = useState(null),
    [open, setOpen] = useState(false),
    [form, setForm] = useState(blank),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = () =>
    getWorkSettings(employeeId).then((value) => {
      setData(value);
      if (initialOpen && canEdit) {
        const w = value.work,
          s = value.salary;
        setForm({
          shiftId: w?.shiftId || value.shifts?.[0]?.id || "",
          monthlySalary: s?.monthlySalary || "",
          salaryDivisor: s?.salaryDivisor || 30,
          effectiveFrom: new Date().toISOString().slice(0, 10),
        });
        setOpen(true);
      }
    });
  useEffect(() => {
    load();
  }, [employeeId]);
  const edit = () => {
    const w = data?.work,
      s = data?.salary;
    setForm({
      shiftId: w?.shiftId || data?.shifts?.[0]?.id || "",
      monthlySalary: s?.monthlySalary || "",
      salaryDivisor: s?.salaryDivisor || 30,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = await saveWorkSettings(employeeId, {
        shiftId: Number(form.shiftId),
        monthlySalary: Number(form.monthlySalary),
        salaryDivisor: Number(form.salaryDivisor),
        effectiveFrom: form.effectiveFrom,
      });
      setData(saved);
      setOpen(false);
    } catch (x) {
      setError(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };
  const w = data?.work,
    s = data?.salary;
  const selected = data?.shifts?.find(
    (x) => Number(x.id) === Number(form.shiftId),
  );
  return (
    <>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Work & Salary Settings
            </p>
            <h2 className="mt-1 font-bold">Current configuration</h2>
          </div>
          {canEdit && (
            <Button variant="secondary" onClick={edit}>
              {w ? "Edit Work Settings" : "Add Work Settings"}
            </Button>
          )}
        </div>
        {w ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Shift", w.name],
              [
                "Schedule",
                `${displayTime(w.clockInTime)} → ${displayTime(w.clockOutTime)}`,
              ],
              ["Grace", `${w.graceMinutes} min`],
              ["Required work", minutes(w.requiredWorkMinutes)],
              ["Break allowance", minutes(w.breakAllowanceMinutes)],
              [
                "Monthly salary",
                s
                  ? `Rs. ${Number(s.monthlySalary).toLocaleString("en-PK")}`
                  : "—",
              ],
              ["Salary divisor", s?.salaryDivisor || "—"],
              ["Effective from", formatDate(w.effectiveFrom)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  {k}
                </p>
                <p className="mt-1 font-medium">{v}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No work schedule has been assigned yet.
          </p>
        )}
      </section>
      <Modal
        open={open}
        title="Employee Work & Salary Settings"
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit} className="space-y-6">
          <div>
            <p className="mb-4 font-semibold">{data?.employee?.name}</p>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Work Schedule
            </h3>
            <select
              required
              value={form.shiftId}
              onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5"
            >
              <option value="">Select a shift</option>
              {data?.shifts?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · {x.startTime} → {x.endTime}
                </option>
              ))}
            </select>
            {selected && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                  <small className="text-slate-400">Schedule</small>
                  <p className="font-semibold">
                    {displayTime(selected.startTime)} →{" "}
                    {displayTime(selected.endTime)}
                  </p>
                </div>
                <div>
                  <small className="text-slate-400">Required</small>
                  <p className="font-semibold">
                    {minutes(selected.requiredWorkMinutes)}
                  </p>
                </div>
                <div>
                  <small className="text-slate-400">Break Allowance</small>
                  <p className="font-semibold">
                    {minutes(selected.breakAllowanceMinutes)}
                  </p>
                </div>
                <div>
                  <small className="text-slate-400">Grace</small>
                  <p className="font-semibold">{selected.graceMinutes}m</p>
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Salary
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Monthly Salary (PKR)"
                type="number"
                min="1"
                step="0.01"
                required
                value={form.monthlySalary}
                onChange={(e) =>
                  setForm({ ...form, monthlySalary: e.target.value })
                }
              />
              <Input
                label="Salary Divisor"
                type="number"
                min="1"
                max="366"
                required
                value={form.salaryDivisor}
                onChange={(e) =>
                  setForm({ ...form, salaryDivisor: e.target.value })
                }
              />
              <Input
                label="Effective From"
                type="date"
                required
                value={form.effectiveFrom}
                onChange={(e) =>
                  setForm({ ...form, effectiveFrom: e.target.value })
                }
              />
            </div>
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy}>
              {busy ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
