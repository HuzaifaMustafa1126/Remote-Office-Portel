import { useEffect, useState } from "react";
import { Search, Trash2, X } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import ResponsiveTable from "../components/common/ResponsiveTable";
import Loader from "../components/common/Loader";
import * as security from "../services/loginSecurity.service";
import { errorMessage } from "../utils/helpers";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS as P } from "../utils/permissions";
import useAuth from "../hooks/useAuth";
import HistoryCleanupModal from "../components/security/HistoryCleanupModal";

const when = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const statusStyle = {
  ACTIVE: "bg-success-soft text-success",
  FAILED: "bg-danger-soft text-danger",
  LOGGED_OUT: "bg-surface-secondary text-muted-foreground",
  EXPIRED: "bg-warning-soft text-warning",
  REVOKED: "bg-danger-soft text-danger",
};
function Badge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[status] || statusStyle.LOGGED_OUT}`}
    >
      {String(status).replaceAll("_", " ")}
    </span>
  );
}
function Summary({ data }) {
  const values = [
    ["Active Sessions", data?.activeSessions],
    ["Logins Today", data?.loginsToday],
    ["New Login Signals", data?.newLoginSignals],
    ["Failed Attempts", data?.failedAttempts],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {values.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
        >
          <p className="text-2xl font-black">{value || 0}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function LoginSecurityPage() {
  const { user } = useAuth();
  const isCeo = user?.roles?.some((role) => role.toUpperCase() === "CEO");
  const canRevoke = usePermission(P.SECURITY_REVOKE),
    [summary, setSummary] = useState(null),
    [result, setResult] = useState(null),
    [selected, setSelected] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [cleanupOpen, setCleanupOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [filters, setFilters] = useState({
      search: "",
      from: "",
      to: "",
      status: "",
      signal: "",
      page: 1,
      limit: 20,
    });
  const load = () =>
    Promise.all([security.getSummary(), security.list(filters)])
      .then(([a, b]) => {
        setSummary(a);
        setResult(b);
        setError("");
      })
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [filters]);
  const set = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const terminate = async () => {
    if (
      !selected?.sessionId ||
      !confirm(`Terminate ${selected.employeeName}'s active session?`)
    )
      return;
    setBusy(true);
    try {
      await security.revoke(selected.sessionId);
      setSelected(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        title="Login Security"
        description="Review authentication sessions, failed attempts, and conservative new-login signals."
        action={
          isCeo ? (
            <button onClick={() => setCleanupOpen(true)} className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background">
              <Trash2 size={16} /> Clean History
            </button>
          ) : null
        }
      />
      {notice && <p className="my-4 rounded-xl bg-success-soft p-3 text-sm text-success">{notice}</p>}
      {summary && <Summary data={summary.stats} />}{" "}
      {error && (
        <p
          role="alert"
          className="my-4 rounded-xl bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-2.5 text-muted-foreground"
            />
            <input
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Search employee, email or IP…"
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={filters.status}
            onChange={(e) => set("status", e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {["ACTIVE", "LOGGED_OUT", "EXPIRED", "REVOKED", "FAILED"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
          <select
            value={filters.signal}
            onChange={(e) => set("signal", e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All signals</option>
            <option value="NEW_IP">New IP</option>
            <option value="NEW_DEVICE">New Device</option>
            <option value="SUSPICIOUS">Suspicious failures</option>
          </select>
          <input
            aria-label="From date"
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            aria-label="To date"
            type="date"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        {!result ? (
          <Loader />
        ) : (
          <>
            <div className="overflow-x-auto">
              <ResponsiveTable className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-surface-secondary text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">IP Address</th>
                    <th className="px-3 py-3">Device</th>
                    <th className="px-3 py-3">Browser / OS</th>
                    <th className="px-3 py-3">Login / Attempt</th>
                    <th className="px-3 py-3">Last Active</th>
                    <th className="px-4 py-3">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.rows.map((row, index) => (
                    <tr
                      key={row.sessionId || `failed-${index}-${row.occurredAt}`}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer hover:bg-surface-secondary"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{row.employeeName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {row.role || row.accountIdentifier}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge status={row.status} />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {row.ipAddress || "Unknown"}
                      </td>
                      <td className="px-3 py-3">{row.deviceType}</td>
                      <td className="px-3 py-3">
                        {row.browser} · {row.operatingSystem}
                      </td>
                      <td className="px-3 py-3">{when(row.occurredAt)}</td>
                      <td className="px-3 py-3">{when(row.lastActiveAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.isNewIp && (
                            <span className="rounded bg-warning-soft px-2 py-1 text-[10px] text-warning">
                              New IP
                            </span>
                          )}
                          {row.isNewDevice && (
                            <span className="rounded bg-warning-soft px-2 py-1 text-[10px] text-warning">
                              New device
                            </span>
                          )}
                          {row.suspicious && (
                            <span className="rounded bg-danger-soft px-2 py-1 text-[10px] text-danger">
                              Repeated failures
                            </span>
                          )}
                          {!row.isNewIp &&
                            !row.isNewDevice &&
                            !row.suspicious &&
                            "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
            </div>
            {!result.rows.length && (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No login activity matches these filters.
              </p>
            )}
            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <span>
                Page {result.meta.page} of {result.meta.pages} ·{" "}
                {result.meta.total} records
              </span>
              <div className="flex gap-2">
                <button
                  disabled={result.meta.page <= 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page - 1 }))
                  }
                  className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={result.meta.page >= result.meta.pages}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page + 1 }))
                  }
                  className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-overlay/50 p-4"
          onClick={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Session details
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {selected.employeeName}
                </h2>
              </div>
              <button aria-label="Close" onClick={() => setSelected(null)}>
                <X />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Status", selected.status],
                ["Role", selected.role || "—"],
                ["IP address", selected.ipAddress || "Unknown"],
                ["Device", selected.deviceType],
                ["Browser", selected.browser],
                ["Operating system", selected.operatingSystem],
                ["Login / Attempt", when(selected.occurredAt)],
                ["Last Active", when(selected.lastActiveAt)],
                ["Logout", when(selected.logoutAt)],
                [
                  "Session",
                  selected.sessionId
                    ? `${selected.sessionId.slice(0, 8)}…`
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words font-semibold">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
            {canRevoke && selected.status === "ACTIVE" && (
              <button
                disabled={busy}
                onClick={terminate}
                className="mt-6 w-full rounded-xl bg-danger px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Terminating…" : "Terminate Session"}
              </button>
            )}
          </section>
        </div>
      )}
      {cleanupOpen && (
        <HistoryCleanupModal
          kind="LOGIN_SECURITY"
          preview={security.previewCleanup}
          remove={security.cleanup}
          onClose={() => setCleanupOpen(false)}
          onDone={(data) => {
            setCleanupOpen(false);
            setNotice(`${data.recordsDeleted} historical record(s) were permanently deleted. ${data.activeSessionsProtected} active session(s) were protected.`);
            setFilters((current) => ({ ...current, page: 1 }));
          }}
        />
      )}
    </>
  );
}
