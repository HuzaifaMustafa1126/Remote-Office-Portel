export default function AttendanceFilters({
  filters,
  onChange,
  employees = [],
  showEmployee = false,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-5">
      {showEmployee && (
        <select
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={filters.employeeId || ""}
          onChange={(e) => set("employeeId", e.target.value)}
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      )}
      <input
        type="date"
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={filters.from || ""}
        onChange={(e) => set("from", e.target.value)}
      />
      <input
        type="date"
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={filters.to || ""}
        onChange={(e) => set("to", e.target.value)}
      />
      {showEmployee && (
        <input
          placeholder="Department"
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={filters.department || ""}
          onChange={(e) => set("department", e.target.value)}
        />
      )}{" "}
      {showEmployee && (
        <select
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={filters.status || ""}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option>WORKING</option>
          <option>ON_BREAK</option>
          <option>CLOCKED_OUT</option>
        </select>
      )}
    </div>
  );
}
