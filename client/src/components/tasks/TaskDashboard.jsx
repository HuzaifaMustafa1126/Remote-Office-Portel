import { MoreHorizontal } from "lucide-react";
import TaskAnalyticsPanel from "./TaskAnalyticsPanel";
import DashboardSection from "./dashboard/DashboardSection";
import EmployeeAvatarGroup from "./dashboard/EmployeeAvatarGroup";
import PriorityBadge from "./PriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
const progress = (s) =>
  ({
    DRAFT: 0,
    SCHEDULED: 0,
    OPEN: 0,
    TO_DO: 10,
    IN_PROGRESS: 55,
    SUBMITTED_FOR_REVIEW: 85,
    CHANGES_REQUIRED: 65,
    COMPLETED: 100,
    ARCHIVED: 100,
  })[s] || 0;
const date = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(new Date(v))
    : "No deadline";
export default function TaskDashboard({
  tasks = [],
  management,
  onSelect,
  onSummary,
  refreshKey = 0,
}) {
  const recent = [...tasks]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 7);
  return (
    <div className="space-y-5">
      <TaskAnalyticsPanel
        management={management}
        onNavigate={onSummary}
        refreshKey={refreshKey}
      />
      <DashboardSection
        title="Recent Tasks"
        action={
          <button
            onClick={() => onSummary("ALL")}
            className="text-xs font-bold"
          >
            View All
          </button>
        }
      >
        {recent.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] table-fixed text-left text-[13px]">
                <thead className="bg-surface-secondary text-xs text-muted-foreground">
                  <tr>
                    <th className="w-[31%]">Task</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Progress</th>
                    <th className="w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className="recent-task-row h-[66px] cursor-pointer transition hover:bg-surface-secondary/60"
                    >
                      <td className="pr-4">
                        <b className="block truncate">{t.title}</b>
                        <small className="block truncate text-muted-foreground">
                          {t.description || "No description"}
                        </small>
                      </td>
                      <td className="text-xs text-muted-foreground">General</td>
                      <td>
                        <EmployeeAvatarGroup
                          names={[t.assigneeName || t.assignee_name].filter(
                            Boolean,
                          )}
                        />
                      </td>
                      <td>
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td>
                        <TaskStatusBadge
                          status={t.status}
                          overdue={t.overdue}
                        />
                      </td>
                      <td className={t.overdue ? "text-danger" : ""}>
                        {date(t.due_at)}
                      </td>
                      <td>
                        <Progress value={progress(t.status)} />
                      </td>
                      <td>
                        <button
                          aria-label={`Actions for ${t.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(t);
                          }}
                          className="rounded-lg p-2 hover:bg-surface-secondary"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {recent.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="recent-task-row w-full py-3 text-left"
                >
                  <div className="flex justify-between gap-3">
                    <span className="min-w-0">
                      <b className="block truncate text-sm">{t.title}</b>
                      <small
                        className={
                          t.overdue ? "text-danger" : "text-muted-foreground"
                        }
                      >
                        {date(t.due_at)}
                      </small>
                    </span>
                    <TaskStatusBadge status={t.status} overdue={t.overdue} />
                  </div>
                  <Progress value={progress(t.status)} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid min-h-28 place-items-center text-sm text-muted-foreground">
            No recent tasks.
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
function Progress({ value }) {
  return (
    <div className="w-24">
      <span className="text-[11px] font-bold">{value}%</span>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className="task-progress h-full rounded-full bg-foreground"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
