import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Search, X } from "lucide-react";
import {
  bulkTasks,
  changeTaskDeadline,
  deleteTask,
  duplicateTask,
  listManagedTasks,
  listTaskAssignees,
  reassignTask,
  transitionTask,
} from "../../services/task.service";
import PriorityBadge from "./PriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
const statuses = [
    "DRAFT",
    "SCHEDULED",
    "OPEN",
    "TO_DO",
    "IN_PROGRESS",
    "SUBMITTED_FOR_REVIEW",
    "CHANGES_REQUIRED",
    "COMPLETED",
    "ARCHIVED",
  ],
  date = (v) =>
    v
      ? new Intl.DateTimeFormat("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(v))
      : "—",
  duration = (s) =>
    s ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : "—",
  err = (e) => e.response?.data?.message || "Unable to complete this action.";
const filterKey = "task-management-filters";
function initialFilters() {
  const defaults = {
    search: "",
    priority: "",
    status: "",
    employeeId: "",
    due: "ALL",
    from: "",
    to: "",
    page: 1,
  };
  try {
    const saved = JSON.parse(sessionStorage.getItem(filterKey) || "{}");
    const linkedEmployee = new URLSearchParams(window.location.search).get(
      "employeeId",
    );
    return {
      ...defaults,
      ...saved,
      employeeId: linkedEmployee || saved.employeeId || "",
    };
  } catch {
    return defaults;
  }
}
export default function TaskManagementList({ onView, onEdit, onChanged }) {
  const [filters, setFilters] = useState(initialFilters),
    [query, setQuery] = useState(""),
    [data, setData] = useState({
      items: [],
      pagination: { page: 1, pages: 1, total: 0 },
    }),
    [employees, setEmployees] = useState([]),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState([]),
    [menu, setMenu] = useState(null),
    [dialog, setDialog] = useState(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(filters.search), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);
  useEffect(() => {
    sessionStorage.setItem(filterKey, JSON.stringify(filters));
  }, [filters]);
  const params = useMemo(
    () => buildParams({ ...filters, search: query }),
    [filters, query],
  );
  const load = async () => {
    setLoading(true);
    try {
      setData(await listManagedTasks(params));
    } catch (e) {
      setNotice(err(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [params]);
  useEffect(() => {
    listTaskAssignees().then(setEmployees);
  }, []);
  useEffect(()=>{if(!menu)return;const close=e=>{if(e.key==="Escape")setMenu(null)},outside=()=>setMenu(null);document.addEventListener("keydown",close);document.addEventListener("click",outside);return()=>{document.removeEventListener("keydown",close);document.removeEventListener("click",outside)}},[menu]);
  const set = (key, value) => {
    setFilters((x) => ({ ...x, [key]: value, page: 1 }));
    setSelected([]);
  };
  const mutate = async (fn, success) => {
    try {
      await fn();
      setNotice(success);
      setDialog(null);
      setMenu(null);
      setSelected([]);
      await load();
      onChanged?.();
    } catch (e) {
      setNotice(err(e));
    }
  };
  const action = (type, task) => {
    setMenu(null);
    if (type === "view") onView(task);
    else if (type === "edit") onEdit(task);
    else if (type === "duplicate")
      mutate(() => duplicateTask(task.id), "Task duplicated as draft.");
    else if (type === "archive")
      mutate(
        () => transitionTask(task.id, { status: "ARCHIVED" }),
        "Task archived.",
      );
    else if (type === "restore")
      mutate(
        () => transitionTask(task.id, { status: "COMPLETED" }),
        "Task restored.",
      );
    else setDialog({ type, task });
  };
  const bulk = async (action, value) => {
    try {
      const result = await bulkTasks({ taskIds: selected, action, ...value });
      setNotice(
        `${result.updated} updated • ${result.skipped} skipped${
          result.skipped
            ? `: ${result.results
                .filter((x) => !x.success)
                .map((x) => `Task ${x.id} — ${x.reason}`)
                .join("; ")}`
            : ""
        }`,
      );
      setSelected([]);
      await load();
      onChanged?.();
    } catch (e) {
      setNotice(err(e));
    }
  };
  const all =
    data.items.length && data.items.every((x) => selected.includes(x.id));
  return (
    <section>
      <Filters value={filters} set={set} employees={employees} />
      {notice && (
        <div className="mb-3 rounded-xl bg-surface-secondary p-3 text-sm">
          {notice}
        </div>
      )}
      {selected.length > 0 && (
        <Bulk
          count={selected.length}
          employees={employees}
          run={bulk}
          clear={() => setSelected([])}
        />
      )}
      <div className="overflow-visible rounded-2xl border border-border bg-surface shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-surface-secondary text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={Boolean(all)}
                    onChange={() =>
                      setSelected(all ? [] : data.items.map((x) => x.id))
                    }
                  />
                </th>
                <th>Task Title</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th className="pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onView(task)}
                  className="cursor-pointer hover:bg-surface-secondary/60"
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(task.id)}
                      onChange={() =>
                        setSelected((x) =>
                          x.includes(task.id)
                            ? x.filter((id) => id !== task.id)
                            : [...x, task.id],
                        )
                      }
                    />
                  </td>
                  <td className="max-w-64 py-3 pr-3 font-bold">
                    <span className="line-clamp-2">{task.title}</span>
                    {Number(task.unreadCount) > 0 && (
                      <small className="mt-1 block text-primary">
                        ● {task.unreadCount} new
                      </small>
                    )}
                  </td>
                  <td className="text-xs text-muted-foreground">General</td>
                  <td>{task.assigneeName || "Unassigned"}</td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>
                    <TaskStatusBadge
                      status={task.status}
                      overdue={task.overdue}
                    />
                  </td>
                  <td>{task.assignment_type}</td>
                  <td className={task.overdue ? "font-bold text-danger" : ""}>
                    {date(task.due_at)}
                  </td>
                  <td>
                    <Progress status={task.status} />
                  </td>
                  <td
                    className="relative pr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setMenu(menu?.id === task.id ? null : {id:task.id,top:r.bottom+6,left:Math.max(8,r.right-192)})}}
                      className="rounded-lg p-2 hover:bg-surface-secondary"
                    >
                      <MoreHorizontal />
                    </button>
                    {menu?.id === task.id && (
                      <Menu position={menu} task={task} choose={(type) => action(type, task)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-border md:hidden">
          {data.items.map((task) => (
            <div key={task.id} className="p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(task.id)}
                  onChange={() =>
                    setSelected((x) =>
                      x.includes(task.id)
                        ? x.filter((id) => id !== task.id)
                        : [...x, task.id],
                    )
                  }
                />
                <button
                  onClick={() => onView(task)}
                  className="min-w-0 flex-1 text-left"
                >
                  <b className="break-words">{task.title}</b>
                  {Number(task.unreadCount) > 0 && (
                    <span className="ml-2 text-[10px] font-bold text-primary">
                      ● {task.unreadCount} new
                    </span>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.assigneeName || "Unassigned"} ·{" "}
                    {task.status.replaceAll("_", " ")}
                  </p>
                  <p
                    className={`mt-1 text-xs ${task.overdue ? "font-bold text-danger" : "text-muted-foreground"}`}
                  >
                    {date(task.due_at)}
                  </p>
                </button>
                <button
                  onClick={(e) => {e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setMenu(menu?.id===task.id?null:{id:task.id,top:r.bottom+6,left:Math.max(8,r.right-192)})}}
                >
                  <MoreHorizontal />
                </button>
              </div>
              {menu?.id === task.id && (
                <div className="relative">
                  <Menu position={menu} task={task} choose={(type) => action(type, task)} />
                </div>
              )}
            </div>
          ))}
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading tasks…
          </p>
        ) : (
          !data.items.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No tasks match these filters.
            </p>
          )
        )}
        <Pagination
          value={data.pagination}
          setPage={(page) => setFilters((x) => ({ ...x, page }))}
        />
      </div>
      {dialog && (
        <AdminDialog
          value={dialog}
          employees={employees}
          close={() => setDialog(null)}
          save={(type, payload) =>
            mutate(
              () =>
                type === "deadline"
                  ? changeTaskDeadline(dialog.task.id, payload)
                  : type === "reassign"
                    ? reassignTask(dialog.task.id, payload)
                    : deleteTask(dialog.task.id),
              type === "delete"
                ? "Task permanently deleted."
                : type === "deadline"
                  ? "Deadline changed."
                  : "Task reassigned.",
            )
          }
        />
      )}
    </section>
  );
}
function buildParams(f) {
  const p = { page: f.page, limit: 25 };
  for (const k of ["search", "priority", "status", "employeeId"])
    if (f[k]) p[k] = f[k];
  const now = new Date(),
    day = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (f.due === "TODAY") p.from = p.to = day(now);
  if (f.due === "TOMORROW") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    p.from = p.to = day(d);
  }
  if (f.due === "WEEK") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    p.from = day(now);
    p.to = day(d);
  }
  if (f.due === "OVERDUE") p.overdue = true;
  if (f.due === "CUSTOM") {
    if (f.from) p.from = f.from;
    if (f.to) p.to = f.to;
  }
  return p;
}
function Filters({ value, set, employees }) {
  const active =
    Object.entries(value).some(([k, v]) => !["page", "due"].includes(k) && v) ||
    value.due !== "ALL";
  return (
    <div className="mb-4 grid gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(260px,2fr)_repeat(4,minmax(135px,1fr))]">
      <label className="relative sm:col-span-2 xl:col-span-1">
        <Search
          className="absolute left-3 top-3 text-muted-foreground"
          size={16}
        />
        <input
          className="input !mt-0 h-10 pl-10"
          placeholder="Search tasks"
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </label>
      <select
        className="input !mt-0 h-10"
        value={value.priority}
        onChange={(e) => set("priority", e.target.value)}
      >
        <option value="">All priorities</option>
        {["URGENT", "HIGH", "MEDIUM", "LOW"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        className="input !mt-0 h-10"
        value={value.status}
        onChange={(e) => set("status", e.target.value)}
      >
        <option value="">Active statuses</option>
        {statuses.map((x) => (
          <option key={x}>{x.replaceAll("_", " ")}</option>
        ))}
      </select>
      <select
        className="input !mt-0 h-10"
        value={value.employeeId}
        onChange={(e) => set("employeeId", e.target.value)}
      >
        <option value="">All employees</option>
        {employees.map((x) => (
          <option value={x.id} key={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select
        className="input !mt-0 h-10"
          value={value.due}
          onChange={(e) => set("due", e.target.value)}
        >
          <option value="ALL">All due dates</option>
          <option value="TODAY">Today</option>
          <option value="TOMORROW">Tomorrow</option>
          <option value="WEEK">This week</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CUSTOM">Custom range</option>
        </select>
        {active && (
          <button
            title="Clear filters"
            onClick={() => {
              for (const [k, v] of Object.entries({
                search: "",
                priority: "",
                status: "",
                employeeId: "",
                due: "ALL",
                from: "",
                to: "",
              }))
                set(k, v);
            }}
            className="rounded-lg p-2"
          >
            <X />
          </button>
        )}
      </div>
      {value.due === "CUSTOM" && (
        <div className="flex gap-2 sm:col-span-2">
          <input
            type="date"
          className="input !mt-0 h-10"
            value={value.from}
            onChange={(e) => set("from", e.target.value)}
          />
          <input
            type="date"
            className="input !mt-0"
            value={value.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
function Progress({ status }) {
  const value =
    {
      DRAFT: 0,
      SCHEDULED: 0,
      OPEN: 0,
      TO_DO: 10,
      IN_PROGRESS: 55,
      SUBMITTED_FOR_REVIEW: 85,
      CHANGES_REQUIRED: 65,
      COMPLETED: 100,
      ARCHIVED: 100,
    }[status] || 0;
  return (
    <div className="w-20">
      <div className="mb-1 text-[10px] text-muted-foreground">{value}%</div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-secondary">
        <div className="h-full bg-foreground" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
function Menu({ task, choose,position }) {
  const editable = ["DRAFT", "SCHEDULED", "OPEN", "TO_DO"].includes(
      task.status,
    ),
    deadline = !["DRAFT", "SCHEDULED", "ARCHIVED"].includes(task.status),
    reassign = [
      "TO_DO",
      "IN_PROGRESS",
      "SUBMITTED_FOR_REVIEW",
      "CHANGES_REQUIRED",
    ].includes(task.status);
  const actions = [
    ["view", "View"],
    editable && ["edit", "Edit"],
    deadline && ["deadline", "Change Deadline"],
    reassign && ["reassign", "Reassign"],
    ["duplicate", "Duplicate"],
    task.status === "COMPLETED" && ["archive", "Archive"],
    task.status === "ARCHIVED" && ["restore", "Restore"],
    ["DRAFT", "SCHEDULED", "ARCHIVED"].includes(task.status) && [
      "delete",
      "Permanently Delete",
    ],
  ].filter(Boolean);
  return (
    <div onClick={e=>e.stopPropagation()} style={{top:position.top,left:position.left}} className="fixed z-[80] w-48 rounded-xl border border-border bg-surface p-1 shadow-xl">
      {actions.map(([k, v]) => (
        <button
          key={k}
          onClick={() => choose(k)}
          className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-bold hover:bg-surface-secondary ${k === "delete" ? "text-danger" : ""}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
function Bulk({ count, employees, run, clear }) {
  const [priority, setPriority] = useState(""),
    [employee, setEmployee] = useState("");
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-primary-soft p-3 text-xs">
      <b>{count} selected</b>
      <select
        value={priority}
        onChange={(e) => {
          setPriority(e.target.value);
          if (e.target.value) run("PRIORITY", { priority: e.target.value });
        }}
        className="rounded-lg border border-border bg-surface p-2"
      >
        <option value="">Change priority…</option>
        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        value={employee}
        onChange={(e) => {
          setEmployee(e.target.value);
          if (e.target.value && confirm(`Reassign ${count} selected tasks?`))
            run("REASSIGN", { employeeId: Number(e.target.value) });
        }}
        className="rounded-lg border border-border bg-surface p-2"
      >
        <option value="">Reassign…</option>
        {employees.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
            {availability(x)}
          </option>
        ))}
      </select>
      <button
        onClick={() =>
          confirm(`Archive eligible tasks from ${count} selected?`) &&
          run("ARCHIVE", {})
        }
        className="rounded-lg bg-surface px-3 py-2 font-bold"
      >
        Archive eligible
      </button>
      <button
        onClick={() => {
          const typed = prompt(
            `Type DELETE to permanently delete eligible tasks from ${count} selected.`,
          );
          if (typed === "DELETE") run("DELETE", {});
        }}
        className="rounded-lg bg-danger-soft px-3 py-2 font-bold text-danger"
      >
        Delete eligible
      </button>
      <button onClick={clear} className="ml-auto">
        Clear
      </button>
    </div>
  );
}
function AdminDialog({ value, employees, close, save }) {
  const [type, task] = [value.type, value.task],
    [due, setDue] = useState(
      task.due_at ? String(task.due_at).replace(" ", "T").slice(0, 16) : "",
    ),
    [employee, setEmployee] = useState(""),
    [reason, setReason] = useState(""),
    [typed, setTyped] = useState("");
  const started = [
    "IN_PROGRESS",
    "SUBMITTED_FOR_REVIEW",
    "CHANGES_REQUIRED",
  ].includes(task.status);
  return (
    <>
      <button className="fixed inset-0 z-[60] bg-overlay/50" onClick={close} />
      <div className="fixed left-1/2 top-1/2 z-[70] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-2xl">
        <h2 className="text-xl font-black">
          {type === "deadline"
            ? "Change Deadline"
            : type === "reassign"
              ? "Reassign Task"
              : "Permanently Delete Task?"}
        </h2>
        <p className="mt-1 break-words text-sm text-muted-foreground">
          {task.title}
        </p>
        {type === "deadline" && (
          <>
            <p className="mt-4 text-sm">
              Current deadline: <b>{date(task.due_at)}</b>
            </p>
            <label className="mt-3 block text-sm font-bold">
              New Deadline
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="input"
              />
            </label>
            <label className="mt-3 block text-sm font-bold">
              Reason (optional)
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
              />
            </label>
          </>
        )}
        {type === "reassign" && (
          <>
            <label className="mt-4 block text-sm font-bold">
              New Employee
              <select
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                className="input"
              >
                <option value="">Select employee</option>
                {employees.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {availability(x)}
                  </option>
                ))}
              </select>
            </label>
            {started && (
              <label className="mt-3 block text-sm font-bold">
                Reason for Reassignment
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                />
              </label>
            )}
          </>
        )}
        {type === "delete" && (
          <div className="mt-4">
            <p className="text-sm text-danger">
              This permanently removes the task and related task records. Type
              DELETE to continue.
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="input"
              placeholder="DELETE"
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={close}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            disabled={
              type === "delete"
                ? typed !== "DELETE"
                : type === "reassign"
                  ? !employee || (started && !reason.trim())
                  : !due
            }
            onClick={() =>
              save(
                type,
                type === "deadline"
                  ? {
                      dueAt: new Date(due).toISOString(),
                      reason: reason || undefined,
                    }
                  : type === "reassign"
                    ? {
                        employeeId: Number(employee),
                        reason: reason || undefined,
                      }
                    : {},
              )
            }
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}
function availability(employee) {
  const a = employee.availability;
  if (!a) return "";
  const warnings = [];
  if (a.onLeave) warnings.push("on leave");
  if (!a.online) warnings.push("offline");
  if (!a.withinShift) warnings.push("outside shift");
  if (a.hasActiveTask) warnings.push("active task");
  warnings.push(
    `${a.activeTaskCount || 0} active`,
    `${a.overdueTaskCount || 0} overdue`,
  );
  return ` — ${warnings.join(", ")}`;
}
function Pagination({ value, setPage }) {
  if (value.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border p-4 text-sm">
      <button
        disabled={value.page <= 1}
        onClick={() => setPage(value.page - 1)}
      >
        Previous
      </button>
      <span>
        Page {value.page} of {value.pages} · {value.total} tasks
      </span>
      <button
        disabled={value.page >= value.pages}
        onClick={() => setPage(value.page + 1)}
      >
        Next
      </button>
    </div>
  );
}
