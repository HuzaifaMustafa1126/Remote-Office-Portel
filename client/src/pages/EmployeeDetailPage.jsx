import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import Loader from "../components/common/Loader";
import StatusBadge from "../components/common/StatusBadge";
import {
  getEmployee,
  getMobilePermission,
  setMobilePermission,
} from "../services/employee.service";
import { formatDate } from "../utils/helpers";
import WorkSettingsCard from "../components/employees/WorkSettingsCard";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS as P } from "../utils/permissions";
export default function EmployeeDetailPage() {
  const canViewSettings = usePermission(P.SHIFT_VIEW),
    canAssignShift = usePermission(P.SHIFT_ASSIGN),
    canManageSalary = usePermission(P.SALARY_MANAGE),
    canManageOverrides = usePermission(P.EMPLOYEE_PERMISSION_OVERRIDE_MANAGE),
    canEditSettings = canAssignShift && canManageSalary;
  const { id } = useParams(),
    [e, setE] = useState(null),
    [mobile, setMobile] = useState(null),
    [savingMobile, setSavingMobile] = useState(false);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    getEmployee(id).then(setE);
    getMobilePermission(id)
      .then(setMobile)
      .catch(() => setMobile(null));
  }, [id]);
  if (!e) return <Loader />;
  return (
    <>
      <PageHeader
        title={`${e.firstName} ${e.lastName}`}
        description={e.employeeCode}
      />
      <div className="grid gap-5 rounded-2xl bg-surface p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Email", e.email],
          ["Phone", e.phone],
          ["Job title", e.jobTitle],
          ["Department", e.department],
          ["Joining date", formatDate(e.joiningDate)],
          ["Roles", e.roles?.join(", ") || "None"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {k}
            </p>
            <p className="mt-1 font-medium">{v || "—"}</p>
          </div>
        ))}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Status
          </p>
          <StatusBadge status={e.status} />
        </div>
      </div>
      {mobile && (
        <section className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Access &amp; Security
          </p>
          <div className="mt-4 grid items-end gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">Mobile Portal Access</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Role default: {mobile.roleAllowed ? "Allowed" : "Not allowed"}
              </p>
            </div>
            <label className="text-sm">
              Employee override
              <select
                disabled={!canManageOverrides || savingMobile}
                value={mobile.override}
                onChange={async (ev) => {
                  setSavingMobile(true);
                  try {
                    setMobile(await setMobilePermission(id, ev.target.value));
                  } finally {
                    setSavingMobile(false);
                  }
                }}
                className="mt-1 w-full rounded-lg border border-border bg-surface p-2"
              >
                <option value="INHERIT">Inherit from Role</option>
                <option value="ALLOW">Allow</option>
                <option value="DENY">Deny</option>
              </select>
            </label>
            <div>
              <p className="text-xs text-muted-foreground">Effective access</p>
              <p
                className={`mt-1 font-bold ${mobile.effectiveAllowed ? "text-success" : "text-danger"}`}
              >
                {mobile.effectiveAllowed ? "✓ Allowed" : "Not Allowed"}
              </p>
            </div>
          </div>
        </section>
      )}
      {canViewSettings && (
        <WorkSettingsCard
          employeeId={id}
          canEdit={canEditSettings}
          initialOpen={searchParams.get("setup") === "1"}
        />
      )}
    </>
  );
}
