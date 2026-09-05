import { useEffect, useMemo, useState } from "react";
import { Check, Save } from "lucide-react";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import usePermission from "../hooks/usePermission";
import useAuth from "../hooks/useAuth";
import {
  listPermissions,
  updateRolePermissions,
} from "../services/permission.service";
import { listRoles } from "../services/role.service";
import { errorMessage } from "../utils/helpers";
import { PERMISSIONS as P } from "../utils/permissions";
const friendly = {
  "portal.access_mobile": ["Access Portal on Mobile", "Allows this role to access the Remote Office Portal from mobile devices."],
  "dashboard.view": ["View Dashboard", "Can view the organization dashboard"],
  "attendance.clock": [
    "Clock Attendance",
    "Can clock in, take breaks, and clock out",
  ],
  "attendance.view_own": [
    "View Own Attendance",
    "Can review personal attendance records",
  ],
  "attendance.view_all": [
    "View All Attendance",
    "Can view attendance records for all employees",
  ],
  "attendance.edit": [
    "Edit Attendance",
    "Can correct employee attendance records",
  ],
  "attendance.reports": [
    "View Reports",
    "Can view daily and monthly attendance reports",
  ],
  "leave.create": ["Request Leave", "Can submit personal leave requests"],
  "leave.view_own": ["View Own Leave", "Can view personal leave history"],
  "leave.view_all": ["View All Leave", "Can view all employee leave requests"],
  "leave.approve": ["Approve Leave", "Can approve pending leave requests"],
  "leave.reject": ["Reject Leave", "Can reject pending leave requests"],
  "leave.cancel_own": [
    "Cancel Own Leave",
    "Can cancel personal pending requests",
  ],
  "leave.reports": [
    "View Leave Reports",
    "Can view deduction-ready monthly leave reports",
  ],
  "calendar.view": [
    "View Company Calendar",
    "Can view company holidays and working days",
  ],
  "calendar.manage": [
    "Manage Company Calendar",
    "Can add, edit, and cancel company off-days",
  ],
  "employees.view_own": [
    "View Own Profile",
    "Can view their own employee profile",
  ],
  "employees.view_all": [
    "View All Employees",
    "Can view all employee profiles",
  ],
  "employees.create": ["Create Employees", "Can add employee accounts"],
  "employees.update": ["Update Employees", "Can update employee profiles"],
  "employees.deactivate": [
    "Deactivate Employees",
    "Can activate or deactivate employees",
  ],
  "employees.reset_password": ["Reset Employee Password", "Can reset another employee's password"],
  "employees.delete": ["Delete Employees", "Can permanently delete employee accounts and related records"],
  "shift.view": ["View Shifts", "Can view shift templates and assignments"],
  "shift.manage": ["Manage Shifts", "Can create and update shift templates"],
  "shift.assign": ["Assign Shifts", "Can assign shifts to employees"],
  "salary.view_all": ["View All Salaries", "Can view employee salary profiles"],
  "salary.manage": ["Manage Salaries", "Can update employee salary profiles"],
  "salary.view_own": ["View Own Salary", "Can view personal salary information"],
  "payroll.view_own": ["View Own Payroll", "Can view personal payroll records"],
  "payroll.view_all": ["View All Payroll", "Can view company payroll records"],
  "payroll.generate": ["Generate Payroll", "Can generate payroll runs"],
  "payroll.recalculate": ["Recalculate Payroll", "Can recalculate draft payroll"],
  "payroll.approve": ["Approve Payroll", "Can approve payroll runs"],
  "payroll.reopen": ["Reopen Payroll", "Can reopen approved payroll"],
  "payroll.mark_paid": ["Mark Payroll Paid", "Can mark payroll as paid"],
  "payroll.adjust": ["Adjust Payroll", "Can manage payroll adjustments"],
  "reports.view": ["View Reports", "Can view company reports and analytics"],
  "reports.export": ["Export Reports", "Can export company reports"],
  "roles.view": ["View Roles", "Can view configured access roles"],
  "roles.manage": ["Manage Roles", "Can create and update roles"],
  "permissions.view": ["View Permissions", "Can view permission assignments"],
  "permissions.manage": ["Manage Permissions", "Can change role permissions"],
  "audit.view": ["View Audit Logs", "Can review system and user activity"],
};
const groupFor = (name) =>
  name.startsWith("portal.") ? "Portal Access" : name.startsWith("dashboard.")
    ? "Dashboard"
    : name.startsWith("attendance.")
      ? "Attendance"
      : name.startsWith("leave.")
        ? "Leave"
        : name.startsWith("calendar.")
          ? "Company Calendar"
          : name.startsWith("employees.")
            ? "Employees"
            : name.startsWith("shift.")
              ? "Shifts"
              : name.startsWith("salary.") || name.startsWith("payroll.")
                ? "Salary & Payroll"
                : name.startsWith("reports.")
                  ? "Reports"
            : name.startsWith("roles.") || name.startsWith("permissions.")
              ? "Roles & Permissions"
              : "System";
export default function PermissionsPage() {
  const { user, refresh: refreshAuth } = useAuth();
  const manageMobile = user.roles.some(role => ["CEO", "SUPER_ADMIN"].includes(role.toUpperCase()));
  const [roles, setRoles] = useState([]),
    [perms, setPerms] = useState([]),
    [roleId, setRoleId] = useState(""),
    [selected, setSelected] = useState([]),
    [baseline, setBaseline] = useState([]),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const manage = usePermission(P.PERMISSIONS_MANAGE);
  useEffect(() => {
    Promise.all([listRoles(), listPermissions()]).then(([r, p]) => {
      setRoles(r);
      setPerms(p);
      if (r[0]) setRoleId(String(r[0].id));
    });
  }, []);
  useEffect(() => {
    const role = roles.find((x) => String(x.id) === roleId),
      ids = role?.permissionIds || [];
    setSelected(ids);
    setBaseline(ids);
    setNotice("");
  }, [roleId, roles]);
  const groups = useMemo(
    () =>
      perms.reduce((all, p) => {
        const group = groupFor(p.name);
        (all[group] ??= []).push(p);
        return all;
      }, {}),
    [perms],
  );
  const dirty =
    [...selected].sort((a, b) => a - b).join(",") !==
    [...baseline].sort((a, b) => a - b).join(",");
  const toggle = (id) => {
    setNotice("");
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  };
  async function save() {
    setSaving(true);
    setNotice("");
    try {
      await updateRolePermissions(roleId, selected);
      const updated = await listRoles();
      setRoles(updated);
      await refreshAuth();
      setBaseline(selected);
      setNotice("Permissions updated successfully.");
    } catch (e) {
      setNotice(errorMessage(e) || "Unable to update permissions.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Permissions"
        description="Control exactly what each role can access."
      />
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <label className="block w-full max-w-xs text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Role
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-surface p-2.5 text-sm normal-case text-foreground"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          {dirty && (
            <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {Object.entries(groups).map(([group, items]) => (
            <fieldset
              key={group}
              className="rounded-2xl border border-border bg-surface-secondary/40 p-4"
            >
              <legend className="px-2 text-xs font-bold uppercase tracking-[.14em] text-primary-text">
                {group}
              </legend>
              <div className="mt-1 space-y-2">
                {items.map((p) => {
                  const [label, description] = friendly[p.name] || [
                    p.name,
                    p.description,
                  ];
                  return (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-3 shadow-sm ring-1 ring-border transition hover:ring-primary-border"
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${selected.includes(p.id) ? "border-primary-border bg-primary text-primary-foreground" : "border-border"}`}
                      >
                        {selected.includes(p.id) && <Check size={13} />}
                      </span>
                      <input
                        className="sr-only"
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        disabled={!manage || (p.name === "portal.access_mobile" && !manageMobile)}
                        onChange={() => toggle(p.id)}
                      />
                      <span className="min-w-0 break-words">
                        <b className="block text-sm">{label}</b>
                        <span className="block text-xs text-muted-foreground">
                          {description}
                        </span>
                        <code className="mt-1 block text-[10px] text-muted-foreground">
                          {p.name}
                        </code>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        {manage && (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button disabled={!dirty || saving} onClick={save}>
              <span className="flex items-center gap-2">
                <Save size={16} />
                {saving ? "Saving…" : "Save Permissions"}
              </span>
            </Button>
            {notice && (
              <span
                className={`text-sm font-medium ${notice.startsWith("Permissions updated") ? "text-primary-text" : "text-danger"}`}
              >
                {notice}
              </span>
            )}
          </div>
        )}
      </section>
    </>
  );
}
