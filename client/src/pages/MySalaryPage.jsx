import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { mine } from "../services/salary.service";
import { formatDate } from "../utils/helpers";
export default function MySalaryPage() {
  const [rows, setRows] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    mine()
      .then(setRows)
      .catch(() => {
        setError("Unable to load your salary profile.");
        setRows([]);
      });
  }, []);
  const x = rows?.[0];
  return (
    <>
      <PageHeader
        title="My Salary"
        description="Your current salary and effective-date history."
      />
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>
      )}
      {x ? (
        <>
          <section className="grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-3">
            <div>
              <small className="text-slate-400">Monthly Salary</small>
              <p className="text-2xl font-black">
                Rs. {Number(x.monthlySalary).toLocaleString("en-PK")}
              </p>
            </div>
            <div>
              <small className="text-slate-400">Salary Divisor</small>
              <p className="text-xl font-bold">{x.salaryDivisor}</p>
            </div>
            <div>
              <small className="text-slate-400">Effective From</small>
              <p className="font-bold">{formatDate(x.effectiveFrom)}</p>
            </div>
          </section>
        </>
      ) : rows ? (
        <EmptyState
          title="No salary profile"
          description="Management has not configured your salary yet."
        />
      ) : (
        <p>Loading…</p>
      )}
    </>
  );
}
