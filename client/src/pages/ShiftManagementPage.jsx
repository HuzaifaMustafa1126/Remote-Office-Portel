import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import * as api from "../services/shift.service";
import { errorMessage } from "../utils/helpers";
const empty = {
  name: "",
  startTime: "18:00",
  endTime: "03:00",
  requiredWorkMinutes: 480,
  breakAllowanceMinutes: 60,
  graceMinutes: 15,
};
const fmt = (n) => `${Math.floor(n / 60)}h ${n % 60}m`;
export default function ShiftManagementPage() {
  const [rows, setRows] = useState([]),
    [form, setForm] = useState(empty),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  const load = () => api.listShifts().then(setRows);
  useEffect(() => {
    load();
  }, []);
  const edit = (x) => {
    setEditing(x);
    setForm({
      name: x.name,
      startTime: x.startTime,
      endTime: x.endTime,
      requiredWorkMinutes: x.requiredWorkMinutes,
      breakAllowanceMinutes: x.breakAllowanceMinutes,
      graceMinutes: x.graceMinutes,
    });
    setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      editing
        ? await api.updateShift(editing.id, form)
        : await api.createShift(form);
      setOpen(false);
      await load();
    } catch (x) {
      setError(errorMessage(x));
    }
  };
  return (
    <>
      <PageHeader
        title="Shift Templates"
        description="Reusable effective-dated employee schedules."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setOpen(true);
            }}
          >
            Create Shift
          </Button>
        }
      />
      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              {[
                "Shift",
                "Schedule",
                "Span",
                "Required",
                "Break",
                "Grace",
                "Assigned",
                "Status",
                "Actions",
              ].map((x) => (
                <th className="px-4 py-3" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((x) => (
              <tr key={x.id}>
                <td className="px-4 py-3 font-semibold">{x.name}</td>
                <td className="px-4 py-3">
                  {x.startTime} → {x.endTime}
                </td>
                <td className="px-4 py-3">{fmt(x.shiftSpanMinutes)}</td>
                <td className="px-4 py-3">{fmt(x.requiredWorkMinutes)}</td>
                <td className="px-4 py-3">{fmt(x.breakAllowanceMinutes)}</td>
                <td className="px-4 py-3">{x.graceMinutes}m</td>
                <td className="px-4 py-3">
                  <span
                    title={x.assignedEmployeeNames || "No active assignments"}
                    className="font-semibold text-indigo-600"
                  >
                    {x.assignedEmployees}
                  </span>
                </td>
                <td className="px-4 py-3">{x.status}</td>
                <td className="px-4 py-3">
                  <button
                    className="font-semibold text-indigo-600"
                    onClick={() => edit(x)}
                  >
                    Edit
                  </button>
                  {x.status === "ACTIVE" && (
                    <button
                      className="ml-3 text-red-600"
                      onClick={async () => {
                        await api.deactivateShift(x.id);
                        load();
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Modal
        open={open}
        title={editing ? "Edit Shift" : "Create Shift"}
        onClose={() => setOpen(false)}
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <Input
            label="Shift Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Grace Minutes"
            type="number"
            min="0"
            required
            value={form.graceMinutes}
            onChange={(e) =>
              setForm({ ...form, graceMinutes: Number(e.target.value) })
            }
          />
          <Input
            label="Start Time"
            type="time"
            required
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
          <Input
            label="End Time"
            type="time"
            required
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
          <Input
            label="Required Work Minutes"
            type="number"
            required
            value={form.requiredWorkMinutes}
            onChange={(e) =>
              setForm({ ...form, requiredWorkMinutes: Number(e.target.value) })
            }
          />
          <Input
            label="Break Allowance Minutes"
            type="number"
            required
            value={form.breakAllowanceMinutes}
            onChange={(e) =>
              setForm({
                ...form,
                breakAllowanceMinutes: Number(e.target.value),
              })
            }
          />
          {error && (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button>Save Shift</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
