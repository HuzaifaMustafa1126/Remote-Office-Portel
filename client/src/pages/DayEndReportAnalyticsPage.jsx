import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import Modal from "../components/common/Modal";
import DayEndReportAnalytics from "../components/dayEndReport/DayEndReportAnalytics";
import { ReportDetail } from "./DayEndReportsPage";
import * as api from "../services/dayEndReport.service";
import { errorMessage } from "../utils/helpers";

export default function DayEndReportAnalyticsPage() {
  const navigate = useNavigate(),
    [detail, setDetail] = useState(null),
    [error, setError] = useState("");
  const open = async (id) => {
    try {
      setDetail(await api.get(id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const drill = (filters) => {
    const query = new URLSearchParams();
    if (filters.date) query.set("date", filters.date);
    if (filters.status) query.set("status", filters.status);
    if (filters.blocker) query.set("blocker", filters.blocker);
    if (filters.attention) query.set("attention", "1");
    navigate(`/day-end-reports?${query}`);
  };
  return (
    <main>
      <PageHeader
        title="Day-End Report Analytics"
        description="Weekly and monthly work records, historical trends and management follow-up."
      />
      <nav className="mb-5 flex gap-2" aria-label="Day-End Report views">
        <Link
          to="/day-end-reports"
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold"
        >
          Daily
        </Link>
        <span className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Analytics
        </span>
      </nav>
      {error && (
        <p className="mb-4 rounded-xl bg-danger-soft p-3 text-danger">
          {error}
        </p>
      )}
      <DayEndReportAnalytics onOpenReport={open} onDrillDown={drill} />
      <Modal
        open={Boolean(detail)}
        title="DAY-END REPORT"
        onClose={() => setDetail(null)}
      >
        {detail && <ReportDetail report={detail} />}
      </Modal>
    </main>
  );
}
