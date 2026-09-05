import ResponsiveTable from "../common/ResponsiveTable";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LeaveStatusBadge from "./LeaveStatusBadge";
import { formatDate } from "../../utils/helpers";
const type = (v) => `${v[0]}${v.slice(1).toLowerCase()} Leave`;
export default function LeaveHistoryTable({ rows, onCancel, busy }) {
  if (!rows.length)
    return (
      <EmptyState
        title="No leave requests"
        description="Your submitted requests will appear here."
      />
    );
  return (
    <div className="overflow-x-auto">
      <ResponsiveTable className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-surface-secondary text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-4">Leave Type</th>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>CEO Comment</th>
            <th className="pr-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface-secondary">
              <td className="p-4 font-semibold">{type(r.leaveType)}</td>
              <td>{formatDate(r.startDate)}</td>
              <td>{formatDate(r.endDate)}</td>
              <td>{r.totalDays}</td>
              <td>
                <LeaveStatusBadge status={r.status} />
              </td>
              <td>{formatDate(r.createdAt)}</td>
              <td className="max-w-48 truncate text-muted-foreground">
                {r.reviewComment || "—"}
              </td>
              <td className="pr-4">
                {r.status === "PENDING" && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onCancel(r.id)}
                  >
                    Cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </ResponsiveTable>
    </div>
  );
}
