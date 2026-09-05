import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import Loader from "../components/common/Loader";
import StatusBadge from "../components/common/StatusBadge";
import { getEmployee } from "../services/employee.service";
import { formatDate } from "../utils/helpers";
import WorkSettingsCard from "../components/employees/WorkSettingsCard";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS as P } from "../utils/permissions";
export default function EmployeeDetailPage() {
  const canViewSettings = usePermission(P.SHIFT_VIEW),
    canAssignShift = usePermission(P.SHIFT_ASSIGN),
    canManageSalary = usePermission(P.SALARY_MANAGE),
    canEditSettings = canAssignShift && canManageSalary;
  const { id } = useParams(),
    [e, setE] = useState(null);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    getEmployee(id).then(setE);
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
