import { useEffect, useState } from "react";
import * as api from "../../services/dayEndReport.service";
const labels = {
  DAY_END_REPORT_SUBMITTED: "Report submitted",
  DAY_END_REPORT_UPDATED: "Report updated",
  DAY_END_REPORT_REVIEWED: "Marked as reviewed",
  DAY_END_REPORT_REPLY_CREATED: "Reply added",
};
export default function ReportActivity({ reportId }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api
      .getActivity(reportId)
      .then(setItems)
      .catch(() => setItems([]));
  }, [reportId]);
  return (
    <section className="border-t border-border pt-5">
      <h3 className="font-black">Activity</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 text-sm">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <div>
              <b>{labels[item.type] || item.message}</b>
              <p className="text-xs text-muted-foreground">
                {item.actorName} ·{" "}
                {new Intl.DateTimeFormat("en-PK", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(item.createdAt))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
