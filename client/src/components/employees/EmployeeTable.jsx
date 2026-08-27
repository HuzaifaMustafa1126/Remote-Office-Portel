import { Eye, Pencil, Power } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";
export default function EmployeeTable({
  employees,
  onEdit,
  onStatus,
  canEdit,
  canDeactivate,
}) {
  if (!employees.length) return <EmptyState title="No employees found" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {[
              "Employee",
              "Department",
              "Shift",
              "Schedule",
              "Salary",
              "Configuration",
              "Status",
              "Actions",
            ].map((x) => (
              <th className="px-5 py-3" key={x}>
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr className="border-b last:border-0 hover:bg-slate-50" key={e.id}>
              <td className="px-5 py-4">
                <p className="font-semibold">
                  {e.firstName} {e.lastName}
                </p>
                <p className="text-xs text-slate-500">{e.email}</p>
              </td>
              <td className="px-5">{e.department}</td>
              <td className="px-5">{e.shiftName||"Not Assigned"}</td>
              <td className="px-5">{e.schedule||"—"}</td>
              <td className="px-5">{e.monthlySalary!==undefined?(e.monthlySalary?`Rs. ${Number(e.monthlySalary).toLocaleString("en-PK")}`:"Not Set"):"Restricted"}</td>
              <td className="px-5"><span title={e.missingConfiguration?.length?`Missing: ${e.missingConfiguration.join(", ")}`:"Complete"} className={`rounded-full px-2 py-1 text-[10px] font-bold ${e.configurationReady?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{e.configurationReady?"READY":"SETUP REQUIRED"}</span></td>
              <td className="px-5">
                <StatusBadge status={e.status} />
              </td>
              <td className="px-5">
                <div className="flex gap-1">
                  <Link
                    className="rounded-lg p-2 hover:bg-indigo-50 hover:text-indigo-600"
                    to={`/employees/${e.id}`}
                  >
                    <Eye size={17} />
                  </Link>
                  {!e.configurationReady&&<Link className="whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50" to={`/employees/${e.id}?setup=1`}>Complete Setup</Link>}
                  {canEdit && (
                    <button
                      className="rounded-lg p-2 hover:bg-indigo-50"
                      onClick={() => onEdit(e)}
                    >
                      <Pencil size={17} />
                    </button>
                  )}
                  {canDeactivate && (
                    <button
                      title={e.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      className="rounded-lg p-2 hover:bg-red-50"
                      onClick={() => onStatus(e)}
                    >
                      <Power size={17} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
