import ResponsiveTable from "../components/common/ResponsiveTable";
import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { list } from "../services/salary.service";
import { formatDate } from "../utils/helpers";
export default function SalaryPage() {
  const [rows, setRows] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    list()
      .then(setRows)
      .catch(() => {
        setError("Unable to load salary profiles.");
        setRows([]);
      });
  }, []);
  return (
    <>
      <PageHeader
        title="Salary Management"
        description="Effective-dated employee salary profiles."
      />
      {error && (
        <p className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}
      <section className="overflow-x-auto rounded-2xl border bg-surface">
        {rows?.length ? (
          <ResponsiveTable className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-secondary text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "Employee",
                  "Monthly Salary",
                  "Divisor",
                  "Currency",
                  "Effective From",
                  "Effective Until",
                ].map((x) => (
                  <th key={x} className="px-4 py-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((x) => (
                <tr key={x.id}>
                  <td className="px-4 py-3">
                    <b>{x.employeeName}</b>
                    <small className="block text-muted-foreground">
                      {x.employeeCode}
                    </small>
                  </td>
                  <td className="px-4 py-3">
                    Rs. {Number(x.monthlySalary).toLocaleString("en-PK")}
                  </td>
                  <td className="px-4 py-3">{x.salaryDivisor}</td>
                  <td className="px-4 py-3">{x.currency}</td>
                  <td className="px-4 py-3">{formatDate(x.effectiveFrom)}</td>
                  <td className="px-4 py-3">{formatDate(x.effectiveUntil)}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        ) : rows ? (
          <EmptyState
            title="No salary profiles"
            description="Configure salary from an employee's Work & Salary Settings card."
          />
        ) : (
          <p className="p-8 text-center text-muted-foreground">Loading…</p>
        )}
      </section>
    </>
  );
}
