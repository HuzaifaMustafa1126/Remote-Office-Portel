import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Search,
  Users,
  Clock3,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import * as api from "../services/dayEndReport.service";
import { errorMessage } from "../utils/helpers";
import ReportDiscussion from "../components/dayEndReport/ReportDiscussion";
import ReportActivity from "../components/dayEndReport/ReportActivity";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
const duration = (m) =>
  `${Math.floor(Number(m || 0) / 60)}h ${Number(m || 0) % 60}m`;
const stamp = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(v))
    : "—";
const blocker = (v) =>
  ({
    NONE: "No Blocker",
    WAITING_ADMIN: "Waiting for CEO/Admin",
    WAITING_CLIENT: "Waiting for Client",
    WAITING_TEAM: "Waiting for Team Member",
    TECHNICAL: "Technical Issue",
    MISSING_ASSETS: "Missing Information / Assets",
    OTHER: "Other",
  })[v] || v;
export default function DayEndReportsPage() {
  const [date, setDate] = useState(() => new URLSearchParams(window.location.search).get("date") || today()),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [blockerFilter, setBlockerFilter] = useState("ALL"),
    [attention, setAttention] = useState(() => new URLSearchParams(window.location.search).get("attention") === "1"),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [detail, setDetail] = useState(null),
    [confirm, setConfirm] = useState(false),
    [reviewing, setReviewing] = useState(false),
    [history, setHistory] = useState(null),
    [historyEmployee, setHistoryEmployee] = useState(null),
    [reminderTarget, setReminderTarget] = useState(null),
    [sendingReminder, setSendingReminder] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .list({ date, search, status, blocker: blockerFilter, attention: attention ? "1" : "0", page, limit: 20 })
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [date, search, status, blockerFilter, attention, page]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  const open = async (id) => {
    setError("");
    try {
      setDetail(await api.get(id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("report");
    if (id) open(id);
  }, []);
  const review = async () => {
    setReviewing(true);
    try {
      setDetail(await api.review(detail.id));
      setConfirm(false);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setReviewing(false);
    }
  };
  const openHistory = async (item) => {
    setHistoryEmployee(item);
    try { setHistory(await api.employeeHistory(item.employeeId, { month: date.slice(0, 7), page: 1, limit: 50 })); }
    catch (e) { setError(errorMessage(e)); }
  };
  const sendReminder = async () => {
    setSendingReminder(true); setError("");
    try { await api.sendReminder(reminderTarget.attendanceId); setReminderTarget(null); await load(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setSendingReminder(false); }
  };
  const s = data?.summary;
  return (
    <main>
      <PageHeader
        title="Day-End Reports"
        description="Monitor team work, pending items, blockers and employee priorities."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          [Users, "Reports", s ? `${s.submitted} / ${s.expected}` : "—"],
          [ClipboardCheck, "Needs Review", s?.needsReview ?? "—"],
          [CheckCircle2, "Reviewed", s?.reviewed ?? "—"],
          [AlertTriangle, "Blockers", s?.blockers ?? "—"],
          [Clock3, "Overdue", s?.overdue ?? "—"],
        ].map(([Icon, label, value]) => (
          <article
            key={label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
          >
            <Icon size={18} className="text-primary-text" />
            <p className="mt-3 text-2xl font-black">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </article>
        ))}
      </div>
      <section className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-border bg-surface p-4">
        <Button variant={attention ? "primary" : "secondary"} onClick={() => { setAttention((v) => !v); setPage(1); }}>Needs Attention</Button>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-surface px-3"
        />
        <label className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-border px-3">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search employee"
            className="h-10 w-full bg-transparent outline-none"
          />
        </label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-surface px-3"
        >
          <option value="ALL">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="NOT_SUBMITTED">Not Submitted</option>
        </select>
        <select
          value={blockerFilter}
          onChange={(e) => setBlockerFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3"
        >
          <option value="ALL">All blockers</option>
          <option value="HAS_BLOCKER">Has Blocker</option>
          <option value="NO_BLOCKER">No Blocker</option>
          <option value="WAITING_ADMIN">Waiting for CEO/Admin</option>
          <option value="WAITING_CLIENT">Waiting for Client</option>
          <option value="WAITING_TEAM">Waiting for Team Member</option>
          <option value="TECHNICAL">Technical Issue</option>
          <option value="MISSING_ASSETS">Missing Information</option>
          <option value="OTHER">Other</option>
        </select>
      </section>
      {error && (
        <p className="mt-4 rounded-xl bg-danger-soft p-3 text-danger">
          {error}
        </p>
      )}
      {loading && !data ? (
        <Loader />
      ) : (
        <div className="mt-5 space-y-3">
          {data?.items?.map((item) => (
            <article
              key={item.employeeId}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">{item.employeeName}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.displayStatus.replaceAll("_", " ")}
                    {item.reportId
                      ? ` · ${item.itemCount} Work Items · ${duration(item.trackedMinutes)}`
                      : ""}
                  </p>
                  {item.reportId && (
                    <p className="mt-1 text-xs">
                      {item.completedCount} completed · {item.pendingCount}{" "}
                      pending ·{" "}
                      <span
                        className={
                          item.blockerType !== "NONE"
                            ? "font-bold text-warning"
                            : "text-muted-foreground"
                        }
                      >
                        {blocker(item.blockerType)}
                      </span>
                      {` · ${item.replyCount || 0} replies`}
                    </p>
                  )}
                  {item.blockerType === "WAITING_ADMIN" && <p className="mt-2 text-xs font-black text-warning">⚠ ACTION NEEDED · Waiting for CEO/Admin</p>}
                  {item.displayStatus === "REPORT_OVERDUE" && <p className="mt-2 text-xs font-bold text-danger">Still clocked in · Shift ended {item.minutesPastShiftEnd}m ago</p>}
                  {item.displayStatus === "REPORT_DUE_SOON" && <p className="mt-2 text-xs font-bold text-warning">Shift ending soon · Report not submitted</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openHistory(item)}>History</Button>
                {item.attendanceId && !item.reportId && ["REPORT_OVERDUE", "REPORT_DUE_SOON", "WORKING"].includes(item.displayStatus) && <Button disabled={item.lastReminderAt && Date.now() - new Date(item.lastReminderAt).getTime() < Number(item.manualReminderCooldownMinutes) * 60000} onClick={() => setReminderTarget(item)}>{item.lastReminderAt && Date.now() - new Date(item.lastReminderAt).getTime() < Number(item.manualReminderCooldownMinutes) * 60000 ? "Reminder Sent" : "Send Reminder"}</Button>}
                {item.reportId ? (
                  <Button
                    variant="secondary"
                    onClick={() => open(item.reportId)}
                  >
                    View Report →
                  </Button>
                ) : (
                  <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-bold">
                    {item.displayStatus}
                  </span>
                )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-center gap-3">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="self-center text-xs">
          Page {data?.pagination?.page || 1} of{" "}
          {data?.pagination?.totalPages || 1}
        </span>
        <Button
          variant="secondary"
          disabled={page >= (data?.pagination?.totalPages || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
      <Modal
        open={Boolean(detail)}
        title="DAY-END REPORT"
        onClose={() => setDetail(null)}
      >
        {detail && (
          <ReportDetail report={detail} onReview={() => setConfirm(true)} />
        )}
      </Modal>
      <Modal open={Boolean(reminderTarget)} title="Send Day-End Report Reminder?" onClose={() => !sendingReminder && setReminderTarget(null)}>
        <p className="text-sm text-muted-foreground">{reminderTarget?.employeeName} will receive a notification asking them to complete the Day-End Report for this workday.</p>
        <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" disabled={sendingReminder} onClick={() => setReminderTarget(null)}>Cancel</Button><Button disabled={sendingReminder} onClick={sendReminder}>{sendingReminder ? "Sending…" : "Send Reminder"}</Button></div>
      </Modal>
      <Modal open={Boolean(historyEmployee)} title={`${historyEmployee?.employeeName || "Employee"} · Report History`} onClose={() => { setHistoryEmployee(null); setHistory(null); }}>
        <div className="space-y-3">
          {!history?.items?.length && <p className="text-sm text-muted-foreground">No reports in this month.</p>}
          {history?.items?.map((item) => <button type="button" key={item.id} onClick={() => open(item.id)} className="w-full rounded-xl border border-border p-4 text-left hover:bg-surface-secondary"><b>{item.reportDate}</b><p className="mt-1 text-xs text-muted-foreground">{item.status} · {item.itemCount} items · {duration(item.trackedMinutes)} · {item.replyCount} replies</p></button>)}
        </div>
      </Modal>
      <Modal
        open={confirm}
        title="Mark Report as Reviewed?"
        onClose={() => !reviewing && setConfirm(false)}
      >
        <p className="text-sm text-muted-foreground">
          Once reviewed, the employee will no longer be able to edit this
          Day-End Report.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={reviewing}
            onClick={() => setConfirm(false)}
          >
            Cancel
          </Button>
          <Button disabled={reviewing} onClick={review}>
            {reviewing ? "Reviewing…" : "Mark as Reviewed"}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
export function ReportDetail({ report, onReview }) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h2 className="text-xl font-black">{report.employeeName}</h2>
        <p className="text-muted-foreground">
          {report.reportDate} · Submitted {stamp(report.submittedAt)}
        </p>
        <p className="mt-1 font-bold">
          {report.status}
          {report.reviewedAt
            ? ` · ${report.reviewerName} · ${stamp(report.reviewedAt)}`
            : ""}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Work Items", report.items.length],
          [
            "Tracked",
            duration(
              report.items.reduce(
                (n, x) => n + Number(x.trackedMinutes || 0),
                0,
              ),
            ),
          ],
          [
            "Pending",
            report.items.filter((x) => x.status !== "COMPLETED").length,
          ],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-surface-secondary p-3">
            <b className="block text-lg">{v}</b>
            <small>{l}</small>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {report.items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-border p-4"
          >
            <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary-text">
              {item.sourceType === "TASK" ? "TASK" : "ONGOING WORK"}
            </span>
            <h3 className="mt-2 font-bold">{item.title}</h3>
            <p className="text-xs text-muted-foreground">
              {item.status.replaceAll("_", " ")} ·{" "}
              {duration(item.trackedMinutes)}
            </p>
            {item.summary && (
              <Field label="Employee Summary" value={item.summary} />
            )}{" "}
            {item.whatsLeft && (
              <Field label="What's Left" value={item.whatsLeft} />
            )}{" "}
            {item.estimatedRemainingMinutes && (
              <Field
                label="Estimated Remaining"
                value={duration(item.estimatedRemainingMinutes)}
              />
            )}
          </article>
        ))}
      </div>
      <Field label="Other Work" value={report.otherWork || "None"} />
      <Field
        label="Blocker"
        value={`${blocker(report.blockerType)}${report.blockerDetails ? ` — ${report.blockerDetails}` : ""}`}
      />
      <Field label="Tomorrow's Priority" value={report.tomorrowPriority} />
      {report.status === "SUBMITTED" && onReview && (
        <div className="flex justify-end">
          <Button onClick={onReview}>Mark as Reviewed</Button>
        </div>
      )}
      <ReportActivity reportId={report.id} />
      <ReportDiscussion reportId={report.id} />
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
