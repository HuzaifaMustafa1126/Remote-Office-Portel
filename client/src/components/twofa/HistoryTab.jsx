import { Activity, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import * as twofa from "../../services/twofa.service";
import { errorMessage } from "../../utils/helpers";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";

const actions = [
  "PROFILE_CREATED",
  "PROFILE_UPDATED",
  "PROFILE_DELETED",
  "PLATFORM_ADDED",
  "PLATFORM_UPDATED",
  "PLATFORM_REMOVED",
  "TWOFA_UPDATED",
  "AUTH_KEY_UPDATED",
  "TWOFA_REVEALED",
  "AUTH_KEY_REVEALED",
  "ACCESS_GRANTED",
  "ACCESS_UPDATED",
  "ACCESS_REVOKED",
  "ACCESS_DENIED",
];
const when = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export default function HistoryTab({ profileId }) {
  const [query, setQuery] = useState({
    employeeId: "",
    platformId: "",
    action: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 20,
  });
  const [result, setResult] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ""),
  );
  const load = async () => {
    setLoading(true);
    try {
      setResult(await twofa.profileHistory(profileId, params));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [profileId, query]);
  const set = (key, value) =>
    setQuery((current) => ({ ...current, [key]: value, page: 1 }));
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold">Activity History</h2>
        <p className="text-sm text-muted-foreground">
          Track profile changes, credential access, and employee actions.
        </p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="relative">
          <Filter
            size={15}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <select
            aria-label="Action"
            value={query.action}
            onChange={(event) => set("action", event.target.value)}
            className="w-full rounded-xl border border-border py-2 pl-9 pr-2 text-sm"
          >
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <input
          aria-label="Employee ID"
          inputMode="numeric"
          placeholder="Employee ID"
          value={query.employeeId}
          onChange={(event) => set("employeeId", event.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        />
        <input
          aria-label="Platform ID"
          inputMode="numeric"
          placeholder="Platform ID"
          value={query.platformId}
          onChange={(event) => set("platformId", event.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        />
        <input
          aria-label="From date"
          type="date"
          value={query.dateFrom}
          onChange={(event) => set("dateFrom", event.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        />
        <input
          aria-label="To date"
          type="date"
          value={query.dateTo}
          onChange={(event) => set("dateTo", event.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-xl bg-surface-secondary"
            />
          ))}
        </div>
      ) : result?.rows.length ? (
        <>
          <ol className="space-y-3">
            {result.rows.map((event) => (
              <li
                key={event.id}
                className="relative rounded-2xl border border-border bg-surface p-4 pl-14"
              >
                <span
                  className={`absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full ${event.eventStatus === "FAILURE" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary-text"}`}
                >
                  <Activity size={16} />
                </span>
                <p className="font-semibold">
                  {event.employeeName} · {event.description}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.platformName ? `${event.platformName} · ` : ""}
                  {when(event.createdAt)}
                </p>
                {event.changedFields?.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Changed:{" "}
                    {event.changedFields
                      .map((field) => field.replaceAll("_", " "))
                      .join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {result.meta.total} events
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={query.page <= 1}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={query.page >= result.meta.pages}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No Activity Yet"
          description="Profile activity will appear here."
        />
      )}
    </div>
  );
}
