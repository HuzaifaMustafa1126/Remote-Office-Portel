import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Columns3, LayoutDashboard, List, Plus, RotateCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import TaskBoard from "../components/tasks/TaskBoard";
import TaskDrawerShell from "../components/tasks/TaskDrawerShell";
import TaskFormDrawer from "../components/tasks/TaskFormDrawer";
import TaskWorkflowDialog from "../components/tasks/TaskWorkflowDialog";
import TaskManagementList from "../components/tasks/TaskManagementList";
import TaskDashboard from "../components/tasks/TaskDashboard";
import TaskDashboardErrorBoundary from "../components/tasks/TaskDashboardErrorBoundary";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS as P } from "../utils/permissions";
import {
  cancelTaskSchedule,
  claimTask,
  deleteTask,
  duplicateTask,
  getClaimStatus,
  listTasks,
  publishTask,
  transitionTask,
} from "../services/task.service";
import {
  publishPortalStateChanged,
  subscribePortalStateChanged,
} from "../utils/portalSync";
const labels = {
  ALL: "All Tasks",
  DRAFT: "Drafts",
  SCHEDULED: "Scheduled",
  OPEN: "Open Tasks",
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  SUBMITTED_FOR_REVIEW: "Submitted for Review",
  CHANGES_REQUIRED: "Changes Required",
  COMPLETED: "Completed",
};
const priority = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
export default function TaskManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dismissedNotificationTask = useRef(null);
  const management = usePermission(P.TASK_VIEW_ALL),
    canCreate = usePermission(P.TASK_CREATE),
    [tasks, setTasks] = useState([]),
    [tab, setTab] = useState("ALL"),
    [view, setView] = useState("DASHBOARD"),
    [summaryFocus, setSummaryFocus] = useState(""),
    [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(null),
    [workflow, setWorkflow] = useState(null),
    [creating, setCreating] = useState(false),
    [loading, setLoading] = useState(true),
    [busyTask, setBusyTask] = useState(null),
    [claimStatus, setClaimStatus] = useState(null),
    [detailVersion, setDetailVersion] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const next = await listTasks({});
        setTasks(next);
        if (!management) setClaimStatus(await getClaimStatus());
      } catch {
        if (!silent) setError("Unable to load tasks. Please try again.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [management],
  );
  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    const reconcile = () => {
      load(true);
      setDetailVersion((value) => value + 1);
    };
    const unsubscribe = subscribePortalStateChanged((event) => {
      if (
        [
          "TASK_STATE_CHANGED",
          "ATTENDANCE_CHANGED",
          "BREAK_CHANGED",
          "CONNECTION_RESTORED",
        ].includes(event?.type)
      )
        reconcile();
    });
    const focus = () => reconcile();
    const visible = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [load]);
  useEffect(() => {
    const id = Number(searchParams.get("task"));
    if (!id) {
      dismissedNotificationTask.current = null;
      return;
    }
    if (
      dismissedNotificationTask.current !== id &&
      Number(selected?.id) !== id
    ) {
      const found = tasks.find((x) => Number(x.id) === id);
      if (found) setSelected(found);
    }
  }, [tasks, selected, searchParams]);
  const closeSelectedTask = () => {
    dismissedNotificationTask.current = Number(selected?.id) || null;
    setSelected(null);
    const next = new URLSearchParams(searchParams);
    next.delete("task");
    setSearchParams(next, { replace: true });
  };
  const tabs = Object.keys(labels).filter(
    (x) => management || !["DRAFT", "SCHEDULED"].includes(x),
  );
  const sorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          priority[a.priority] - priority[b.priority] ||
          new Date(a.due_at || "9999-12-31") -
            new Date(b.due_at || "9999-12-31"),
      ),
    [tasks],
  );
  const boardTasks = useMemo(
    () =>
      summaryFocus === "OVERDUE"
        ? sorted.filter((x) => x.overdue)
        : summaryFocus === "UPCOMING"
          ? sorted.filter(
              (x) =>
                x.due_at &&
                new Date(x.due_at) > new Date() &&
                new Date(x.due_at) <= new Date(Date.now() + 7 * 86400000),
            )
          : summaryFocus.startsWith("PRIORITY_")
            ? sorted.filter(
                (x) => x.priority === summaryFocus.replace("PRIORITY_", ""),
              )
            : sorted,
    [sorted, summaryFocus],
  );
  const summaryClick = (value) => {
    if (typeof value === "object") {
      if (value.employeePerformance) {
        navigate(`/tasks/employees/${value.employeePerformance}`);
        return;
      }
      if (management) {
        const next = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          },
          nextWeek = value.due === "NEXT_WEEK",
          stored = {
            search: "",
            priority: value.priority || "",
            status: value.status || "",
            employeeId: value.employeeId || "",
            due: nextWeek
              ? "CUSTOM"
              : value.due || value.overdue
                ? value.due || "OVERDUE"
                : value.upcoming
                  ? "WEEK"
                  : "ALL",
            from: nextWeek ? next(8) : "",
            to: nextWeek ? next(14) : "",
            page: 1,
          };
        sessionStorage.setItem(
          "task-management-filters",
          JSON.stringify(stored),
        );
        setView("LIST");
        return;
      }
      const key = value.overdue
        ? "OVERDUE"
        : value.upcoming
          ? "UPCOMING"
          : value.priority
            ? `PRIORITY_${value.priority}`
            : value.status || "ALL";
      setSummaryFocus(key);
      setTab(value.status || "ALL");
      setView("BOARD");
      return;
    }
    setSummaryFocus(value);
    setTab(["OVERDUE", "UPCOMING", "ALL"].includes(value) ? "ALL" : value);
    setView("BOARD");
  };
  const counts = Object.fromEntries(
    Object.keys(labels).map((k) => [
      k,
      k === "ALL" ? tasks.length : tasks.filter((t) => t.status === k).length,
    ]),
  );
  const done = async (text) => {
    setCreating(false);
    setEditing(null);
    setWorkflow(null);
    setNotice(text);
    setDetailVersion((x) => x + 1);
    await load(true);
    publishPortalStateChanged("TASK_STATE_CHANGED");
  };
  const action = async (type, task) => {
    setNotice("");
    if (type === "edit" || type === "schedule") {
      setEditing(task);
      return;
    }
    if (["submit", "complete", "changes"].includes(type)) {
      setWorkflow({ action: type, task });
      return;
    }
    setBusyTask(task.id);
    try {
      if (type === "delete") {
        if (!confirm(`Delete draft task “${task.title}”?`)) return;
        await deleteTask(task.id);
        await done("Task deleted.");
      } else if (type === "publish") {
        if (!confirm(`Publish “${task.title}” now?`)) return;
        await publishTask(task.id);
        await done("Task published.");
      } else if (type === "cancel") {
        if (!confirm("Cancel this schedule and move the task to Drafts?"))
          return;
        await cancelTaskSchedule(task.id);
        await done("Schedule cancelled. Task moved to Drafts.");
      } else if (type === "duplicate") {
        await duplicateTask(task.id);
        setTab("DRAFT");
        await done("Task duplicated as a draft.");
      } else if (type === "claim") {
        await claimTask(task.id);
        setTab("TO_DO");
        await done("Task assigned to you successfully.");
      } else if (type === "start" || type === "resume") {
        await transitionTask(task.id, { status: "IN_PROGRESS" });
        setTab("IN_PROGRESS");
        await done(type === "resume" ? "Task resumed." : "Task started.");
      }
    } catch (e) {
      const raw = e.response?.data?.message || "Unable to update the task.",
        stale =
          e.response?.status === 409 &&
          /claimed|transition|available/i.test(raw);
      setNotice(stale ? `${raw} The latest task status has been loaded.` : raw);
      setDetailVersion((value) => value + 1);
      await load(true);
    } finally {
      setBusyTask(null);
    }
  };
  const select = (task) =>
    ["DRAFT", "SCHEDULED"].includes(task.status) && management
      ? setEditing(task)
      : setSelected(task);
  const activeTask = management
    ? null
    : tasks.find(
        (x) => x.status === "IN_PROGRESS" && x.activeSessionStartedAt,
      );
  return (
    <main className={`task-management-canvas mx-auto min-w-0 max-w-[1740px] px-0 pb-8 ${view === "DASHBOARD" ? "task-dashboard-view" : ""}`}>
      <div className="task-page-header relative">
        <PageHeader
        title="Task Management"
        description="Manage team tasks, deadlines and project progress efficiently."
        action={
          canCreate ? (
            <button
              onClick={() => setCreating(true)}
              className="task-create-button flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-background shadow-sm transition"
            >
              <Plus size={17} />
              Create Task
            </button>
          ) : null
        }
        />
      </div>
      {!management && claimStatus && (
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          Open Tasks Claimed: {claimStatus.claimed} / {claimStatus.limit}
        </p>
      )}
      {notice && (
        <div
          role="status"
          className={`mb-4 rounded-xl p-3 text-sm ${/unable|cannot|already|limit|required|permission/i.test(notice) ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}
        >
          {notice}
        </div>
      )}
      <div className="task-view-controls mb-5 flex flex-wrap items-center justify-between gap-3">
        {view !== "DASHBOARD" && (
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
            {tabs.map((x) => (
              <button
                key={x}
                onClick={() => {
                  setTab(x);
                  setSummaryFocus("");
                }}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${tab === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-secondary"}`}
              >
                {labels[x]} <span className="ml-1 opacity-70">{counts[x]}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => setView("DASHBOARD")}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === "DASHBOARD" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </button>
          <button
            onClick={() => setView("BOARD")}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === "BOARD" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Columns3 size={14} />
            Board View
          </button>
          {management && (
            <button
              onClick={() => setView("LIST")}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === "LIST" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <List size={14} />
              List View
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div
          className={
            view === "DASHBOARD"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
              : "flex gap-3 overflow-hidden"
          }
        >
          {(view === "DASHBOARD" ? [1, 2, 3, 4] : [1, 2, 3]).map((x) => (
            <div
              key={x}
              className={`${view === "DASHBOARD" ? "h-32" : "h-72 w-[285px] shrink-0"} animate-pulse rounded-xl bg-surface-secondary`}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger-border bg-surface p-8 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => load()}
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold"
          >
            <RotateCw size={15} />
            Retry
          </button>
        </div>
      ) : view === "DASHBOARD" ? (
        <TaskDashboardErrorBoundary resetKey={detailVersion}>
          <TaskDashboard
            tasks={sorted}
            management={management}
            onSelect={select}
            onSummary={summaryClick}
            refreshKey={detailVersion}
          />
        </TaskDashboardErrorBoundary>
      ) : view === "BOARD" ? (
        <TaskBoard
          tasks={boardTasks}
          management={management}
          activeTab={tab}
          onSelect={select}
          onAction={action}
          activeTask={activeTask}
          claimStatus={claimStatus}
          busyTask={busyTask}
        />
      ) : (
        <TaskManagementList
          onView={setSelected}
          onEdit={setEditing}
          onChanged={() => {
            load(true);
            publishPortalStateChanged("TASK_STATE_CHANGED");
          }}
          refreshKey={detailVersion}
        />
      )}
      <TaskDrawerShell
        task={selected}
        onClose={closeSelectedTask}
        management={management}
        onAction={action}
        refreshKey={detailVersion}
        busy={Number(busyTask) === Number(selected?.id)}
      />
      {(creating || editing) && (
        <TaskFormDrawer
          task={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={done}
        />
      )}{" "}
      {workflow && (
        <TaskWorkflowDialog
          action={workflow.action}
          task={workflow.task}
          onClose={() => setWorkflow(null)}
          onDone={done}
          onConflict={(message) => {
            setWorkflow(null);
            setNotice(`${message} The latest task state has been loaded.`);
            setDetailVersion((value) => value + 1);
            load(true);
          }}
        />
      )}
    </main>
  );
}
