import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import RefreshButton from "../components/common/RefreshButton";
import HolidayBadge from "../components/calendar/HolidayBadge";
import HolidayForm from "../components/calendar/HolidayForm";
import usePermission from "../hooks/usePermission";
import * as calendar from "../services/companyCalendar.service";
import { errorMessage, formatDate } from "../utils/helpers";
import { PERMISSIONS as P } from "../utils/permissions";
export default function CompanyCalendarPage() {
  const [rows, setRows] = useState([]),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const manage = usePermission(P.CALENDAR_MANAGE);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      setRows(await calendar.listDays({}));
      setNotice("");
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function save(data) {
    setBusy(true);
    try {
      const r = editing
        ? await calendar.updateDay(editing.id, {
            ...data,
            calendarDate: data.startDate,
          })
        : await calendar.createDays(data);
      setNotice(r.message);
      setOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function cancel(r) {
    if (!confirm(`Cancel ${r.title}?`)) return;
    setNotice((await calendar.cancelDay(r.id)).message);
    load();
  }
  return (
    <>
      <PageHeader
        title="Company Calendar"
        description="Monday–Saturday are working days. Sunday is the default weekly off."
        action={
          <div className="flex gap-2">
            <RefreshButton onClick={load} refreshing={busy} />
            {manage && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Holiday
                </span>
              </Button>
            )}
          </div>
        }
      />
      {notice && (
        <div className="mb-4 rounded-xl bg-primary-soft p-3 text-sm text-primary-text">
          {notice}
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-surface-secondary text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Date</th>
                  <th>Day</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-secondary">
                    <td className="p-4 font-semibold">
                      {formatDate(r.calendarDate)}
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("en-PK", {
                        weekday: "long",
                      }).format(new Date(r.calendarDate))}
                    </td>
                    <td>{r.title}</td>
                    <td>
                      <HolidayBadge type={r.dayType} />
                    </td>
                    <td className="max-w-56 truncate text-muted-foreground">
                      {r.description || "—"}
                    </td>
                    <td>{r.status}</td>
                    <td className="pr-4">
                      {manage && r.status === "ACTIVE" && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditing(r);
                              setOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="danger" onClick={() => cancel(r)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No configured holidays"
            description="Sundays are still automatically treated as weekly off."
          />
        )}
      </section>
      <Modal
        open={open}
        title={editing ? "Edit Calendar Day" : "Add Holiday or Off-Day"}
        onClose={() => setOpen(false)}
      >
        <HolidayForm entry={editing} onSubmit={save} busy={busy} />
      </Modal>
    </>
  );
}
