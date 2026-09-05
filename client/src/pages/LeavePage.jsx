import { useCallback, useEffect, useState } from "react";
import LeaveHistoryTable from "../components/leave/LeaveHistoryTable";
import LeaveRequestForm from "../components/leave/LeaveRequestForm";
import LeaveSummaryCards from "../components/leave/LeaveSummaryCards";
import PageHeader from "../components/common/PageHeader";
import * as leave from "../services/leave.service";
import { errorMessage } from "../utils/helpers";
export default function LeavePage() {
  const [rows, setRows] = useState([]),
    [summary, setSummary] = useState({}),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const [r, s] = await Promise.all([leave.getMyLeaves(), leave.getSummary()]);
    setRows(r);
    setSummary(s);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function submit(data) {
    setBusy(true);
    setNotice("");
    try {
      const r = await leave.createLeave(data);
      setNotice(r.message);
      await load();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id) {
    if (!confirm("Cancel this pending leave request?")) return;
    setBusy(true);
    try {
      const r = await leave.cancelLeave(id);
      setNotice(r.message);
      await load();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="My Leave"
        description="Request leave and review your monthly leave status."
      />
      {notice && (
        <div className="mb-4 rounded-xl bg-primary-soft p-3 text-sm font-semibold text-primary-text">
          {notice}
        </div>
      )}
      <LeaveSummaryCards summary={summary} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-bold">Request Leave</h2>
          <LeaveRequestForm onSubmit={submit} busy={busy} />
        </section>
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="font-bold">Leave History</h2>
          </div>
          <LeaveHistoryTable rows={rows} onCancel={cancel} busy={busy} />
        </section>
      </div>
    </>
  );
}
