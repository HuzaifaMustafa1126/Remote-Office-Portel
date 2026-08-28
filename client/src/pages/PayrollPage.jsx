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
  const refresh=async()=>{await open(selected.id);await load()};
  const addAdjustment=async(item)=>{const title=window.prompt("Adjustment title");if(!title)return;const type=window.prompt("Type: ALLOWANCE, DEDUCTION, POSITIVE_ADJUSTMENT, or NEGATIVE_ADJUSTMENT","ALLOWANCE");if(!["ALLOWANCE","DEDUCTION","POSITIVE_ADJUSTMENT","NEGATIVE_ADJUSTMENT"].includes(type))return;const amount=Number(window.prompt("Amount (PKR)"));if(!(amount>0))return;const reason=window.prompt("Reason (required)");if(!reason?.trim())return;await api.addAdjustment(selected.id,{employeeId:item.employee_id,title,type,amount,reason});await refresh()};
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
                      {selected.status==="DRAFT"&&<td><button className="text-indigo-600" onClick={()=>addAdjustment(x)}>Add adjustment</button></td>}
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
    </>
  );
}
