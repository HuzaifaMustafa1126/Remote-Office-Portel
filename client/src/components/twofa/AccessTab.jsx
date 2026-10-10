import { Plus, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { listEmployees } from "../../services/employee.service";
import * as twofa from "../../services/twofa.service";
import { errorMessage } from "../../utils/helpers";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Modal from "../common/Modal";

function GrantModal({ open, existing, onClose, onSaved }) {
  const [employees, setEmployees] = useState([]),
    [employeeId, setEmployeeId] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    listEmployees({})
      .then((response) =>
        setEmployees(
          response.data.filter(
            (employee) =>
              employee.status === "ACTIVE" &&
              !existing.has(Number(employee.id)),
          ),
        ),
      )
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [open, existing]);
  const submit = async (event) => {
    event.preventDefault();
    if (!employeeId) return setError("Select an employee.");
    setBusy(true);
    try {
      await twofa.grantAccess(existing.profileId, {
        employeeId: Number(employeeId),
      });
      onSaved();
      setEmployeeId("");
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} title="Grant Access" onClose={() => !busy && onClose()}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Employee</span>
          <select
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2.5"
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>{busy ? "Granting…" : "Grant Access"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AccessTab({ profileId, setNotice }) {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [grantOpen, setGrantOpen] = useState(false),
    [savingId, setSavingId] = useState(null);
  const load = async () => {
    setLoading(true);
    try {
      setRows(await twofa.listAccess(profileId));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [profileId]);
  const revoke = async (row) => {
    if (!confirm(`Revoke ${row.employeeName}'s access to this profile?`))
      return;
    setSavingId(row.employeeId);
    try {
      await twofa.revokeAccess(profileId, row.employeeId);
      setNotice("Employee access revoked successfully.");
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSavingId(null);
    }
  };
  const existing = new Set(rows.map((row) => Number(row.employeeId)));
  existing.profileId = profileId;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Employee Access</h2>
          <p className="text-sm text-muted-foreground">
            All active employees can see this profile. Grant access to allow
            permitted employees to manage credentials and reveal stored values.
          </p>
        </div>
        <Button onClick={() => setGrantOpen(true)}>
          <span className="flex items-center gap-2">
            <Plus size={16} /> Grant Access
          </span>
        </Button>
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
        <div className="h-48 animate-pulse rounded-2xl bg-surface-secondary" />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <article
              key={row.employeeId}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex min-w-56 items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary-text">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <p className="font-semibold">{row.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.accessType === "OWNER"
                        ? "Profile owner"
                        : "Access granted"}
                    </p>
                  </div>
                </div>
                <div className="flex-1" />
                {row.accessType !== "OWNER" && (
                  <button
                    disabled={savingId === row.employeeId}
                    onClick={() => revoke(row)}
                    aria-label={`Revoke ${row.employeeName}`}
                    className="self-end rounded-lg p-2 text-danger hover:bg-danger-soft lg:self-center"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Employee Access"
          description="Grant access to an active employee."
        />
      )}
      <GrantModal
        open={grantOpen}
        existing={existing}
        onClose={() => setGrantOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
