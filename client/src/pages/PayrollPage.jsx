import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import * as api from "../services/payroll.service";
const month = new Date().toISOString().slice(0, 7),
  money = (n) =>
    `Rs. ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
export default function PayrollPage() {
  const [runs, setRuns] = useState([]),
    [selected, setSelected] = useState(null),
    [label, setLabel] = useState(month),
    [busy, setBusy] = useState(false);
  const load = () => api.list().then(setRuns);
  useEffect(() => {
    load();
  }, []);
  const generate = async () => {
    setBusy(true);
    try {
      const x = await api.generate(label);
      setSelected(x);
      await load();
    } finally {
      setBusy(false);
    }
  };
  const open = async (id) => setSelected(await api.get(id));
  return (
    <>
      <PageHeader
        title="Payroll"
        description="5th-inclusive through next 5th-exclusive salary periods."
      />
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <input
          type="month"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-xl border px-3 py-2"
        />
        <Button disabled={busy} onClick={generate}>
          {busy ? "Generating…" : "Generate Draft"}
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-4 font-bold">Payroll Runs</div>
          {runs.map((x) => (
            <button
              key={x.id}
              onClick={() => open(x.id)}
              className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-slate-50"
            >
              <span>
                <b>{x.periodLabel}</b>
                <small className="block text-slate-400">
                  {x.periodStart} → {x.periodEnd}
                </small>
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                {x.status}
              </span>
            </button>
          ))}
        </section>
        <section className="overflow-x-auto rounded-2xl border bg-white">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <b>{selected.periodLabel} Payroll</b>
                  <small className="block text-slate-400">
                    {selected.periodStart} → {selected.periodEnd}
                  </small>
                </div>
                <div className="flex gap-2">
                  {selected.status === "DRAFT" && (
                    <Button
                      onClick={async () => {
                        await api.approve(selected.id);
                        open(selected.id);
                        load();
                      }}
                    >
                      Approve
                    </Button>
                  )}
                  {selected.status === "APPROVED" && (
                    <Button
                      onClick={async () => {
                        await api.markPaid(selected.id);
                        open(selected.id);
                        load();
                      }}
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr>
                    {[
                      "Employee",
                      "Base",
                      "Working",
                      "Present",
                      "Free Leave",
                      "Deductible",
                      "Absent",
                      "Leave Deduction",
                      "Absence Deduction",
                      "Net",
                    ].map((x) => (
                      <th className="px-3 py-3" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((x) => (
                    <tr className="border-t" key={x.id}>
                      <td className="px-3 py-3 font-semibold">
                        {x.employeeName}
                      </td>
                      <td>{money(x.base_salary)}</td>
                      <td>{x.working_days}</td>
                      <td>{x.present_days}</td>
                      <td>{x.free_leave_days}</td>
                      <td>{x.deductible_leave_days}</td>
                      <td>{x.absence_days}</td>
                      <td>{money(x.leave_deduction)}</td>
                      <td>{money(x.absence_deduction)}</td>
                      <td className="font-bold">{money(x.net_salary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="p-10 text-center text-slate-400">
              Select or generate a payroll run.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
