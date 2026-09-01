import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import * as api from "../services/payroll.service";
import { errorMessage } from "../utils/helpers";
const month = new Date().toISOString().slice(0, 7),
  emptyAdjustment = { title: "", type: "ALLOWANCE", amount: "", reason: "" },
  money = (n) =>
    `Rs. ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
export default function PayrollPage() {
  const [runs, setRuns] = useState([]),
    [selected, setSelected] = useState(null),
    [label, setLabel] = useState(month),
    [busy, setBusy] = useState(false),
    [adjustmentEmployee, setAdjustmentEmployee] = useState(null),
    [adjustment, setAdjustment] = useState(emptyAdjustment),
    [adjustmentError, setAdjustmentError] = useState(""),
    [savingAdjustment, setSavingAdjustment] = useState(false);
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
  const refresh=async()=>{await open(selected.id);await load()};
  const showAdjustment = (item) => {
    setAdjustmentEmployee(item);
    setAdjustment(emptyAdjustment);
    setAdjustmentError("");
  };
  const closeAdjustment = () => {
    if (!savingAdjustment) setAdjustmentEmployee(null);
  };
  const addAdjustment = async (event) => {
    event.preventDefault();
    setAdjustmentError("");
    setSavingAdjustment(true);
    try {
      await api.addAdjustment(selected.id, {
        employeeId: adjustmentEmployee.employee_id,
        ...adjustment,
        amount: Number(adjustment.amount),
      });
      setAdjustmentEmployee(null);
      await refresh();
    } catch (error) {
      setAdjustmentError(errorMessage(error));
    } finally {
      setSavingAdjustment(false);
    }
  };
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
                    <><Button variant="secondary" onClick={async()=>{await api.recalculate(selected.periodLabel);await refresh()}}>Recalculate</Button><Button onClick={async()=>{const total=selected.items.reduce((n,x)=>n+Number(x.net_salary),0);if(!window.confirm(`Approve ${selected.periodStart} → ${selected.periodEnd} payroll with net total ${money(total)}?`))return;await api.approve(selected.id);await refresh()}}>Approve Payroll</Button></>
                  )}
                  {selected.status === "APPROVED" && (
                    <><Button variant="secondary" onClick={async()=>{const reason=window.prompt("Reason for reopening this approved payroll");if(!reason?.trim())return;await api.reopen(selected.id,reason);await refresh()}}>Reopen</Button><Button onClick={async()=>{const paymentMethod=window.prompt("Payment method: BANK_TRANSFER, CASH, or OTHER","BANK_TRANSFER");if(!["BANK_TRANSFER","CASH","OTHER"].includes(paymentMethod))return;const paymentDate=window.prompt("Payment date (YYYY-MM-DD)",new Date().toISOString().slice(0,10));const paymentReference=window.prompt("Payment reference");if(!paymentDate||!paymentReference?.trim())return;const note=window.prompt("Optional payment note")||"";await api.markPaid(selected.id,{paymentMethod,paymentDate,paymentReference,note});await refresh()}}>Mark Paid</Button></>
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
                      ...(selected.status === "DRAFT" ? ["Actions"] : []),
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
                      {selected.status==="DRAFT"&&<td><button className="font-semibold text-indigo-600 hover:text-indigo-800" onClick={()=>showAdjustment(x)}>Add adjustment</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selected.reviewRequired?<p className="m-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Requires Review — underlying salary or operational data changed after approval.</p>:null}
              <div className="grid gap-5 border-t p-4 lg:grid-cols-2">
                <section><h3 className="mb-3 font-bold">Adjustments</h3>{selected.adjustments?.length?selected.adjustments.map(x=><div key={x.id} className="mb-2 rounded-xl bg-slate-50 p-3 text-sm"><b>{x.title}</b> · {x.type} · {money(x.amount)}<p className="text-slate-500">{x.reason} · {x.createdBy||"System"}</p>{selected.status==="DRAFT"&&<button className="mt-1 text-red-600" onClick={async()=>{if(confirm("Remove this adjustment?")){await api.removeAdjustment(selected.id,x.id);await refresh()}}}>Remove</button>}</div>):<p className="text-sm text-slate-400">No manual adjustments.</p>}</section>
                <section><h3 className="mb-3 font-bold">Payroll Activity</h3>{selected.activity?.length?selected.activity.map(x=><div key={x.id} className="mb-3 border-l-2 border-indigo-200 pl-3 text-sm"><b>{x.description}</b><p className="text-slate-400">{x.performedBy||"System"} · {new Date(x.createdAt).toLocaleString()}</p>{x.reason&&<p>Reason: {x.reason}</p>}</div>):<p className="text-sm text-slate-400">No activity recorded.</p>}</section>
              </div>
              <details className="border-t p-4"><summary className="cursor-pointer font-bold">Day Breakdown ({selected.days?.length||0})</summary><div className="mt-3 max-h-96 overflow-auto"><table className="w-full text-sm"><thead><tr><th>Employee</th><th>Work Date</th><th>Classification</th><th>Deduction</th><th>Source</th></tr></thead><tbody>{selected.days?.map(x=><tr className="border-t" key={x.id}><td>{selected.items.find(i=>i.employee_id===x.employeeId)?.employeeName}</td><td>{x.work_date}</td><td>{x.classification}</td><td>{money(x.deduction_amount)}</td><td>{x.attendance_id?`Attendance #${x.attendance_id}`:x.leave_day_id?`Leave #${x.leave_day_id}`:x.calendar_day_id?`Calendar #${x.calendar_day_id}`:"Policy"}</td></tr>)}</tbody></table></div></details>
            </>
          ) : (
            <p className="p-10 text-center text-slate-400">
              Select or generate a payroll run.
            </p>
          )}
        </section>
      </div>
      <Modal
        open={Boolean(adjustmentEmployee)}
        title="Add Payroll Adjustment"
        onClose={closeAdjustment}
      >
        <form className="space-y-5" onSubmit={addAdjustment}>
          <div className="rounded-xl bg-indigo-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Employee</p>
            <p className="mt-1 font-bold text-slate-900">{adjustmentEmployee?.employeeName}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Adjustment title"
              placeholder="e.g. Performance bonus"
              minLength="2"
              maxLength="150"
              required
              autoFocus
              value={adjustment.title}
              onChange={(e) => setAdjustment({ ...adjustment, title: e.target.value })}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Adjustment type</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
                value={adjustment.type}
                onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
              >
                <option value="ALLOWANCE">Allowance</option>
                <option value="DEDUCTION">Deduction</option>
                <option value="POSITIVE_ADJUSTMENT">Positive adjustment</option>
                <option value="NEGATIVE_ADJUSTMENT">Negative adjustment</option>
              </select>
            </label>
            <Input
              label="Amount (PKR)"
              type="number"
              placeholder="0.00"
              min="0.01"
              max="100000000"
              step="0.01"
              required
              value={adjustment.amount}
              onChange={(e) => setAdjustment({ ...adjustment, amount: e.target.value })}
            />
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Reason</span>
              <textarea
                className="min-h-28 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
                placeholder="Explain why this adjustment is being added"
                minLength="3"
                maxLength="500"
                required
                value={adjustment.reason}
                onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
              />
            </label>
          </div>
          {adjustmentError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{adjustmentError}</p>}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="secondary" disabled={savingAdjustment} onClick={closeAdjustment}>Cancel</Button>
            <Button type="submit" disabled={savingAdjustment}>{savingAdjustment ? "Adding…" : "Add Adjustment"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
