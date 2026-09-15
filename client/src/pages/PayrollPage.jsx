import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Coins,
  Download,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import * as api from "../services/payroll.service";
import { errorMessage } from "../utils/helpers";

const currentMonth = new Date().toISOString().slice(0, 7);
const emptyAdjustment = { title: "", type: "ALLOWANCE", amount: "", reason: "" };
const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "—";
const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value))
    : "—";
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const totalDeductions = (item) =>
  Number(item.leave_deduction || 0) + Number(item.absence_deduction || 0) +
  Number(item.manual_deductions || 0) + Number(item.negative_adjustments || 0);
const itemStatus = (item, run, adjusted) => {
  if (run.status === "PAID") return "PAID";
  if (run.status === "APPROVED") return "APPROVED";
  if (item.calculation_status === "CALCULATION_MISMATCH") return "NEEDS REVIEW";
  if (adjusted) return "ADJUSTED";
  return "READY";
};
const badgeStyle = {
  DRAFT: "bg-primary-soft text-primary-text",
  READY: "bg-success-soft text-success",
  "NEEDS REVIEW": "bg-danger-soft text-danger",
  ADJUSTED: "bg-warning-soft text-warning",
  APPROVED: "bg-success-soft text-success",
  PAID: "bg-primary-soft text-primary-text",
};

function StatusBadge({ value }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeStyle[value] || "bg-surface-secondary text-muted-foreground"}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{value}</span>;
}

function Drawer({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return <><button aria-label="Close drawer" onClick={onClose} className="fixed inset-0 z-[60] bg-overlay/45" /><aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[490px] flex-col border-l border-border bg-surface shadow-2xl"><header className="flex items-start justify-between border-b border-border px-6 py-5"><div><h2 className="text-xl font-bold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><button aria-label="Close" onClick={onClose} className="rounded-lg p-2 hover:bg-surface-secondary"><X size={20} /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div></aside></>;
}

export default function PayrollPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]), [selected, setSelected] = useState(null), [label, setLabel] = useState(currentMonth);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [status, setStatus] = useState("ALL"), [flag, setFlag] = useState("");
  const [detail, setDetail] = useState(null), [activityOpen, setActivityOpen] = useState(false), [dayEmployee, setDayEmployee] = useState(null), [dayFilter, setDayFilter] = useState("ALL"), [dayPage, setDayPage] = useState(1);
  const [approveOpen, setApproveOpen] = useState(false), [adjustmentEmployee, setAdjustmentEmployee] = useState(null), [adjustment, setAdjustment] = useState(emptyAdjustment), [adjustmentError, setAdjustmentError] = useState(""), [savingAdjustment, setSavingAdjustment] = useState(false);

  const load = async (preferredId) => {
    setLoading(true); setError("");
    try {
      const list = await api.list(); setRuns(list);
      const id = preferredId || selected?.id || list[0]?.id;
      setSelected(id ? await api.get(id) : null);
    } catch (e) { setError(errorMessage(e) || "Unable to load payroll."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const open = async (id) => { setLoading(true); setError(""); try { setSelected(await api.get(id)); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } };
  const refresh = async () => load(selected?.id);
  const runAdjustments = selected?.adjustments || [];
  const adjustedEmployees = useMemo(() => new Set(runAdjustments.map((x) => Number(x.employeeId))), [runAdjustments]);
  const rows = useMemo(() => (selected?.items || []).filter((item) => {
    const adjusted = adjustedEmployees.has(Number(item.employee_id));
    const state = itemStatus(item, selected, adjusted);
    return item.employeeName.toLowerCase().includes(search.trim().toLowerCase()) && (status === "ALL" || state === status) && (!flag || (flag === "REVIEW" ? state === "NEEDS REVIEW" : adjusted));
  }), [selected, adjustedEmployees, search, status, flag]);
  const summary = useMemo(() => {
    const items = selected?.items || [];
    return { total: items.reduce((sum, x) => sum + Number(x.net_salary || 0), 0), deductions: items.reduce((sum, x) => sum + totalDeductions(x), 0), employees: items.length, attention: items.filter((x) => itemStatus(x, selected, adjustedEmployees.has(Number(x.employee_id))) === "NEEDS REVIEW").length };
  }, [selected, adjustedEmployees]);
  const selectedDays = useMemo(() => (selected?.days || []).filter((x) => Number(x.employeeId) === Number(dayEmployee?.employee_id)).filter((x) => dayFilter === "ALL" || (dayFilter === "LEAVE" ? x.classification.includes("LEAVE") : dayFilter === "ABSENT" ? x.classification.includes("ABSENCE") : dayFilter === "HOLIDAY" ? x.classification.includes("HOLIDAY") : x.classification === dayFilter)), [selected, dayEmployee, dayFilter]);
  const pageDays = selectedDays.slice((dayPage - 1) * 10, dayPage * 10);
  const generate = async () => { setBusy(true); setError(""); try { const result = await api.generate(label); await load(result.id); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };
  const recalculate = async () => { setBusy(true); try { await api.recalculate(selected.periodLabel); await refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };
  const approve = async () => { setBusy(true); try { await api.approve(selected.id); setApproveOpen(false); await refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };
  const reopen = async () => {
    const reason = window.prompt("Reason for reopening this approved payroll");
    if (!reason?.trim()) return;
    setBusy(true); try { await api.reopen(selected.id, reason.trim()); await refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  const markPaid = async () => {
    const paymentMethod = window.prompt("Payment method: BANK_TRANSFER, CASH, or OTHER", "BANK_TRANSFER");
    if (!["BANK_TRANSFER", "CASH", "OTHER"].includes(paymentMethod)) return;
    const paymentDate = window.prompt("Payment date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    const paymentReference = window.prompt("Payment reference");
    if (!paymentDate || !paymentReference?.trim()) return;
    const note = window.prompt("Optional payment note") || "";
    setBusy(true); try { await api.markPaid(selected.id, { paymentMethod, paymentDate, paymentReference: paymentReference.trim(), note }); await refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  const showAdjustment = (item) => { setAdjustmentEmployee(item); setAdjustment(emptyAdjustment); setAdjustmentError(""); };
  const addAdjustment = async (event) => { event.preventDefault(); setSavingAdjustment(true); setAdjustmentError(""); try { await api.addAdjustment(selected.id, { employeeId: adjustmentEmployee.employee_id, ...adjustment, amount: Number(adjustment.amount) }); setAdjustmentEmployee(null); await refresh(); } catch (e) { setAdjustmentError(errorMessage(e)); } finally { setSavingAdjustment(false); } };
  const exportPayroll = () => {
    if (!selected?.items?.length) return;
    const csv = [["Employee", "Base Salary", "Working Days", "Present Days", "Absent Days", "Deductions", "Net Salary"], ...selected.items.map((x) => [x.employeeName, x.base_salary, x.working_days, x.present_days, x.absence_days, totalDeductions(x), x.net_salary])].map((row) => row.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = `payroll-${selected.periodLabel}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  if (loading && !selected) return <PayrollSkeleton />;
  return <div className="space-y-4 pb-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-black tracking-tight">Payroll</h1><p className="mt-1 text-sm text-muted-foreground">5th-inclusive through next 5th-exclusive salary periods.</p></div><div className="flex flex-wrap gap-2"><label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"><CalendarDays size={17} /><input aria-label="Payroll month" type="month" value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent outline-none" /></label><Button disabled={busy} onClick={generate} className="flex items-center gap-2"><CalendarDays size={17} />{busy ? "Working…" : "Generate Payroll"}</Button><Button variant="secondary" disabled={!selected} onClick={() => setActivityOpen(true)} className="flex items-center gap-2"><Clock3 size={17} />Activity</Button></div></header>
    {error && <div className="flex items-center justify-between rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger"><span>{error || "Unable to load payroll."}</span><button className="font-bold" onClick={() => load()}>Try Again</button></div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Summary icon={Coins} tone="purple" label="Total Payroll" value={money(summary.total)} help="Total payable salary" />
      <Summary icon={Users} tone="blue" label="Employees" value={summary.employees} help="Included in this payroll" />
      <Summary icon={AlertCircle} tone="red" label="Total Deductions" value={money(summary.deductions)} help="Attendance + adjustments" />
      <Summary icon={AlertCircle} tone="orange" label="Needs Attention" value={`${summary.attention} ${summary.attention === 1 ? "Employee" : "Employees"}`} help="Review before approval" action={() => { setFlag("REVIEW"); document.getElementById("payroll-workspace")?.scrollIntoView({ behavior: "smooth" }); }} />
    </section>

    {selected ? <Workflow run={selected} busy={busy} onRecalculate={recalculate} onApprove={() => setApproveOpen(true)} onReopen={reopen} onMarkPaid={markPaid} /> : null}

    <section id="payroll-workspace" className="grid min-h-[460px] gap-3 xl:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-border bg-surface"><h2 className="border-b border-border px-4 py-4 font-bold">Payroll History</h2>{runs.length ? runs.map((run) => <button key={run.id} onClick={() => open(run.id)} className={`relative flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left transition hover:bg-surface-secondary ${run.id === selected?.id ? "bg-primary-soft/60 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary" : ""}`}><span className="min-w-0"><b className="block truncate text-sm">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${run.periodLabel}-01T00:00:00`))}</b><small className="mt-1 block whitespace-nowrap text-[11px] text-muted-foreground">{date(run.periodStart)} → {date(run.periodEnd)}</small></span><StatusBadge value={run.status} /></button>) : <p className="p-5 text-sm text-muted-foreground">No payroll history yet.</p>}</aside>
      <main className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
        {!selected ? <EmptyPayroll onGenerate={generate} busy={busy} /> : <><div className="flex flex-wrap gap-2 border-b border-border p-3"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border px-3"><Search size={17} className="text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="h-10 w-full bg-transparent text-sm outline-none" /></label><select aria-label="Filter payroll status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"><option value="ALL">All Statuses</option><option>READY</option><option>NEEDS REVIEW</option><option>ADJUSTED</option><option>APPROVED</option><option>PAID</option></select><button onClick={() => setFlag(flag === "REVIEW" ? "" : "REVIEW")} className={`rounded-xl border px-3 text-sm font-semibold ${flag === "REVIEW" ? "border-danger/30 bg-danger-soft text-danger" : "border-border"}`}><i className="mr-2 inline-block h-2 w-2 rounded-full bg-danger" />Needs Review</button><button onClick={() => setFlag(flag === "ADJUSTED" ? "" : "ADJUSTED")} className={`rounded-xl border px-3 text-sm font-semibold ${flag === "ADJUSTED" ? "border-warning/30 bg-warning-soft text-warning" : "border-border"}`}><i className="mr-2 inline-block h-2 w-2 rounded-full bg-warning" />Adjusted</button></div><PayrollRows rows={rows} run={selected} adjustedEmployees={adjustedEmployees} onDetail={setDetail} onAdjustment={showAdjustment} onDays={(item) => { setDayEmployee(item); setDayFilter("ALL"); setDayPage(1); }} /></>}
      </main>
    </section>

    <section className="grid gap-3 lg:grid-cols-[1.3fr_.8fr]"><div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-text"><WalletCards /></span><div className="min-w-0 flex-1"><h2 className="font-bold">Understanding Payroll</h2><p className="mt-1 text-sm text-muted-foreground">Payroll is calculated from attendance, approved leave, and company policies.</p></div><Button variant="secondary" onClick={() => navigate("/reports")}>Learn more</Button></div><div className="rounded-2xl border border-border bg-surface p-4"><h2 className="mb-3 font-bold">Quick Actions</h2><div className="grid gap-2 sm:grid-cols-3"><Quick icon={Download} label="Export Payroll" onClick={exportPayroll} disabled={!selected} /><Quick icon={Plus} label="Add Adjustment" onClick={() => rows[0] && showAdjustment(rows[0])} disabled={!rows.length || selected?.status !== "DRAFT"} /><Quick icon={BarChart3} label="View Reports" onClick={() => navigate("/reports")} /></div></div></section>

    <EmployeeDrawer item={detail} run={selected} adjustments={runAdjustments} onClose={() => setDetail(null)} onAdjustment={showAdjustment} onDays={(item) => { setDetail(null); setDayEmployee(item); }} />
    <ActivityDrawer open={activityOpen} run={selected} onClose={() => setActivityOpen(false)} />
    <DayDrawer item={dayEmployee} run={selected} rows={pageDays} filter={dayFilter} setFilter={(value) => { setDayFilter(value); setDayPage(1); }} page={dayPage} pages={Math.max(1, Math.ceil(selectedDays.length / 10))} setPage={setDayPage} onClose={() => setDayEmployee(null)} />
    <ApprovalModal open={approveOpen} run={selected} summary={summary} busy={busy} onClose={() => setApproveOpen(false)} onApprove={approve} />
    <Modal open={Boolean(adjustmentEmployee)} title="Add Payroll Adjustment" onClose={() => !savingAdjustment && setAdjustmentEmployee(null)}><form className="space-y-5" onSubmit={addAdjustment}><div className="rounded-xl bg-primary-soft px-4 py-3"><p className="text-xs font-bold uppercase tracking-wider text-primary-text">Employee</p><p className="mt-1 font-bold">{adjustmentEmployee?.employeeName}</p></div><Input label="Adjustment title" placeholder="Performance bonus" minLength="2" maxLength="150" required autoFocus value={adjustment.title} onChange={(e) => setAdjustment({ ...adjustment, title: e.target.value })} /><fieldset><legend className="mb-2 text-sm font-medium">Adjustment type</legend><div className="grid grid-cols-2 gap-2">{[["ALLOWANCE", "Bonus / Allowance"], ["DEDUCTION", "Deduction"], ["POSITIVE_ADJUSTMENT", "Positive Adjustment"], ["NEGATIVE_ADJUSTMENT", "Negative Adjustment"]].map(([value, text]) => <label key={value} className={`cursor-pointer rounded-xl border p-3 text-sm ${adjustment.type === value ? "border-primary bg-primary-soft text-primary-text" : "border-border"}`}><input type="radio" className="mr-2" value={value} checked={adjustment.type === value} onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })} />{text}</label>)}</div></fieldset><Input label="Amount (PKR)" type="number" min="0.01" max="100000000" step="0.01" required value={adjustment.amount} onChange={(e) => setAdjustment({ ...adjustment, amount: e.target.value })} /><label className="block"><span className="mb-1.5 block text-sm font-medium">Reason</span><textarea className="min-h-24 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 outline-none focus:border-primary" minLength="3" maxLength="500" required value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} /></label>{adjustmentError && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{adjustmentError}</p>}<div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="secondary" onClick={() => setAdjustmentEmployee(null)} disabled={savingAdjustment}>Cancel</Button><Button disabled={savingAdjustment}>{savingAdjustment ? "Adding…" : "Add Adjustment"}</Button></div></form></Modal>
  </div>;
}

function Summary({ icon: Icon, tone, label, value, help, action }) { const tones = { purple: "bg-primary-soft text-primary-text", blue: "bg-info-soft text-info", red: "bg-danger-soft text-danger", orange: "bg-warning-soft text-warning" }; const Tag = action ? "button" : "article"; return <Tag onClick={action} className={`flex min-h-[112px] w-full items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left shadow-sm ${action ? "transition hover:-translate-y-0.5 hover:shadow-md" : ""}`}><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${tones[tone]}`}><Icon size={26} /></span><span className="min-w-0 flex-1"><span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span><strong className="mt-1 block truncate text-xl font-black">{value}</strong><span className="mt-1 block text-xs text-muted-foreground">{help}</span></span>{action && <ChevronRight size={18} className="text-muted-foreground" />}</Tag>; }
function Workflow({ run, busy, onRecalculate, onApprove, onReopen, onMarkPaid }) { const approved = ["APPROVED", "PAID"].includes(run.status); return <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 xl:flex-row xl:items-center"><div className="grid flex-1 gap-4 md:grid-cols-3"><Step done title="Payroll Generated" help={dateTime(run.createdAt)} /><Step done={approved} number="2" title="Ready for Review" help="Review calculations and adjustments" /><Step done={approved} number="3" title="Approval" help="Approve to finalize" /></div><div className="flex flex-col gap-3 border-t border-border pt-4 xl:min-w-[430px] xl:flex-row xl:items-center xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"><div className="min-w-0 flex-1"><StatusBadge value={run.status} /><p className="mt-2 text-xs text-muted-foreground">{run.status === "DRAFT" ? "Payroll is in draft. Review and approve when ready." : run.status === "APPROVED" ? "Payroll has been approved." : "Payroll payment is recorded."}</p></div>{run.status === "DRAFT" && <div className="flex gap-2"><Button variant="secondary" disabled={busy} onClick={onRecalculate}>Recalculate</Button><Button disabled={busy} onClick={onApprove}>Approve Payroll</Button></div>}{run.status === "APPROVED" && <div className="flex gap-2"><Button variant="secondary" disabled={busy} onClick={onReopen}>Reopen</Button><Button disabled={busy} onClick={onMarkPaid}>Mark Paid</Button></div>}</div></section>; }
function Step({ done, number, title, help }) { return <div className="flex items-start gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-muted-foreground"}`}>{done ? <Check size={17} /> : number}</span><span><b className="block text-sm">{title}</b><small className="mt-1 block text-muted-foreground">{help}</small></span></div>; }
function PayrollRows({ rows, run, adjustedEmployees, onDetail, onAdjustment, onDays }) { if (!rows.length) return <p className="p-12 text-center text-sm text-muted-foreground">No employees match these filters.</p>; return <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[930px] text-left text-sm"><thead className="bg-surface-secondary text-xs text-muted-foreground"><tr>{["Employee", "Base Salary", "Attendance", "Deductions", "Net Salary", "Status", "Actions"].map((x) => <th key={x} className="px-4 py-3 font-bold">{x}</th>)}</tr></thead><tbody>{rows.map((item, index) => { const adjusted = adjustedEmployees.has(Number(item.employee_id)); const state = itemStatus(item, run, adjusted); const percent = Math.min(100, Math.round(100 * Number(item.present_days || 0) / Math.max(1, Number(item.working_days || 0)))); return <tr key={item.id} className="border-t border-border"><td className="px-4 py-3"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${["bg-primary-soft text-primary-text", "bg-info-soft text-info", "bg-success-soft text-success"][index % 3]}`}>{initials(item.employeeName)}</span><span><b className="block">{item.employeeName}</b><small className="text-muted-foreground">{item.roleName || item.employeeCode || "Employee"}</small></span></div></td><td className="px-4 py-3">{money(item.base_salary)}</td><td className="px-4 py-3"><b>{item.present_days} / {item.working_days} days</b><div className="my-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-surface-secondary"><i className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div><small className="text-muted-foreground">{item.absence_days} Absent · {Number(item.free_leave_days) + Number(item.deductible_leave_days)} Leave</small></td><td className="px-4 py-3"><span>{money(totalDeductions(item))}</span><button onClick={() => onDetail(item)} className="mt-1 block text-xs font-semibold text-primary-text">View breakdown</button></td><td className="px-4 py-3 font-bold text-success">{money(item.net_salary)}</td><td className="px-4 py-3"><StatusBadge value={state} /></td><td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={() => onDetail(item)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary-text hover:bg-primary-soft">View Details</button><button aria-label={`Actions for ${item.employeeName}`} onClick={() => run.status === "DRAFT" ? onAdjustment(item) : onDays(item)} className="rounded-lg p-2 hover:bg-surface-secondary"><MoreVertical size={18} /></button></div></td></tr>; })}</tbody></table></div><div className="grid gap-3 p-3 md:hidden">{rows.map((item) => <article key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">{initials(item.employeeName)}</span><span><b className="block text-sm">{item.employeeName}</b><small className="text-muted-foreground">{item.roleName || item.employeeCode || "Employee"}</small></span></div><StatusBadge value={itemStatus(item, run, adjustedEmployees.has(Number(item.employee_id)))} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Base Salary</dt><dd className="font-semibold">{money(item.base_salary)}</dd></div><div><dt className="text-xs text-muted-foreground">Net Salary</dt><dd className="font-bold text-success">{money(item.net_salary)}</dd></div><div><dt className="text-xs text-muted-foreground">Attendance</dt><dd>{item.present_days} / {item.working_days} days</dd></div><div><dt className="text-xs text-muted-foreground">Deductions</dt><dd>{money(totalDeductions(item))}</dd></div></dl><Button variant="secondary" className="mt-4 w-full" onClick={() => onDetail(item)}>View Details</Button></article>)}</div></>; }
function EmployeeDrawer({ item, run, adjustments, onClose, onAdjustment, onDays }) { const own = adjustments.filter((x) => Number(x.employeeId) === Number(item?.employee_id)); return <Drawer open={Boolean(item)} title={item?.employeeName} subtitle={`${item?.roleName || item?.employeeCode || "Employee"} · ${run?.periodLabel} Payroll`} onClose={onClose}>{item && <div className="space-y-5"><DetailBlock title="Salary Summary"><Line label="Base Salary" value={money(item.base_salary)} /><Line label="Gross Salary" value={money(item.gross_salary || item.base_salary)} /></DetailBlock><DetailBlock title="Attendance"><Line label="Working Days" value={item.working_days} /><Line label="Present Days" value={item.present_days} /><Line label="Approved Leave" value={Number(item.free_leave_days) + Number(item.deductible_leave_days)} /><Line label="Absent Days" value={item.absence_days} /></DetailBlock><DetailBlock title="Deductions"><Line label="Leave Deduction" value={`- ${money(item.leave_deduction)}`} /><Line label="Absence Deduction" value={`- ${money(item.absence_deduction)}`} />{own.map((x) => <Line key={x.id} label={x.title} value={`${["DEDUCTION", "NEGATIVE_ADJUSTMENT"].includes(x.type) ? "-" : "+"} ${money(x.amount)}`} />)}<div className="mt-4 flex items-center justify-between border-t border-border pt-4"><b>Net Salary</b><strong className="text-2xl text-success">{money(item.net_salary)}</strong></div></DetailBlock><div className="flex gap-2">{run.status === "DRAFT" && <Button className="flex-1" onClick={() => onAdjustment(item)}>Add Adjustment</Button>}<Button variant="secondary" className="flex-1" onClick={() => onDays(item)}>View Day Breakdown</Button></div></div>}</Drawer>; }
function DetailBlock({ title, children }) { return <section className="rounded-2xl border border-border p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3><div className="space-y-2.5">{children}</div></section>; }
function Line({ label, value }) { return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><b className="text-right">{value}</b></div>; }
function ActivityDrawer({ open, run, onClose }) { return <Drawer open={open} title="Payroll Activity" subtitle={run?.periodLabel} onClose={onClose}>{run?.activity?.length ? <div className="space-y-5">{[...run.activity].reverse().map((item) => <div key={item.id} className="relative border-l-2 border-primary-border pl-5 before:absolute before:-left-[6px] before:top-1 before:h-2.5 before:w-2.5 before:rounded-full before:bg-primary"><b className="text-sm">{item.description}</b><p className="mt-1 text-xs text-muted-foreground">{item.performedBy || "System"} · {dateTime(item.createdAt)}</p>{item.reason && <p className="mt-1 text-sm">{item.reason}</p>}</div>)}</div> : <p className="text-sm text-muted-foreground">No activity recorded.</p>}</Drawer>; }
function DayDrawer({ item, run, rows, filter, setFilter, page, pages, setPage, onClose }) { const filters = ["ALL", "PRESENT", "ABSENT", "LEAVE", "WEEKLY_OFF", "HOLIDAY"]; return <Drawer open={Boolean(item)} title={`${item?.employeeName || "Employee"} · Day Breakdown`} subtitle={run?.periodLabel} onClose={onClose}><div className="mb-4 flex flex-wrap gap-2">{filters.map((x) => <button key={x} onClick={() => setFilter(x)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === x ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-muted-foreground"}`}>{x.replace("_", " ")}</button>)}</div>{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-border p-3 text-sm"><div><b>{date(row.work_date)}</b><p className="mt-1 text-xs text-muted-foreground">{row.classification.replaceAll("_", " ")}</p></div><b className={Number(row.deduction_amount) ? "text-danger" : ""}>{Number(row.deduction_amount) ? `- ${money(row.deduction_amount)}` : "Rs. 0"}</b></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">No day records match this filter.</p>}<div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="font-semibold disabled:opacity-30">Previous</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="font-semibold disabled:opacity-30">Next</button></div></Drawer>; }
function ApprovalModal({ open, run, summary, busy, onClose, onApprove }) { return <Modal open={open} title={`Approve ${run?.periodLabel || "Payroll"}?`} onClose={onClose}><p className="text-sm text-muted-foreground">Please review the payroll summary before final approval.</p><div className="my-5 rounded-2xl bg-surface-secondary p-4"><Line label="Employees" value={summary.employees} /><Line label="Total Payroll" value={money(summary.total)} /><Line label="Total Deductions" value={money(summary.deductions)} /><Line label="Needs Attention" value={summary.attention} /></div>{summary.attention > 0 && <p className="mb-5 rounded-xl bg-warning-soft p-3 text-sm font-semibold text-warning">Some employees still need review.</p>}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} onClick={onApprove}>{busy ? "Approving…" : "Approve Payroll"}</Button></div></Modal>; }
function Quick({ icon: Icon, label, ...props }) { return <button {...props} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-bold transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"><Icon size={17} />{label}</button>; }
function EmptyPayroll({ onGenerate, busy }) { return <div className="grid min-h-[420px] place-items-center p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary-text"><WalletCards /></span><h2 className="mt-4 text-lg font-bold">No payroll generated for this period</h2><p className="mt-2 text-sm text-muted-foreground">Generate payroll to review employee salaries and deductions.</p><Button className="mt-5" onClick={onGenerate} disabled={busy}>Generate Payroll</Button></div></div>; }
function PayrollSkeleton() { return <div className="space-y-4 animate-pulse"><div className="h-16 rounded-2xl bg-surface-secondary" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[1,2,3,4].map((x) => <div key={x} className="h-28 rounded-2xl bg-surface-secondary" />)}</div><div className="h-24 rounded-2xl bg-surface-secondary" /><div className="h-[460px] rounded-2xl bg-surface-secondary" /></div>; }
