import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, MessageSquare, SearchX } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import { ReportDetail } from "./DayEndReportsPage";
import * as api from "../services/dayEndReport.service";
import { errorMessage } from "../utils/helpers";
import DayEndReportStatus, { reportDate } from "../components/dayEndReport/DayEndReportStatus";

const currentMonth = () =>
  new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
    .slice(0, 7);
const duration = (m) =>
  `${Math.floor(Number(m || 0) / 60)}h ${Number(m || 0) % 60}m`;

export default function MyDayEndReportsPage() {
  const [month, setMonth] = useState(currentMonth),
    [status, setStatus] = useState("ALL"),
    [blocker, setBlocker] = useState("ALL"),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [detail, setDetail] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .myHistory({ month, status, blocker, page, limit: 12 })
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [month, status, blocker, page]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("report");
    if (id)
      api
        .getOwn(id)
        .then(setDetail)
        .catch((e) => setError(errorMessage(e)));
  }, []);
  const open = async (id) => {
    try {
      setDetail(await api.getOwn(id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <main>
      <PageHeader
        title="My Day-End Reports"
        description="Review your submitted work, management status and report discussions."
      />
      <section className="flex flex-wrap gap-3 rounded-2xl border border-border bg-surface p-4">
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2"
        />
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
        </select>
        <select
          value={blocker}
          onChange={(e) => {
            setBlocker(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-surface px-3"
        >
          <option value="ALL">All blockers</option>
          <option value="HAS_BLOCKER">Has blocker</option>
          <option value="NO_BLOCKER">No blocker</option>
        </select>
        <Button variant="secondary" onClick={() => { setMonth(currentMonth()); setStatus("ALL"); setBlocker("ALL"); setPage(1); }}>Reset</Button>
      </section>
      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-danger-soft p-3 text-danger"><p>{error}</p><Button variant="secondary" onClick={load}>Try Again</Button></div>
      )}
      {loading ? (
        <Loader />
      ) : !data?.items?.length ? (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-10 text-center">
          <SearchX className="mx-auto text-muted-foreground" />
          <h2 className="mt-3 font-bold">No reports found</h2>
          <p className="text-sm text-muted-foreground">
            There are no reports matching these filters.
          </p>
        </section>
      ) : (
        <div className="mt-5 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-black">{reportDate(item.reportDate)}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Intl.DateTimeFormat("en-PK", {
                      timeStyle: "short",
                    }).format(new Date(item.submittedAt))}
                  </p>
                </div>
                <DayEndReportStatus status={item.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-xs text-muted-foreground">
                <span><b className="text-foreground">{item.itemCount}</b> work {item.itemCount === 1 ? "item" : "items"}</span>
                {Number(item.trackedMinutes) > 0 && <span className="inline-flex items-center gap-1"><Clock3 size={13}/><b className="text-foreground">{duration(item.trackedMinutes)}</b> tracked</span>}
                <span className="inline-flex items-center gap-1"><MessageSquare size={13}/><b className="text-foreground">{item.replyCount}</b> {item.replyCount === 1 ? "reply" : "replies"}</span>
              </div>
              <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Next priority: </span>{item.tomorrowPriority}</p>
              <div className="mt-3 flex justify-end"><Button
                variant="secondary"
                onClick={() => open(item.id)}
              >
                {item.status === "REVIEWED" ? <CheckCircle2 size={15} /> : null}{" "}
                View Report
              </Button></div>
            </article>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-center gap-3">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((x) => x - 1)}
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
          onClick={() => setPage((x) => x + 1)}
        >
          Next
        </Button>
      </div>
      <Modal
        open={Boolean(detail)}
        title="MY DAY-END REPORT"
        onClose={() => setDetail(null)}
      >
        {detail && <ReportDetail report={detail} />}
      </Modal>
    </main>
  );
}
