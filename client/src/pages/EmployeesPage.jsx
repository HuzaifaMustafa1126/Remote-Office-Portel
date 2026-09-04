import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeTable from "../components/employees/EmployeeTable";
import PasswordInput from "../components/common/PasswordInput";
import useAuth from "../hooks/useAuth";
import usePermission from "../hooks/usePermission";
import * as emp from "../services/employee.service";
import { listRoles } from "../services/role.service";
import { errorMessage } from "../utils/helpers";
import { PERMISSIONS as P } from "../utils/permissions";
export default function EmployeesPage() {
  const [rows, setRows] = useState([]),
    [roles, setRoles] = useState([]),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState(null),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [resetting, setResetting] = useState(null),
    [deleting, setDeleting] = useState(null),
    [password, setPassword] = useState({ newPassword: "", confirmPassword: "" }),
    [params] = useSearchParams();
  const { user } = useAuth();
  const canCreate = usePermission(P.EMPLOYEES_CREATE),
    canEdit = usePermission(P.EMPLOYEES_UPDATE),
    canDeactivate = usePermission(P.EMPLOYEES_DEACTIVATE),
    canResetPassword = usePermission(P.EMPLOYEES_RESET_PASSWORD),
    canDelete = usePermission(P.EMPLOYEES_DELETE);
  async function load() {
    const r = await emp.listEmployees({ search: query }); setRows(r.data);
  }
  useEffect(() => {
    load();
  }, [query]);
  useEffect(() => {
    listRoles()
      .then(setRoles)
      .catch(() => {});
    if (params.get("create") && canCreate) setOpen(true);
  }, []);
  async function save(data) {
    setBusy(true);
    setNotice("");
    try {
      const r = editing
        ? await emp.updateEmployee(editing.id, data)
        : await emp.createEmployee(data);
      setNotice(r.message);
      setOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function status(e) {
    if (
      !confirm(
        `${e.status === "ACTIVE" ? "Deactivate" : "Activate"} ${e.firstName}?`,
      )
    )
      return;
    try {
      await emp.setEmployeeStatus(
        e.id,
        e.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      );
      load();
    } catch (x) {
      setNotice(errorMessage(x));
    }
  }
  async function resetPassword(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    if (password.newPassword.length < 8) { setNotice("Password must contain at least 8 characters."); setBusy(false); return; }
    if (password.newPassword !== password.confirmPassword) { setNotice("Passwords do not match."); setBusy(false); return; }
    try { const r = await emp.resetPassword(resetting.id, password); setNotice(r.message); setResetting(null); setPassword({ newPassword: "", confirmPassword: "" }); }
    catch (x) { setNotice(errorMessage(x)); } finally { setBusy(false); }
  }
  async function removeEmployee() {
    setBusy(true); setNotice("");
    try { const r = await emp.deleteEmployee(deleting.id); setNotice(r.message); setDeleting(null); await load(); }
    catch (x) { setNotice(errorMessage(x)); } finally { setBusy(false); }
  }
  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee profiles and access."
        action={
          canCreate ? (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <span className="flex items-center gap-2">
                <Plus size={17} />
                Add employee
              </span>
            </Button>
          ) : null
        }
      />
      {notice && (
        <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">
          {notice}
        </div>
      )}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500"
          />
        </div>
        </div>
        <EmployeeTable
          employees={rows}
          canEdit={canEdit}
          canDeactivate={canDeactivate}
          canResetPassword={canResetPassword}
          canDelete={canDelete}
          onEdit={(e) => {
            setEditing(e);
            setOpen(true);
          }}
          onStatus={status}
          onResetPassword={setResetting}
          onDelete={(e) => { if (Number(user.employeeId) === Number(e.id)) setNotice("You cannot delete your own account."); else setDeleting(e); }}
        />
      </div>
      <Modal
        open={open}
        title={editing ? "Edit employee" : "Add employee"}
        onClose={() => setOpen(false)}
      >
        <EmployeeForm
          employee={editing}
          roles={roles}
          onSubmit={save}
          busy={busy}
        />
      </Modal>
      <Modal open={Boolean(resetting)} title="Reset Password" onClose={() => !busy && setResetting(null)}>
        {resetting && <form className="space-y-4" onSubmit={resetPassword}>
          <div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold">{resetting.firstName} {resetting.lastName}</p><p className="text-sm text-slate-500">{resetting.email}</p></div>
          <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" label="New Password *" value={password.newPassword} onChange={(e) => setPassword({...password,newPassword:e.target.value})}/>
          <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" label="Confirm Password *" value={password.confirmPassword} onChange={(e) => setPassword({...password,confirmPassword:e.target.value})}/>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => setResetting(null)}>Cancel</Button><Button disabled={busy}>{busy ? "Resetting…" : "Reset Password"}</Button></div>
        </form>}
      </Modal>
      <Modal open={Boolean(deleting)} title="Permanently Delete Employee?" onClose={() => !busy && setDeleting(null)}>
        {deleting && <div><p className="text-slate-700">You are about to permanently delete <b>{deleting.firstName} {deleting.lastName}</b>.</p><p className="mt-3 text-sm font-medium text-red-600">Their account and all attendance, salary, leave, shift, payroll, and related records will be permanently removed. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" disabled={busy} onClick={removeEmployee}>{busy ? "Deleting…" : "Delete Permanently"}</Button></div></div>}
      </Modal>
    </>
  );
}
