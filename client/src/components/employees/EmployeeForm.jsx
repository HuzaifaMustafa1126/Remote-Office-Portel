import { useEffect, useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
const blank = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "",
  joiningDate: "",
  status: "ACTIVE",
  password: "",
  roleId: "",
};
export default function EmployeeForm({ employee, roles = [], onSubmit, busy }) {
  const [form, setForm] = useState(blank);
  useEffect(
    () =>
      setForm(
        employee
          ? {
              ...blank,
              ...employee,
              joiningDate: employee.joiningDate?.slice(0, 10) || "",
              roleId: employee.roleId || "",
            }
          : blank,
      ),
    [employee],
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Input
        required
        label="Employee code"
        value={form.employeeCode}
        onChange={(e) => set("employeeCode", e.target.value)}
      />
      <Input
        required
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
      />
      <Input
        required
        label="First name"
        value={form.firstName}
        onChange={(e) => set("firstName", e.target.value)}
      />
      <Input
        required
        label="Last name"
        value={form.lastName}
        onChange={(e) => set("lastName", e.target.value)}
      />
      <Input
        label="Phone"
        value={form.phone || ""}
        onChange={(e) => set("phone", e.target.value)}
      />
      <Input
        required
        label="Job title"
        value={form.jobTitle}
        onChange={(e) => set("jobTitle", e.target.value)}
      />
      <Input
        required
        label="Department"
        value={form.department}
        onChange={(e) => set("department", e.target.value)}
      />
      <Input
        required
        label="Joining date"
        type="date"
        value={form.joiningDate}
        onChange={(e) => set("joiningDate", e.target.value)}
      />
      {!employee && (
        <Input
          required
          label="Temporary password"
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
      )}
      <label>
        <span className="mb-1.5 block text-sm font-medium">Role</span>
        <select
          className="w-full rounded-xl border border-border px-3.5 py-2.5"
          value={form.roleId}
          onChange={(e) => set("roleId", e.target.value)}
        >
          <option value="">No role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2 flex justify-end">
        <Button disabled={busy}>
          {busy ? "Saving…" : employee ? "Save changes" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}
