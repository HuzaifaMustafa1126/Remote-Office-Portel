import { useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import LeaveStatusBadge from "./LeaveStatusBadge";
import { formatDate } from "../../utils/helpers";
export default function LeaveReviewModal({
  request,
  onClose,
  onApprove,
  onReject,
  busy,
}) {
  const [comment, setComment] = useState("");
  if (!request) return null;
  return (
    <Modal open title="Review Leave Request" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl bg-surface-secondary p-4">
          <div className="flex justify-between">
            <div>
              <p className="font-bold">{request.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {request.employeeCode} • {request.department}
              </p>
            </div>
            <LeaveStatusBadge status={request.status} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p>
              <span className="text-muted-foreground">From:</span>{" "}
              {formatDate(request.startDate)}
            </p>
            <p>
              <span className="text-muted-foreground">To:</span>{" "}
              {formatDate(request.endDate)}
            </p>
            <p>
              <span className="text-muted-foreground">Type:</span> {request.leaveType}
            </p>
            <p>
              <span className="text-muted-foreground">Days:</span> {request.totalDays}
            </p>
          </div>
          <p className="mt-4 text-sm">
            <span className="text-muted-foreground">Reason:</span> {request.reason}
          </p>
        </div>
        {request.days?.some((d) => d.hasAttendanceConflict) && (
          <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
            Attendance exists on one or more requested leave days. Management
            reconciliation is required.
          </p>
        )}
        <label className="block text-sm font-semibold">
          Review Comment
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1.5 w-full resize-none rounded-xl border border-border p-3 font-normal"
          />
        </label>
        {request.status === "PENDING" && (
          <div className="flex justify-end gap-3">
            <Button
              variant="danger"
              disabled={busy || comment.trim().length < 3}
              onClick={() => onReject(comment)}
            >
              Reject
            </Button>
            <Button disabled={busy} onClick={() => onApprove(comment)}>
              Approve
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
