import { useEffect, useState } from "react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import usePermission from "../hooks/usePermission";
import { createRole, listRoles, updateRole } from "../services/role.service";
import { PERMISSIONS as P } from "../utils/permissions";
export default function RolesPage() {
  const [roles, setRoles] = useState([]),
    [open, setOpen] = useState(false),
    [current, setCurrent] = useState(null),
    [name, setName] = useState("");
  const manage = usePermission(P.ROLES_MANAGE);
  const load = () => listRoles().then(setRoles);
  useEffect(() => {
    load();
  }, []);
  async function submit(e) {
    e.preventDefault();
    current
      ? await updateRole(current.id, { name })
      : await createRole({ name });
    setOpen(false);
    load();
  }
  return (
    <>
      <PageHeader
        title="Roles"
        description="Group permissions into reusable access roles."
        action={
          manage ? (
            <Button
              onClick={() => {
                setCurrent(null);
                setName("");
                setOpen(true);
              }}
            >
              Create role
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex justify-between">
              <h2 className="font-bold">{r.name}</h2>
              <span className="text-xs text-slate-400">
                {r.userCount} users
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {r.permissions.length} permissions assigned
            </p>
            {manage && (
              <button
                className="mt-5 text-sm font-semibold text-indigo-600"
                onClick={() => {
                  setCurrent(r);
                  setName(r.name);
                  setOpen(true);
                }}
              >
                Edit role
              </button>
            )}
          </div>
        ))}
      </div>
      <Modal
        open={open}
        title={current ? "Edit role" : "Create role"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit} className="space-y-5">
          <Input
            required
            label="Role name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button>Save role</Button>
        </form>
      </Modal>
    </>
  );
}
