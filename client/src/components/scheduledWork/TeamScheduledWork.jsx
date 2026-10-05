import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, Search, Users } from "lucide-react";
import ScheduledWorkForm from "./ScheduledWorkForm";
import ScheduledWorkCalendar from "./ScheduledWorkCalendar";
import * as api from "../../services/scheduledWork.service";

const fmt = (value) =>
  new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export default function TeamScheduledWork({
  onPersonal,
  canAssign,
  canManage,
  canReassign,
}) {
  const [tab, setTab] = useState("Overview"),
    [items, setItems] = useState([]),
    [overview, setOverview] = useState(null),
    [employees, setEmployees] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [form, setForm] = useState(null),
    [employeeId, setEmployeeId] = useState(""),
    [status, setStatus] = useState(""),
    [priority, setPriority] = useState(""),
    [type, setType] = useState("ALL"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [people, summary] = await Promise.all([
        api.listScheduleEmployees(),
        api.getTeamOverview(),
      ]);
      setEmployees(people);
      setOverview(summary);
      if (!["Overview", "Calendar"].includes(tab)) {
        const data = await api.listTeamScheduledWork({
          employeeId: employeeId || undefined,
          status: status || undefined,
          priority: priority || undefined,
          type,
          search: search || undefined,
          page,
          limit: 20,
        });
        setItems(data.items);
        setPagination(data.pagination);
      }
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to load the team schedule.",
      );
    } finally {
      setLoading(false);
    }
  }, [tab, employeeId, status, priority, type, search, page]);
  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);
  useEffect(
    () => setPage(1),
    [tab, employeeId, status, priority, type, search],
  );
  const act = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to update team Scheduled Work.",
      );
    }
  };
  const reassign = (item) => {
    const selected = window.prompt(
      `Reassign “${item.title}”\n\nEnter employee ID:\n${employees.map((e) => `${e.id}: ${e.name}`).join("\n")}`,
      String(item.assignedTo),
    );
    if (!selected || String(selected) === String(item.assignedTo)) return;
    const scope = item.isOccurrence
      ? window.confirm(
          "Apply to this and all future occurrences?\n\nOK = future occurrences, Cancel = this occurrence only",
        )
        ? "FUTURE_OCCURRENCES"
        : "THIS_OCCURRENCE"
      : "ONE_TIME";
    act(() =>
      api.reassignTeamScheduledWork(item.id, {
        assignedTo: Number(selected),
        scope,
        ...(item.occurrenceId && { occurrenceId: item.occurrenceId }),
      }),
    );
  };
  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Team Scheduled Work</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan and review work across active employees.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPersonal}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
          >
            My Schedule
          </button>
          {canAssign && (
            <button
              onClick={() => setForm({ mode: "create" })}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus size={17} />
              Schedule for Employee
            </button>
          )}
        </div>
      </header>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
        {["Overview", "Schedule", "Calendar"].map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {value}
          </button>
        ))}
      </div>
      {error && (
        <div className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {tab !== "Overview" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All priorities</option>
            {["LOW", "NORMAL", "HIGH", "URGENT"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="ALL">All types</option>
            <option value="ONE_TIME">One-time</option>
            <option value="RECURRING">Recurring</option>
          </select>
          {tab === "Schedule" && (
            <>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="DUE_TODAY">Due today</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="OVERDUE">Overdue</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <label className="relative min-w-56 flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search work or employee"
                  className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm"
                />
              </label>
            </>
          )}
        </div>
      )}
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-secondary" />
      ) : tab === "Calendar" ? (
        <ScheduledWorkCalendar
          priority={priority}
          type={type}
          employeeId={employeeId}
          loadCalendar={api.getTeamCalendar}
          showAssignee
          onOpen={() => {}}
        />
      ) : tab === "Overview" && overview ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Today", overview.counts.today],
              ["Due Now", overview.counts.dueNow],
              ["Overdue", overview.counts.overdue],
              ["Upcoming", overview.counts.upcoming],
            ].map(([label, value]) => (
              <button
                key={label}
                onClick={() => {
                  setStatus(
                    label === "Today"
                      ? "DUE_TODAY"
                      : label === "Due Now"
                        ? "DUE_TODAY"
                        : label.toUpperCase(),
                  );
                  setTab("Schedule");
                }}
                className="rounded-2xl border border-border bg-surface p-4 text-left"
              >
                <CalendarClock size={17} />
                <p className="mt-2 text-2xl font-black">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </button>
            ))}
          </div>
          <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-black">
              <Users size={17} />
              Today by employee
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {overview.employeeSummary.map((e) => (
                <button
                  key={e.employeeId}
                  onClick={() => {
                    setEmployeeId(e.employeeId);
                    setStatus("DUE_TODAY");
                    setTab("Schedule");
                  }}
                  className="rounded-xl bg-surface-secondary p-3 text-left"
                >
                  <p className="font-bold">{e.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.today} today · {e.dueNow} due now
                  </p>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={`${item.id}-${item.occurrenceId || "p"}`}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">
                    {item.isRecurring ? "↻ " : ""}
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.assigneeName} · created by {item.creatorName}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {fmt(item.scheduledAt)}
                  </p>
                </div>
                <span className="rounded-full bg-surface-secondary px-2 py-1 text-[10px] font-black">
                  {item.displayStatus.replaceAll("_", " ")}
                </span>
              </div>
              {item.status === "UPCOMING" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {canReassign && (
                    <button
                      onClick={() => reassign(item)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
                    >
                      Reassign
                    </button>
                  )}
                  {canManage && (
                    <>
                      <button
                        onClick={() => setForm({ mode: "reschedule", item })}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
                      >
                        Reschedule{item.isOccurrence ? " occurrence" : ""}
                      </button>
                      <button
                        onClick={() =>
                          window.confirm(`Cancel “${item.title}”?`) &&
                          act(() =>
                            item.isOccurrence
                              ? api.cancelTeamOccurrence(
                                  item.id,
                                  item.occurrenceId,
                                )
                              : api.cancelTeamScheduledWork(item.id),
                          )
                        }
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-danger"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
          {!items.length && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No team Scheduled Work matches these filters.
            </div>
          )}
          {pagination.pages > 1 && (
            <div className="flex justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="text-xs">
                Page {page} of {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <ScheduledWorkForm
        key={`${form?.mode}-${form?.item?.id || "new"}`}
        open={Boolean(form)}
        initial={form?.item}
        rescheduleOnly={form?.mode === "reschedule"}
        assignees={employees}
        assignmentRequired={form?.mode === "create"}
        onClose={() => setForm(null)}
        onSave={async (data) => {
          if (form.mode === "create") await api.createTeamScheduledWork(data);
          else if (form.item.isOccurrence)
            await api.rescheduleTeamOccurrence(
              form.item.id,
              form.item.occurrenceId,
              data,
            );
          else await api.rescheduleTeamScheduledWork(form.item.id, data);
          await load();
        }}
      />
    </>
  );
}
