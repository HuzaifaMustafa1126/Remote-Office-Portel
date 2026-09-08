import { useCallback, useEffect, useMemo, useState } from "react";
import { Columns3, List, Plus, RotateCw } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import TaskBoard from "../components/tasks/TaskBoard";
import TaskDrawerShell from "../components/tasks/TaskDrawerShell";
import TaskFormDrawer from "../components/tasks/TaskFormDrawer";
import TaskWorkflowDialog from "../components/tasks/TaskWorkflowDialog";
import TaskManagementList from "../components/tasks/TaskManagementList";
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
  const management = usePermission(P.TASK_VIEW_ALL),
    canCreate = usePermission(P.TASK_CREATE),
    [tasks, setTasks] = useState([]),
    [tab, setTab] = useState("ALL"),
    [view, setView] = useState("BOARD"),
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
    : tasks.find((x) => x.status === "IN_PROGRESS");
  return (
    <main className="min-w-0">
      <PageHeader
        title="Task Management"
        description="Manage and track team work"
        action={
          canCreate ? (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus size={17} />
              Create Task
            </button>
          ) : null
        }
      />
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
          {tabs.map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${tab === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-secondary"}`}
            >
              {labels[x]} <span className="ml-1 opacity-70">{counts[x]}</span>
            </button>
          ))}
        </div>
        {management && (
          <div className="flex rounded-xl border border-border bg-surface p-1">
            <button
              onClick={() => setView("BOARD")}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === "BOARD" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Columns3 size={14} />
              Board View
            </button>
            <button
              onClick={() => setView("LIST")}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === "LIST" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <List size={14} />
              List View
            </button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((x) => (
            <div
              key={x}
              className="h-72 w-[285px] shrink-0 animate-pulse rounded-2xl bg-surface-secondary"
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
      ) : view === "BOARD" ? (
        <TaskBoard
          tasks={sorted}
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
          onChanged={() => load(true)}
        />
      )}
      <TaskDrawerShell
        task={selected}
        onClose={() => setSelected(null)}
        management={management}
        onAction={action}
        refreshKey={detailVersion}
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
        />
      )}
    </main>
  );
}
